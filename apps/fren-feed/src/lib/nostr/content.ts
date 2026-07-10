// Parse kind-1 note content into renderable segments: plain text, images,
// links, nostr mentions, and hashtags. Pure and synchronous — mention names
// are resolved by the renderer against live profile state.
import { npubToHex } from 'cyphertap';

export type Segment =
	| { type: 'text'; text: string }
	| { type: 'image'; url: string }
	| { type: 'link'; url: string }
	| { type: 'mention'; pubkey: string; raw: string }
	| { type: 'hashtag'; tag: string };

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif)(\?[^\s]*)?$/i;

// One pass, longest-match-first alternation:
//   url | nostr entity (nostr: URI or bare npub/nprofile) | #hashtag
const TOKEN =
	/(https?:\/\/[^\s<>"']+)|((?:nostr:)?n(?:pub|profile)1[02-9ac-hj-np-z]{6,})|(#[\p{L}\p{N}_]+)/gu;

export function parseContent(content: string): Segment[] {
	const segments: Segment[] = [];
	let last = 0;

	for (const match of content.matchAll(TOKEN)) {
		const index = match.index ?? 0;
		if (index > last) segments.push({ type: 'text', text: content.slice(last, index) });
		last = index + match[0].length;

		const [, url, entity, hashtag] = match;
		if (url) {
			// strip trailing punctuation that's almost certainly sentence-level
			const clean = url.replace(/[).,;:!?]+$/, '');
			last -= url.length - clean.length;
			segments.push(IMAGE_EXT.test(clean) ? { type: 'image', url: clean } : { type: 'link', url: clean });
		} else if (entity) {
			try {
				segments.push({ type: 'mention', pubkey: npubToHex(entity), raw: entity });
			} catch {
				segments.push({ type: 'text', text: entity });
			}
		} else if (hashtag) {
			segments.push({ type: 'hashtag', tag: hashtag });
		}
	}

	if (last < content.length) segments.push({ type: 'text', text: content.slice(last) });
	return segments;
}
