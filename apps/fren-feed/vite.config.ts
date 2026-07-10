import adapter from '@sveltejs/adapter-auto';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				// Workspace-linked packages (e.g. cyphertap) resolve through their symlink to
				// real paths outside this app with no node_modules segment, so also treat
				// anything outside the app dir as a library.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ||
					!filename.startsWith(import.meta.dirname)
						? undefined
						: true
			},

			// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
			// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
			// See https://svelte.dev/docs/kit/adapters for more information about adapters.
			adapter: adapter()
		})
	]
});
