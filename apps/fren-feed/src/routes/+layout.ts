// Prerender the HTML shell so adapter-static emits an index.html for GitHub
// Pages. The cyphertap widget SSRs as a placeholder and the app content
// renders after hydration (everything meaningful is client-side).
export const prerender = true;
