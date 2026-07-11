// Dynamic post route: can't be prerendered (ids are unbounded); served
// client-side via the SPA fallback (404.html) on GitHub Pages.
export const prerender = false;
export const ssr = false;
