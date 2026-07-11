// App-wide feed singleton. The lifecycle (start on login, stop on logout)
// is driven from +layout.svelte so every route — feed and post views —
// shares the same live state, profiles, and parent cache.
import { cyphertap, type SimpleNostrEvent } from 'cyphertap';
import { FeedState } from './feed-state.svelte.js';

export const feed = new FeedState();

/**
 * Resolve a note for the post view: from live feed state if present,
 * otherwise a one-shot relay fetch (served from the local Dexie cache
 * when available).
 */
export async function getPost(id: string): Promise<SimpleNostrEvent | undefined> {
	const local = feed.notes.find((n) => n.id === id) ?? feed.parents.get(id);
	if (local) return local;
	const fetched = await cyphertap.fetchEvents({ ids: [id] });
	return fetched[0];
}
