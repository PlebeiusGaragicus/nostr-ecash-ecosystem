// Live feed state: kind-1 notes, kind-0 profiles, and kind-30315 statuses of
// the logged-in user's follows, all through the cyphertap API.
import { cyphertap, type SimpleNostrEvent } from 'cyphertap';
import { SvelteMap } from 'svelte/reactivity';
import { STATUS_KIND, STATUS_DTAG } from './status.js';

export interface Profile {
	name?: string;
	display_name?: string;
	picture?: string;
}

const MAX_NOTES = 200;
const NOW = () => Math.floor(Date.now() / 1000);

export class FeedState {
	notes = $state<SimpleNostrEvent[]>([]);
	profiles = new SvelteMap<string, Profile>();
	statuses = new SvelteMap<string, SimpleNostrEvent>();
	followCount = $state(0);
	loading = $state(false);
	error = $state('');
	/** Ticks every 30s so relative timestamps and status expiry stay live. */
	now = $state(NOW());

	#seen = new Set<string>();
	#unsubs: (() => void)[] = [];
	#ticker: ReturnType<typeof setInterval> | undefined;

	async start(): Promise<void> {
		this.loading = true;
		this.error = '';
		try {
			const me = cyphertap.getUserHex();
			const follows = await cyphertap.getFollows();
			const authors = me ? [...new Set([me, ...follows])] : follows;
			this.followCount = follows.length;

			this.#unsubs.push(
				cyphertap.subscribe({ kinds: [1], authors, limit: 100 }, (e) => this.#addNote(e)),
				cyphertap.subscribeLatest({ kinds: [0], authors }, (e) => {
					try {
						this.profiles.set(e.pubkey, JSON.parse(e.content));
					} catch {
						// unparseable profile — ignore
					}
				}),
				cyphertap.subscribeLatest(
					{ kinds: [STATUS_KIND], '#d': [STATUS_DTAG], authors },
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
		this.#seen.clear();
		this.notes = [];
		this.profiles.clear();
		this.statuses.clear();
		this.followCount = 0;
	}

	displayName(pubkey: string): string {
		const p = this.profiles.get(pubkey);
		return p?.display_name || p?.name || `${pubkey.slice(0, 8)}…`;
	}

	#addNote(e: SimpleNostrEvent) {
		if (this.#seen.has(e.id)) return;
		this.#seen.add(e.id);
		this.notes = [...this.notes, e]
			.sort((a, b) => b.created_at - a.created_at)
			.slice(0, MAX_NOTES);
	}
}
