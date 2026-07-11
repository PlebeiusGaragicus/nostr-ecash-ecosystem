// Query-string driven (?src=…) — can't be prerendered; served client-side
// via the SPA fallback like the post route.
export const prerender = false;
export const ssr = false;
