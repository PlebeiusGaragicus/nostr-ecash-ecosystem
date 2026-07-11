<script lang="ts">
	import { hexToNpub, type SimpleNostrEvent } from 'cyphertap';

	let { note }: { note: SimpleNostrEvent } = $props();

	let open = $state(false);
	let copied = $state('');

	// NIP-01 wire format — drop app-internal fields like `relay`
	const rawJson = $derived(
		JSON.stringify(
			{
				id: note.id,
				pubkey: note.pubkey,
				created_at: note.created_at,
				kind: note.kind,
				tags: note.tags,
				content: note.content,
				sig: note.sig
			},
			null,
			2
		)
	);

	async function copy(label: string, text: string) {
		await navigator.clipboard.writeText(text).catch(() => {});
		copied = label;
		setTimeout(() => (copied = ''), 1500);
	}
</script>

<div class="stats">
	<button
		class="dots"
		title="stats for nerds"
		onclick={(e) => {
			e.stopPropagation();
			open = !open;
		}}>…</button
	>

	{#if open}
		<!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
		<div class="panel" onclick={(e) => e.stopPropagation()}>
			<div class="row">
				<span class="key">event id</span>
				<code>{note.id.slice(0, 16)}…</code>
				<button onclick={() => copy('id', note.id)}>{copied === 'id' ? '✓' : 'copy'}</button>
			</div>
			<div class="row">
				<span class="key">author</span>
				<code>{hexToNpub(note.pubkey).slice(0, 16)}…</code>
				<button onclick={() => copy('npub', hexToNpub(note.pubkey))}
					>{copied === 'npub' ? '✓' : 'copy'}</button
				>
			</div>
			<div class="row"><span class="key">kind</span><code>{note.kind}</code></div>
			<div class="row">
				<span class="key">created</span>
				<code>{new Date(note.created_at * 1000).toISOString()}</code>
			</div>
			<div class="row">
				<span class="key">seen on</span>
				<code>{note.relay ?? 'local cache'}</code>
			</div>
			<div class="row raw-head">
				<span class="key">raw event</span>
				<button onclick={() => copy('json', rawJson)}>{copied === 'json' ? '✓' : 'copy'}</button>
			</div>
			<pre>{rawJson}</pre>
		</div>
	{/if}
</div>

<style>
	.stats {
		position: relative;
		display: inline-block;
	}
	.dots {
		background: none;
		border: none;
		color: var(--muted-foreground);
		cursor: pointer;
		font: inherit;
		font-weight: 700;
		letter-spacing: 0.1em;
		padding: 0 0.4rem;
		line-height: 1;
	}
	.dots:hover {
		color: var(--foreground);
	}
	.panel {
		position: absolute;
		right: 0;
		top: 1.4rem;
		z-index: 20;
		width: min(26rem, 86vw);
		background: var(--popover);
		color: var(--popover-foreground);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 0.7rem;
		box-shadow: 0 8px 30px rgb(0 0 0 / 0.25);
		font-size: 0.8rem;
		cursor: default;
		text-align: left;
	}
	.row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.15rem 0;
		min-width: 0;
	}
	.key {
		color: var(--muted-foreground);
		width: 4.5rem;
		flex-shrink: 0;
	}
	code {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		min-width: 0;
	}
	.row button {
		margin-left: auto;
		background: none;
		border: 1px solid var(--border);
		border-radius: calc(var(--radius) * 0.6);
		color: var(--muted-foreground);
		font: inherit;
		font-size: 0.7rem;
		padding: 0.05rem 0.45rem;
		cursor: pointer;
		flex-shrink: 0;
	}
	.row button:hover {
		color: var(--foreground);
	}
	.raw-head {
		margin-top: 0.3rem;
		border-top: 1px solid var(--border);
		padding-top: 0.45rem;
	}
	pre {
		margin: 0.3rem 0 0;
		max-height: 14rem;
		overflow: auto;
		background: var(--muted);
		border-radius: calc(var(--radius) * 0.6);
		padding: 0.5rem;
		font-size: 0.7rem;
		line-height: 1.4;
	}
</style>
