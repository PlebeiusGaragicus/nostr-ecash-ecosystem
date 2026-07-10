<script lang="ts">
	let {
		search = $bindable(''),
		showReplies = $bindable(true),
		shown,
		total
	}: { search: string; showReplies: boolean; shown: number; total: number } = $props();
</script>

<div class="bar">
	<input type="search" placeholder="filter by text or fren…" bind:value={search} />
	<label>
		<input type="checkbox" bind:checked={showReplies} />
		replies
	</label>
	<span class="count">{shown}/{total}</span>
</div>

<style>
	.bar {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
	}
	input[type='search'] {
		flex: 1;
		font: inherit;
		padding: 0.45rem 0.7rem;
		border: 1px solid var(--input);
		border-radius: 0.5rem;
		background: transparent;
		color: inherit;
	}
	label {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.9em;
		opacity: 0.8;
		white-space: nowrap;
		cursor: pointer;
	}
	.count {
		font-size: 0.8em;
		opacity: 0.5;
		font-variant-numeric: tabular-nums;
	}
</style>
