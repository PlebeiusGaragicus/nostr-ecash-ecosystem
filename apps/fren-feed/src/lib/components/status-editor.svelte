<script lang="ts">
	import { cyphertap } from 'cyphertap';
	import { STATUS_KIND, STATUS_DTAG, EXPIRATION_PRESETS, relativeTime } from '$lib/nostr/status.js';
	import type { FeedState } from '$lib/nostr/feed-state.svelte.js';

	let { feed }: { feed: FeedState } = $props();

	let text = $state('');
	let presetIndex = $state(0);
	let busy = $state(false);
	let open = $state(false);

	const myPubkey = $derived(cyphertap.isLoggedIn ? (cyphertap.getUserHex() ?? '') : '');
	const myStatus = $derived(myPubkey ? feed.statuses.get(myPubkey) : undefined);

	async function publish(content: string) {
		busy = true;
		try {
			const expiresAt = EXPIRATION_PRESETS[presetIndex].expiresAt(feed.now);
			await cyphertap.publishAddressable(
				STATUS_KIND,
				STATUS_DTAG,
				content,
				content && expiresAt ? [['expiration', String(expiresAt)]] : []
			);
			if (content) text = '';
		} finally {
			busy = false;
		}
	}
</script>

<section class="status">
	<button class="toggle" onclick={() => (open = !open)}>
		{#if myStatus?.content}
			<span class="dot"></span> {myStatus.content}
			<span class="muted">({relativeTime(myStatus.created_at, feed.now)})</span>
		{:else}
			what are you working on rn?
		{/if}
		<span class="chev">{open ? '▴' : '▾'}</span>
	</button>

	{#if open}
		<div class="editor">
			<input
				type="text"
				placeholder="e.g. hacking on fren-feed"
				bind:value={text}
				maxlength="120"
				onkeydown={(e) => e.key === 'Enter' && text.trim() && publish(text.trim())}
			/>
			<div class="row">
				<div class="presets">
					{#each EXPIRATION_PRESETS as preset, i}
						<button
							class="preset"
							class:active={presetIndex === i}
							onclick={() => (presetIndex = i)}
						>
							{preset.label}
						</button>
					{/each}
				</div>
				<div class="actions">
					{#if myStatus?.content}
						<button class="clear" disabled={busy} onclick={() => publish('')}>clear</button>
					{/if}
					<button class="publish" disabled={busy || !text.trim()} onclick={() => publish(text.trim())}>
						set status
					</button>
				</div>
			</div>
		</div>
	{/if}
</section>

<style>
	.status {
		border: 1px solid #ddd4;
		border-radius: 0.75rem;
		margin-bottom: 1rem;
		overflow: hidden;
	}
	.toggle {
		width: 100%;
		text-align: left;
		padding: 0.6rem 0.9rem;
		background: none;
		border: none;
		cursor: pointer;
		font: inherit;
		color: inherit;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		background: #22c55e;
		flex-shrink: 0;
	}
	.chev {
		margin-left: auto;
		opacity: 0.5;
	}
	.muted {
		opacity: 0.5;
		font-size: 0.85em;
	}
	.editor {
		padding: 0 0.9rem 0.9rem;
		display: grid;
		gap: 0.6rem;
	}
	input {
		font: inherit;
		padding: 0.5rem 0.7rem;
		border: 1px solid #ddd6;
		border-radius: 0.5rem;
		background: transparent;
		color: inherit;
	}
	.row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	.presets,
	.actions {
		display: flex;
		gap: 0.35rem;
	}
	.preset,
	.clear,
	.publish {
		font: inherit;
		font-size: 0.85em;
		padding: 0.25rem 0.6rem;
		border-radius: 999px;
		border: 1px solid #ddd6;
		background: transparent;
		color: inherit;
		cursor: pointer;
	}
	.preset.active {
		border-color: #22c55e;
		color: #22c55e;
	}
	.publish {
		background: #22c55e;
		border-color: #22c55e;
		color: #fff;
	}
	.publish:disabled,
	.clear:disabled {
		opacity: 0.5;
		cursor: default;
	}
</style>
