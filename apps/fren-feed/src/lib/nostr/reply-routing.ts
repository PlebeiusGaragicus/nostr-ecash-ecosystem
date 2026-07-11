// Reply relay routing (NIP-65 outbox model): a reply published only to our
// whitelisted relay is invisible to the person being replied to. Replies go
// to our app relays, plus the relay the parent was seen on, plus — the
// proper answer — the recipient's declared READ relays from their kind
// 10002 relay list ("when replying to or mentioning a user, publish to that
// user's read relays").
import { cyphertap, type SimpleNostrEvent } from 'cyphertap';
import { RELAYS } from '$lib/relays.js';

const normalize = (url: string) => url.replace(/\/+$/, '');

/** Cap on recipient read relays so a maximal list doesn't spray the note. */
const MAX_RECIPIENT_RELAYS = 4;

const readRelayCache = new Map<string, string[]>();

/** Immediate baseline: our app relays + wherever the parent was seen. */
export function replyRelays(note: SimpleNostrEvent): string[] {
	// note.relay arrives NDK-normalized with a trailing slash — normalize
	// before deduping against our configured list
	return [...new Set([...RELAYS, ...(note.relay ? [note.relay] : [])].map(normalize))];
}

/**
 * Full outbox resolution: baseline + the note author's NIP-65 read relays
 * (cached per pubkey; empty on lookup failure so the baseline still works).
 */
export async function resolveReplyRelays(note: SimpleNostrEvent): Promise<string[]> {
	let read = readRelayCache.get(note.pubkey);
	if (read === undefined) {
		try {
			read = (await cyphertap.getRelayList(note.pubkey)).read
				.filter((u) => u.startsWith('wss://')) // no plaintext ws:// for a public reply
				.slice(0, MAX_RECIPIENT_RELAYS);
		} catch {
			read = [];
		}
		readRelayCache.set(note.pubkey, read);
	}
	return [...new Set([...replyRelays(note), ...read.map(normalize)])];
}

/** Compact human-readable relay list for the reply box hint. */
export function relayHint(urls: string[]): string {
	return urls.map((u) => u.replace(/^wss?:\/\//, '').replace(/\/$/, '')).join(' · ');
}
