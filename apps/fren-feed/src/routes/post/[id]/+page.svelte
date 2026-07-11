<script lang="ts">
	import { page } from '$app/state';
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import { Cyphertap, cyphertap, type SimpleNostrEvent } from 'cyphertap';
	import { RELAYS } from '$lib/relays.js';
	import { feed, getPost } from '$lib/nostr/feed.svelte.js';
	import { isReply, parentId, replyTags } from '$lib/nostr/nip10.js';
	import { replyRelays, relayHint } from '$lib/nostr/reply-routing.js';
	import NoteContent from '$lib/components/note-content.svelte';
	import NoteStats from '$lib/components/note-stats.svelte';

	let note = $state<SimpleNostrEvent | undefined>();
	let parent = $state<SimpleNostrEvent | undefined>();
	let notFound = $state(false);
	let imgFailed = $state(false);

	let replyText = $state('');
	let sending = $state(false);
	let sent = $state(false);

	// Load (and reload when navigating parent → parent). Waits for login
	// since fetching needs a connected NDK.
	$effect(() => {
		const id = page.params.id;
		if (!cyphertap.isLoggedIn || !id) return;
		note = undefined;
		parent = undefined;
		notFound = false;
		imgFailed = false;
		(async () => {
			const n = await getPost(id);
			if (!n) {
				notFound = true;
				return;
			}
			note = n;
			const pid = parentId(n);
			if (pid) parent = await getPost(pid);
		})();
	});

	const profile = $derived(note ? feed.profiles.get(note.pubkey) : undefined);
	const fullDate = $derived(
		note
			? new Date(note.created_at * 1000).toLocaleString(undefined, {
					dateStyle: 'medium',
					timeStyle: 'short'
				})
			: ''
	);

	async function sendReply() {
		if (!note) return;
		const content = replyText.trim();
		if (!content) return;
		sending = true;
		try {
			await cyphertap.publishEvent(
				{ kind: 1, content, tags: replyTags(note) },
				{ relays: replyRelays(note) }
			);
			replyText = '';
			sent = true;
			setTimeout(() => (sent = false), 2500);
		} finally {
			sending = false;
		}
	}
</script>

<svelte:head>
	<title>post · fren-feed</title>
</svelte:head>

<div class="page">
	<header class="top">
		<a class="back" href="{base}/">← feed</a>
		<Cyphertap relays={RELAYS} />
	</header>

	{#if !cyphertap.isLoggedIn}
		<p class="notice">log in to view this post ↗</p>
	{:else if notFound}
		<p class="notice">couldn't find this post on the connected relays.</p>
	{:else if !note}
		<p class="notice">loading post…</p>
	{:else}
		{#if isReply(note)}
			{#if parent}
				<!-- svelte-ignore a11y_no_noninteractive_element_interactions, a11y_click_events_have_key_events -->
				<article
					class="parent-card"
					onclick={(e) => {
						if ((e.target as HTMLElement).closest('a, button, pre')) return;
						goto(`${base}/post/${parent!.id}`);
					}}
				>
					<header>
						<strong>{feed.displayName(parent.pubkey)}</strong>
						<span class="muted">{new Date(parent.created_at * 1000).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</span>
					</header>
					<NoteContent content={parent.content} {feed} truncated={parent.content.length > 500} />
					<span class="open-hint">open ↗</span>
				</article>
				<div class="thread-line"></div>
			{:else}
				<p class="notice small">↳ replying to an earlier note (not found on connected relays)</p>
			{/if}
		{/if}

		<article class="post">
			<header>
				<div class="avatar">
					{#if profile?.picture && !imgFailed}
						<img src={profile.picture} alt="" onerror={() => (imgFailed = true)} />
					{:else}
						<span class="initial">{feed.displayName(note.pubkey).slice(0, 1).toUpperCase()}</span>
					{/if}
				</div>
				<div class="who">
					<strong>{feed.displayName(note.pubkey)}</strong>
					<span class="muted">{fullDate}</span>
				</div>
				<NoteStats {note} />
			</header>

			<div class="full-content">
				<NoteContent content={note.content} {feed} />
			</div>

			<div class="reply-box">
				<input
					type="text"
					placeholder={`reply to ${feed.displayName(note.pubkey)}…`}
					bind:value={replyText}
					onkeydown={(e) => e.key === 'Enter' && sendReply()}
				/>
				<button disabled={sending || !replyText.trim()} onclick={sendReply}>
					{sent ? 'sent ✓' : 'reply'}
				</button>
			</div>
			<p class="reply-hint">→ {relayHint(replyRelays(note))}</p>
		</article>
	{/if}
</div>

<style>
	.page {
		max-width: 38rem;
		margin: 0 auto;
		padding: 1rem;
		font-family: system-ui, sans-serif;
	}
	.top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1.5rem;
	}
	.back {
		color: var(--muted-foreground);
		text-decoration: none;
		font-size: 0.95rem;
	}
	.back:hover {
		color: var(--foreground);
	}
	.notice {
		text-align: center;
		opacity: 0.6;
		margin: 3rem 0;
	}
	.notice.small {
		text-align: left;
		margin: 0 0 1rem;
		font-size: 0.9em;
	}
	.parent-card {
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 0.8rem 1rem 0.6rem;
		cursor: pointer;
		position: relative;
		font-size: 0.95rem;
	}
	.parent-card:hover {
		background: color-mix(in oklab, var(--muted) 35%, transparent);
	}
	.parent-card header {
		display: flex;
		align-items: baseline;
		gap: 0.6rem;
	}
	.open-hint {
		position: absolute;
		top: 0.7rem;
		right: 0.9rem;
		font-size: 0.75em;
		color: var(--muted-foreground);
	}
	.thread-line {
		width: 2px;
		height: 1.2rem;
		background: var(--border);
		margin-left: 2rem;
	}
	.post header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
	}
	.avatar {
		width: 3rem;
		height: 3rem;
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
		font-size: 1.2rem;
	}
	.who {
		display: flex;
		flex-direction: column;
		min-width: 0;
		flex: 1;
	}
	.muted {
		color: var(--muted-foreground);
		font-size: 0.85em;
	}
	.full-content {
		font-size: 1.15rem;
		line-height: 1.55;
	}
	.reply-box {
		display: flex;
		gap: 0.4rem;
		margin-top: 1.2rem;
		border-top: 1px solid var(--border);
		padding-top: 1rem;
	}
	.reply-box input {
		flex: 1;
		font: inherit;
		padding: 0.5rem 0.7rem;
		border: 1px solid var(--input);
		border-radius: calc(var(--radius) * 0.75);
		background: transparent;
		color: inherit;
	}
	.reply-box button {
		font: inherit;
		padding: 0.5rem 1rem;
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
		margin: 0.35rem 0 0;
		font-size: 0.7rem;
		color: var(--muted-foreground);
	}
</style>
