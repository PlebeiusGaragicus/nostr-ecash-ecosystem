import adapter from '@sveltejs/adapter-static';
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

			// Static SPA build for GitHub Pages: the app is fully client-side
			// (ssr=false), so we prerender the empty shell as index.html and use
			// 404.html as the SPA fallback (how Pages routes unknown paths).
			adapter: adapter({ fallback: '404.html' }),
			paths: {
				// Set by the Pages deploy workflow, e.g. /nostr-ecash-ecosystem
				base: (process.env.BASE_PATH as `/${string}` | undefined) || ''
			}
		})
	]
});
