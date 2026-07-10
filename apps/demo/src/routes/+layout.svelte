<script lang="ts">
	// cyphertap's theme CSS must be imported explicitly — the library's own
	// side-effect CSS import gets tree-shaken out of consumer production builds.
	import 'cyphertap/styles.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
