<script lang="ts">
	import { Cyphertap, cyphertap } from 'cyphertap';
	import { RELAYS } from '$lib/relays.js';
	import { feed } from '$lib/nostr/feed.svelte.js';
	import { isReply } from '$lib/nostr/nip10.js';
	import StatusEditor from '$lib/components/status-editor.svelte';
	import FilterBar from '$lib/components/filter-bar.svelte';
	import NoteCard from '$lib/components/note-card.svelte';

	const PAGE_SIZE = 30;

	let search = $state('');
	let showReplies = $state(true);
	let displayLimit = $state(PAGE_SIZE);

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
	const visible = $derived(filtered.slice(0, displayLimit));

	// Infinite scroll: when the sentinel enters the viewport, widen the
	// render window; when the loaded notes run out, backfill older ones
	// from the relays.
	let sentinel = $state<HTMLElement | undefined>();
	let backfilling = false;

	async function loadNextChunk() {
		// grow the render window only when it's actually saturated — while the
		// live stream is still filling it there's nothing to extend
		if (visible.length >= displayLimit) {
			displayLimit += PAGE_SIZE;
			return;
		}
		// window not full: backfill older history, but give the live stream a
		// grace period to deliver first (backfilling against a half-warm
		// stream just duplicates it)
		if (Date.now() / 1000 - feed.startedAt < 8) return;
		if (feed.exhausted || feed.loading || backfilling) return;
		backfilling = true;
		try {
			// a backfill page can consist entirely of already-seen events
			// (cursor still advances) — pull a few rounds until something
			// new is renderable or the relays run dry
			const target = filtered.length + PAGE_SIZE;
			for (let round = 0; round < 5 && !feed.exhausted && filtered.length < target; round++) {
				const before = feed.notes.length;
				await feed.loadOlder();
				if (feed.notes.length === before) break; // nothing new — let the next scroll retry
			}
		} finally {
			backfilling = false;
		}
	}

	// The observer only fires on intersection CHANGES — if a round loads
	// nothing (relays still connecting, duplicate page) the sentinel stays
	// visible and no further event comes. So the observer just tracks
	// visibility, and a polling loop keeps pulling while it's on screen.
	let sentinelVisible = $state(false);
	$effect(() => {
		if (!sentinel) return;
		const observer = new IntersectionObserver(
			(entries) => (sentinelVisible = entries.some((e) => e.isIntersecting)),
			{ rootMargin: '600px' }
		);
		observer.observe(sentinel);
		return () => observer.disconnect();
	});
	$effect(() => {
		if (!sentinelVisible) return;
		let cancelled = false;
		(async () => {
			while (!cancelled && sentinelVisible && !feed.exhausted) {
				await loadNextChunk();
				await new Promise((r) => setTimeout(r, 800));
			}
		})();
		return () => {
			cancelled = true;
		};
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
			<FilterBar bind:search bind:showReplies shown={visible.length} total={feed.notes.length} />
			<p class="watching">watching {feed.followCount} frens on {RELAYS.length} relays</p>

			{#if visible.length === 0}
				<p class="notice">nothing here yet — posts will stream in live.</p>
			{:else}
				{#each visible as note (note.id)}
					<NoteCard {note} {feed} />
				{/each}

				<div class="sentinel" bind:this={sentinel}></div>
				{#if feed.loadingOlder}
					<p class="notice">loading older posts…</p>
				{:else if feed.exhausted && visible.length >= filtered.length}
					<p class="notice">that's everything the relays have.</p>
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
	.sentinel {
		height: 1px;
	}
</style>
