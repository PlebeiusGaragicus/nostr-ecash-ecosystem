<script lang="ts">
	// cyphertap's theme CSS must be imported explicitly — the library's own
	// side-effect CSS import gets tree-shaken out of consumer production builds.
	import 'cyphertap/styles.css';
	import '../theme.css';
	import { cyphertap } from 'cyphertap';
	import { feed } from '$lib/nostr/feed.svelte.js';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();

	// App-wide feed lifecycle: start once logged in, tear down on logout.
	let started = $state(false);
	$effect(() => {
		if (cyphertap.isLoggedIn && !started) {
			started = true;
			feed.start();
		} else if (!cyphertap.isLoggedIn && started) {
			started = false;
			feed.stop();
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
