// Own NIP-65 relay list (kind 10002). Two spec duties live here:
//
// 1. Advertise where this user writes and reads: on login, make sure a
//    relay list matching the app's RELAYS exists — published to our pool
//    and to the relay-list indexer so any client can discover it.
// 2. "Send the author's kind:10002 event to all relays the event was
//    published to": every reply rebroadcasts the (already-signed) list to
//    its target relays, so recipients' relays learn where to find us.
import { cyphertap, type SimpleNostrEvent } from 'cyphertap';
import { RELAYS } from '$lib/relays.js';

const RELAY_LIST_KIND = 10002;
const INDEXERS = ['wss://purplepag.es'];
const normalize = (url: string) => url.replace(/\/+$/, '');

let ownRelayList: SimpleNostrEvent | undefined;

/**
 * Publish the user's relay list if it's missing or its relay set differs
 * from the app's. Same URL set → keep the existing event untouched (the
 * user may have curated read/write markers in another client).
 */
export async function ensureOwnRelayList(): Promise<void> {
	const me = cyphertap.getUserHex();
	if (!me) return;

	const existing = (await cyphertap.fetchEvents({ kinds: [RELAY_LIST_KIND], authors: [me] }))[0];
	const desired = new Set(RELAYS.map(normalize));
	const current = new Set(
		(existing?.tags ?? []).filter((t) => t[0] === 'r' && t[1]).map((t) => normalize(t[1]))
	);
	const same = desired.size === current.size && [...desired].every((u) => current.has(u));
	if (existing && same) {
		ownRelayList = existing;
		return;
	}

	// unmarked r tags = read AND write (our relays serve both roles)
	await cyphertap.publishEvent(
		{ kind: RELAY_LIST_KIND, content: '', tags: RELAYS.map((u) => ['r', u]) },
		{ relays: [...RELAYS, ...INDEXERS] }
	);
	ownRelayList = (await cyphertap.fetchEvents({ kinds: [RELAY_LIST_KIND], authors: [me] }))[0];
}

export function clearOwnRelayList(): void {
	ownRelayList = undefined;
}

/**
 * Rebroadcast the signed relay-list event to the given relays. Passing the
 * full raw event (id + sig) through publishEvent re-publishes it verbatim —
 * NDK only signs when no signature is present. Fire-and-forget.
 */
export async function broadcastOwnRelayList(relays: string[]): Promise<void> {
	if (!ownRelayList) return;
	const { id, pubkey, created_at, kind, tags, content, sig } = ownRelayList;
	await cyphertap
		.publishEvent({ id, pubkey, created_at, kind, tags, content, sig }, { relays })
		.catch(() => {});
}
