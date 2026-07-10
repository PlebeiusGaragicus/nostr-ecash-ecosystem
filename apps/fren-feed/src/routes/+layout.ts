// cyphertap is browser-only (localStorage keys, IndexedDB cache, WebSockets).
// Drop this when the library's SSR-safety phase lands.
export const ssr = false;

// Prerender the (empty, ssr-less) HTML shell so adapter-static emits an
// index.html for GitHub Pages; the app fully renders client-side.
export const prerender = true;
