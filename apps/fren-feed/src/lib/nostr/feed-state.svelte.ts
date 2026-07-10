// Live feed state: kind-1 notes, kind-0 profiles, and kind-30315 statuses of
// the logged-in user's follows, all through the cyphertap API.
import { cyphertap, type SimpleNostrEvent } from 'cyphertap';
import { SvelteMap } from 'svelte/reactivity';
import { STATUS_KIND, STATUS_DTAG } from './status.js';
import { parentId } from './nip10.js';

export interface Profile {
	name?: string;
	display_name?: string;
	picture?: string;
}

const NOW = () => Math.floor(Date.now() / 1000);
const OLDER_PAGE_SIZE = 50;

export class FeedState {
	notes = $state<SimpleNostrEvent[]>([]);
	profiles = new SvelteMap<string, Profile>();
	statuses = new SvelteMap<string, SimpleNostrEvent>();
	/** Parent notes of replies in the feed, keyed by event id. */
	parents = new SvelteMap<string, SimpleNostrEvent>();
	followCount = $state(0);
	loading = $state(false);
	loadingOlder = $state(false);
	/** True once a loadOlder() round returned nothing new. */
	exhausted = $state(false);
	error = $state('');
	/** Ticks every 30s so relative timestamps and status expiry stay live. */
	now = $state(NOW());

	#authors: string[] = [];
	#seen = new Set<string>();
	#unsubs: (() => void)[] = [];
	#ticker: ReturnType<typeof setInterval> | undefined;

	// batched lazy lookups (mention profiles / reply parents)
	#wantedProfiles = new Set<string>();
	#wantedParents = new Set<string>();
	#flushTimer: ReturnType<typeof setTimeout> | undefined;

	async start(): Promise<void> {
		this.loading = true;
		this.error = '';
		try {
			const me = cyphertap.getUserHex();
			const follows = await cyphertap.getFollows();
			this.#authors = me ? [...new Set([me, ...follows])] : follows;
			this.followCount = follows.length;

			this.#unsubs.push(
				cyphertap.subscribe({ kinds: [1], authors: this.#authors, limit: 100 }, (e) =>
					this.#addNote(e)
				),
				cyphertap.subscribeLatest({ kinds: [0], authors: this.#authors }, (e) =>
					this.#addProfile(e)
				),
				cyphertap.subscribeLatest(
					{ kinds: [STATUS_KIND], '#d': [STATUS_DTAG], authors: this.#authors },
					(e) => {
						// client-side d check — subscribeLatest dedups per d tag, and
						// some relays don't index #d
						if (e.tags.find((t) => t[0] === 'd')?.[1] !== STATUS_DTAG) return;
						if (e.content.trim() === '') this.statuses.delete(e.pubkey);
						else this.statuses.set(e.pubkey, e);
					}
				)
			);
			this.#ticker = setInterval(() => (this.now = NOW()), 30_000);
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
		} finally {
			this.loading = false;
		}
	}

	stop(): void {
		for (const unsub of this.#unsubs) unsub();
		this.#unsubs = [];
		if (this.#ticker) clearInterval(this.#ticker);
		if (this.#flushTimer) clearTimeout(this.#flushTimer);
		this.#seen.clear();
		this.#wantedProfiles.clear();
		this.#wantedParents.clear();
		this.notes = [];
		this.profiles.clear();
		this.statuses.clear();
		this.parents.clear();
		this.followCount = 0;
		this.exhausted = false;
		this.#authors = [];
	}

	/** Backfill one page of older notes (until-pagination). */
	async loadOlder(): Promise<void> {
		if (this.loadingOlder || !this.notes.length) return;
		this.loadingOlder = true;
		try {
			const oldest = this.notes[this.notes.length - 1].created_at;
			const older = await cyphertap.fetchEvents({
				kinds: [1],
				authors: this.#authors,
				until: oldest - 1,
				limit: OLDER_PAGE_SIZE
			});
			const fresh = older.filter((e) => !this.#seen.has(e.id));
			if (!fresh.length) this.exhausted = true;
			for (const e of fresh) this.#addNote(e);
		} finally {
			this.loadingOlder = false;
		}
	}

	displayName(pubkey: string): string {
		const p = this.profiles.get(pubkey);
		if (!p) this.#want(this.#wantedProfiles, pubkey);
		return p?.display_name || p?.name || `${pubkey.slice(0, 8)}…`;
	}

	#addProfile(e: SimpleNostrEvent) {
		try {
			this.profiles.set(e.pubkey, JSON.parse(e.content));
		} catch {
			// unparseable profile — ignore
		}
	}

	#addNote(e: SimpleNostrEvent) {
		if (this.#seen.has(e.id)) return;
		this.#seen.add(e.id);
		this.notes = [...this.notes, e].sort((a, b) => b.created_at - a.created_at);

		const parent = parentId(e);
		if (parent && !this.parents.has(parent)) this.#want(this.#wantedParents, parent);
	}

	/** Queue a lazy lookup; batches flush together 100ms after the first ask. */
	#want(bucket: Set<string>, id: string) {
		if (bucket.has(id)) return;
		bucket.add(id);
		this.#flushTimer ??= setTimeout(() => this.#flush(), 100);
	}

	async #flush() {
		this.#flushTimer = undefined;
		const profilePubkeys = [...this.#wantedProfiles].filter((p) => !this.profiles.has(p));
		const parentIds = [...this.#wantedParents].filter((id) => !this.parents.has(id));
		this.#wantedProfiles.clear();
		this.#wantedParents.clear();

		await Promise.all([
			profilePubkeys.length
				? cyphertap
						.fetchEvents({ kinds: [0], authors: profilePubkeys })
						.then((events) => events.forEach((e) => this.#addProfile(e)))
						.catch(() => {})
				: null,
			parentIds.length
				? cyphertap
						.fetchEvents({ ids: parentIds })
						.then((events) => events.forEach((e) => this.parents.set(e.id, e)))
						.catch(() => {})
				: null
		]);
	}
}
