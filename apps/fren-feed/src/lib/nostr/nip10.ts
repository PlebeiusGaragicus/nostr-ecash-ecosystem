// NIP-10 threading helpers for kind-1 replies (marked e tags).
import type { SimpleNostrEvent } from 'cyphertap';

export function isReply(note: Pick<SimpleNostrEvent, 'tags'>): boolean {
	return note.tags.some((t) => t[0] === 'e');
}

/**
 * Id of the note this reply is directly responding to: the e tag marked
 * 'reply', else the one marked 'root' (top-level reply), else — legacy
 * unmarked threads — the last e tag (NIP-10 deprecated positional scheme).
 */
export function parentId(note: Pick<SimpleNostrEvent, 'tags'>): string | undefined {
	const eTags = note.tags.filter((t) => t[0] === 'e' && t[1]);
	return (
		eTags.find((t) => t[3] === 'reply')?.[1] ??
		eTags.find((t) => t[3] === 'root')?.[1] ??
		eTags.at(-1)?.[1]
	);
}

/**
 * Tags for a kind-1 reply to `target`, per NIP-10 marked tags:
 * - replying to a root post: e[root] = target
 * - replying to a reply: carry the thread's root marker, mark target as reply
 * - p tags: target author plus the target's own p tags (deduped)
 */
export function replyTags(target: SimpleNostrEvent): string[][] {
	const tags: string[][] = [];

	const targetRoot =
		target.tags.find((t) => t[0] === 'e' && t[3] === 'root') ??
		// legacy (unmarked) threads: treat the first e tag as the root
		target.tags.find((t) => t[0] === 'e');

	if (targetRoot) {
		tags.push(['e', targetRoot[1], targetRoot[2] ?? '', 'root']);
		tags.push(['e', target.id, '', 'reply']);
	} else {
		tags.push(['e', target.id, '', 'root']);
	}

	const pubkeys = new Set<string>([
		target.pubkey,
		...target.tags.filter((t) => t[0] === 'p' && t[1]).map((t) => t[1])
	]);
	for (const pubkey of pubkeys) tags.push(['p', pubkey]);

	return tags;
}
