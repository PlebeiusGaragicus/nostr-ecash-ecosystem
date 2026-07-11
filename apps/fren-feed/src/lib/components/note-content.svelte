<script lang="ts">
	import { base } from '$app/paths';
	import { parseContent } from '$lib/nostr/content.js';
	import type { FeedState } from '$lib/nostr/feed-state.svelte.js';

	let {
		content,
		feed,
		truncated = false
	}: { content: string; feed: FeedState; truncated?: boolean } = $props();

	const segments = $derived(parseContent(content));
	let brokenImages = $state(new Set<string>());

	function markBroken(url: string) {
		brokenImages = new Set(brokenImages).add(url);
	}
</script>

<p class="content" class:truncated>
	{#each segments as seg, i (i)}
		{#if seg.type === 'text'}{seg.text}{:else if seg.type === 'image'}
			{#if brokenImages.has(seg.url)}
				<a href={seg.url} target="_blank" rel="noopener noreferrer">{seg.url}</a>
			{:else}
				<!-- media stays inside the app — full view on its own page -->
				<a class="img-wrap" href={`${base}/media?src=${encodeURIComponent(seg.url)}`}>
					<img src={seg.url} alt="" loading="lazy" onerror={() => markBroken(seg.url)} />
				</a>
			{/if}
		{:else if seg.type === 'link'}
			<a href={seg.url} target="_blank" rel="noopener noreferrer">{seg.url}</a>
		{:else if seg.type === 'mention'}
			<span class="mention" title={seg.raw}>@{feed.displayName(seg.pubkey)}</span>
		{:else if seg.type === 'hashtag'}
			<span class="hashtag">{seg.tag}</span>
		{/if}
	{/each}
</p>

<style>
	.content {
		margin: 0.35rem 0 0.4rem;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}
	/* Feed cards: clamp long posts with a fade — never scroll inside a card;
	   the full post view shows everything. */
	.content.truncated {
		position: relative;
		max-height: 16rem;
		overflow: hidden;
		-webkit-mask-image: linear-gradient(to bottom, black 82%, transparent 100%);
		mask-image: linear-gradient(to bottom, black 82%, transparent 100%);
	}
	/* click shield over the faded zone: a mostly-invisible link would still
	   be clickable and surprise the user — clicks here fall through to the
	   card and open the post instead */
	.content.truncated::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: 40%;
		cursor: pointer;
	}
	a {
		color: var(--primary);
		text-decoration: none;
		overflow-wrap: anywhere;
	}
	a:hover {
		text-decoration: underline;
	}
	.img-wrap {
		display: block;
		margin: 0.4rem 0;
	}
	img {
		max-width: 100%;
		max-height: 22rem;
		border-radius: var(--radius);
		border: 1px solid var(--border);
		display: block;
	}
	.mention {
		color: var(--primary);
		font-weight: 500;
	}
	.hashtag {
		color: var(--primary);
		opacity: 0.85;
	}
</style>
