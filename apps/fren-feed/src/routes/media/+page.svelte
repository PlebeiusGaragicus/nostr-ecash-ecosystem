<script lang="ts">
	import { page } from '$app/state';
	import { base } from '$app/paths';

	const src = $derived(page.url.searchParams.get('src') ?? '');
	let failed = $state(false);

	function goBack() {
		if (history.length > 1) history.back();
		else location.href = `${base}/`;
	}
</script>

<svelte:head>
	<title>media · fren-feed</title>
</svelte:head>

<div class="page">
	<header class="top">
		<button class="back" onclick={goBack}>← back</button>
		{#if src}
			<a class="original" href={src} target="_blank" rel="noopener noreferrer">open original ↗</a>
		{/if}
	</header>

	{#if !src}
		<p class="notice">no media to show.</p>
	{:else if failed}
		<p class="notice">
			couldn't load this media — <a href={src} target="_blank" rel="noopener noreferrer">{src}</a>
		</p>
	{:else}
		<div class="stage">
			<img {src} alt="" onerror={() => (failed = true)} />
		</div>
	{/if}
</div>

<style>
	.page {
		max-width: 60rem;
		margin: 0 auto;
		padding: 1rem;
		font-family: system-ui, sans-serif;
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
	}
	.top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
	}
	.back {
		background: none;
		border: none;
		color: var(--muted-foreground);
		cursor: pointer;
		font: inherit;
		font-size: 0.95rem;
		padding: 0;
	}
	.back:hover {
		color: var(--foreground);
	}
	.original {
		color: var(--muted-foreground);
		font-size: 0.85rem;
		text-decoration: none;
	}
	.original:hover {
		color: var(--foreground);
		text-decoration: underline;
	}
	.notice {
		text-align: center;
		opacity: 0.6;
		margin: 3rem 0;
		overflow-wrap: anywhere;
	}
	.notice a {
		color: var(--primary);
	}
	.stage {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 0;
	}
	img {
		max-width: 100%;
		max-height: calc(100dvh - 6rem);
		border-radius: var(--radius);
		object-fit: contain;
	}
</style>
