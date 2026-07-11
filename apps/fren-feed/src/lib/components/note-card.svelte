<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { cyphertap, type SimpleNostrEvent } from 'cyphertap';
	import { isReply, parentId, replyTags } from '$lib/nostr/nip10.js';
	import { relativeTime, isExpired } from '$lib/nostr/status.js';
	import { replyRelays, resolveReplyRelays, relayHint } from '$lib/nostr/reply-routing.js';
	import type { FeedState } from '$lib/nostr/feed-state.svelte.js';
	import NoteContent from './note-content.svelte';
	import NoteStats from './note-stats.svelte';

	let { note, feed }: { note: SimpleNostrEvent; feed: FeedState } = $props();

	const profile = $derived(feed.profiles.get(note.pubkey));
	const status = $derived.by(() => {
		const s = feed.statuses.get(note.pubkey);
		return s && !isExpired(s.tags, feed.now) ? s : undefined;
	});
	const parent = $derived.by(() => {
		const id = parentId(note);
		return id ? feed.parents.get(id) : undefined;
	});
	// clamp text-heavy posts in the feed; the post view shows everything
	const isLong = $derived(
		note.content.length > 500 || (note.content.match(/\n/g)?.length ?? 0) > 8
	);

	let imgFailed = $state(false);
	let replying = $state(false);
	let replyText = $state('');
	let sending = $state(false);
	let sent = $state(false);
	// resolved outbox targets (baseline shown while the NIP-65 lookup runs)
	let targetRelays = $state<string[] | undefined>();
	$effect(() => {
		if (!replying) return;
		targetRelays = undefined;
		resolveReplyRelays(note).then((r) => (targetRelays = r));
	});

	function openPost(e: MouseEvent) {
		// let links, buttons, and inputs inside the card do their own thing
		if ((e.target as HTMLElement).closest('a, button, input, textarea, pre')) return;
		goto(`${base}/post/${note.id}`);
	}

	async function sendReply() {
		const content = replyText.trim();
		if (!content) return;
		sending = true;
		try {
			await cyphertap.publishEvent(
				{ kind: 1, content, tags: replyTags(note) },
				{ relays: targetRelays ?? (await resolveReplyRelays(note)) }
			);
			replyText = '';
			replying = false;
			sent = true;
			setTimeout(() => (sent = false), 2500);
		} finally {
			sending = false;
		}
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions, a11y_click_events_have_key_events -->
<article class="card" onclick={openPost}>
	<div class="avatar">
		{#if profile?.picture && !imgFailed}
			<img src={profile.picture} alt="" loading="lazy" onerror={() => (imgFailed = true)} />
		{:else}
			<span class="initial">{feed.displayName(note.pubkey).slice(0, 1).toUpperCase()}</span>
		{/if}
	</div>

	<div class="body">
		<header>
			<strong>{feed.displayName(note.pubkey)}</strong>
			<time class="muted">{relativeTime(note.created_at, feed.now)}</time>
			<NoteStats {note} />
		</header>

		{#if status}
			<p class="status"><span class="dot"></span>{status.content}</p>
		{/if}

		{#if isReply(note)}
			<blockquote class="parent">
				{#if parent}
					<span class="parent-author">↳ {feed.displayName(parent.pubkey)}</span>
					<span class="parent-snippet">{parent.content.slice(0, 120)}{parent.content.length > 120 ? '…' : ''}</span>
				{:else}
					<span class="parent-author">↳ replying to an earlier note</span>
				{/if}
			</blockquote>
		{/if}

		<NoteContent content={note.content} {feed} truncated={isLong} />
		{#if isLong}
			<a class="show-more" href={`${base}/post/${note.id}`}>show more</a>
		{/if}

		<footer>
			{#if sent}
				<span class="sent">reply sent ✓</span>
			{:else}
				<button class="link" onclick={() => (replying = !replying)}>
					{replying ? 'cancel' : 'reply'}
				</button>
			{/if}
		</footer>

		{#if replying}
			<div class="reply-box">
				<input
					type="text"
					placeholder={`reply to ${feed.displayName(note.pubkey)}…`}
					bind:value={replyText}
					onkeydown={(e) => e.key === 'Enter' && sendReply()}
				/>
				<button disabled={sending || !replyText.trim()} onclick={sendReply}>send</button>
			</div>
			<p class="reply-hint">
				→ {relayHint(targetRelays ?? replyRelays(note))}{targetRelays ? '' : ' …'}
			</p>
		{/if}
	</div>
</article>

<style>
	.card {
		display: flex;
		gap: 0.75rem;
		padding: 0.9rem 0;
		border-bottom: 1px solid var(--border);
		cursor: pointer;
	}
	.card:hover {
		background: color-mix(in oklab, var(--muted) 35%, transparent);
	}
	.avatar {
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
		overflow: hidden;
		flex-shrink: 0;
		background: var(--muted);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.initial {
		font-weight: 600;
		color: var(--muted-foreground);
	}
	.body {
		min-width: 0;
		flex: 1;
	}
	header {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
	}
	.muted {
		color: var(--muted-foreground);
		font-size: 0.85em;
		margin-left: auto;
	}
	.status {
		margin: 0.15rem 0 0;
		font-size: 0.85em;
		color: var(--muted-foreground);
		font-style: italic;
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}
	.dot {
		width: 0.4rem;
		height: 0.4rem;
		border-radius: 50%;
		background: var(--primary);
		flex-shrink: 0;
	}
	.parent {
		margin: 0.4rem 0 0;
		padding: 0.35rem 0.6rem;
		border-left: 2px solid var(--border);
		font-size: 0.85em;
		color: var(--muted-foreground);
		overflow: hidden;
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}
	.parent-author {
		font-weight: 500;
	}
	.parent-snippet {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.show-more {
		display: block;
		text-align: center;
		color: var(--primary);
		font-size: 0.85em;
		text-decoration: none;
		margin: -0.1rem 0 0.3rem;
	}
	.show-more:hover {
		text-decoration: underline;
	}
	footer {
		font-size: 0.85em;
	}
	.link {
		background: none;
		border: none;
		color: var(--primary);
		cursor: pointer;
		font: inherit;
		font-size: 1em;
		padding: 0;
	}
	.sent {
		color: var(--primary);
	}
	.reply-box {
		display: flex;
		gap: 0.4rem;
		margin-top: 0.5rem;
	}
	.reply-box input {
		flex: 1;
		font: inherit;
		padding: 0.4rem 0.6rem;
		border: 1px solid var(--input);
		border-radius: calc(var(--radius) * 0.75);
		background: transparent;
		color: inherit;
	}
	.reply-box button {
		font: inherit;
		padding: 0.4rem 0.8rem;
		border-radius: calc(var(--radius) * 0.75);
		border: none;
		background: var(--primary);
		color: var(--primary-foreground);
		cursor: pointer;
	}
	.reply-box button:disabled {
		opacity: 0.5;
		cursor: default;
	}
	.reply-hint {
		margin: 0.3rem 0 0;
		font-size: 0.7rem;
		color: var(--muted-foreground);
	}
</style>
