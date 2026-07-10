<script lang="ts">
	import { Cyphertap, cyphertap } from 'cyphertap';
	import { RELAYS } from '$lib/relays.js';
	import { FeedState } from '$lib/nostr/feed-state.svelte.js';
	import { isReply } from '$lib/nostr/nip10.js';
	import StatusEditor from '$lib/components/status-editor.svelte';
	import FilterBar from '$lib/components/filter-bar.svelte';
	import NoteCard from '$lib/components/note-card.svelte';

	const feed = new FeedState();
	let started = $state(false);

	// Start the feed once logged in; tear it down on logout.
	$effect(() => {
		if (cyphertap.isLoggedIn && !started) {
			started = true;
			feed.start();
		} else if (!cyphertap.isLoggedIn && started) {
			started = false;
			feed.stop();
		}
	});

	let search = $state('');
	let showReplies = $state(true);

	const filtered = $derived.by(() => {
		const q = search.trim().toLowerCase();
		return feed.notes.filter((note) => {
			if (!showReplies && isReply(note)) return false;
			if (!q) return true;
			return (
				note.content.toLowerCase().includes(q) ||
				feed.displayName(note.pubkey).toLowerCase().includes(q)
			);
		});
	});
</script>

<svelte:head>
	<title>fren-feed</title>
</svelte:head>

<div class="page">
	<header class="top">
		<h1>fren-feed</h1>
		<Cyphertap relays={RELAYS} />
	</header>

	{#if cyphertap.isLoggedIn}
		<StatusEditor {feed} />

		{#if feed.error}
			<p class="notice error">couldn't load your follows: {feed.error}</p>
		{:else if feed.loading}
			<p class="notice">finding your frens…</p>
		{:else if feed.followCount === 0}
			<p class="notice">
				this key follows nobody yet — follow some frens from another client and reload.
			</p>
		{:else}
			<FilterBar bind:search bind:showReplies shown={filtered.length} total={feed.notes.length} />
			<p class="watching">watching {feed.followCount} frens on {RELAYS.length} relays</p>

			{#if filtered.length === 0}
				<p class="notice">nothing here yet — posts will stream in live.</p>
			{:else}
				{#each filtered as note (note.id)}
					<NoteCard {note} {feed} />
				{/each}

				{#if feed.exhausted}
					<p class="notice">that's everything the relays have.</p>
				{:else}
					<button class="load-more" disabled={feed.loadingOlder} onclick={() => feed.loadOlder()}>
						{feed.loadingOlder ? 'loading…' : 'load older posts'}
					</button>
				{/if}
			{/if}
		{/if}
	{:else}
		<div class="hero">
			<p>a tiny feed of your frens' posts and what they're working on.</p>
			<p class="muted">tap the button to log in ↗</p>
		</div>
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
		margin-bottom: 1rem;
	}
	h1 {
		font-size: 1.3rem;
		margin: 0;
	}
	.hero {
		text-align: center;
		margin-top: 4rem;
		font-size: 1.1rem;
	}
	.muted {
		opacity: 0.5;
	}
	.notice {
		text-align: center;
		opacity: 0.6;
		margin: 2rem 0;
	}
	.notice.error {
		color: var(--destructive);
		opacity: 1;
	}
	.watching {
		font-size: 0.8em;
		opacity: 0.45;
		margin: 0 0 0.25rem;
	}
	.load-more {
		display: block;
		width: 100%;
		margin: 1rem 0 2rem;
		padding: 0.5rem;
		font: inherit;
		font-size: 0.9em;
		color: var(--muted-foreground);
		background: transparent;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		cursor: pointer;
	}
	.load-more:hover:not(:disabled) {
		color: var(--foreground);
		border-color: var(--ring);
	}
	.load-more:disabled {
		opacity: 0.5;
		cursor: default;
	}
</style>
