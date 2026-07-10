import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode everywhere (cyphertap included — it's fully runes),
				// except third-party libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
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
