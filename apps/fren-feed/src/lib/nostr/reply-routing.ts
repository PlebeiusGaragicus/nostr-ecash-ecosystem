// Reply relay routing: a reply published only to our whitelisted relay is
// invisible to the person being replied to. Send it to our app relays PLUS
// the relay the parent note was seen on — that's where its author lives.
import type { SimpleNostrEvent } from 'cyphertap';
import { RELAYS } from '$lib/relays.js';

const normalize = (url: string) => url.replace(/\/+$/, '');

export function replyRelays(note: SimpleNostrEvent): string[] {
	// note.relay arrives NDK-normalized with a trailing slash — normalize
	// before deduping against our configured list
	return [...new Set([...RELAYS, ...(note.relay ? [note.relay] : [])].map(normalize))];
}

/** Compact human-readable relay list for the reply box hint. */
export function relayHint(urls: string[]): string {
	return urls.map((u) => u.replace(/^wss?:\/\//, '').replace(/\/$/, '')).join(' · ');
}
