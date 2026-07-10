<script lang="ts">
	import { Cyphertap, cyphertap } from 'cyphertap';

	const RELAYS = ['wss://relay.cypherflow.ai', 'wss://relay.damus.io'];
</script>

<main>
	<h1>cyphertap demo</h1>
	<p>A minimal app consuming the cyphertap library from the workspace.</p>

	<div class="tap">
		<Cyphertap relays={RELAYS} />
	</div>

	{#if cyphertap.isLoggedIn}
		<p>Logged in as <code>{cyphertap.npub}</code></p>
		<p>Balance: {cyphertap.balance} sats</p>
	{/if}
</main>

<style>
	main {
		max-width: 40rem;
		margin: 4rem auto;
		padding: 0 1rem;
		font-family: system-ui, sans-serif;
		text-align: center;
	}
	.tap {
		display: flex;
		justify-content: center;
		margin: 2rem 0;
	}
	code {
		word-break: break-all;
	}
</style>
