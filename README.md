# nostr-ecash-ecosystem

Workspace for the [cyphertap](https://github.com/PlebeiusGaragicus/cyphertap)
library (nostr + Lightning + ecash on a single button, consumed as a git
submodule) and the web apps built on it.

```
├── cyphertap/       the library — git submodule, its own repo & history
└── apps/
    ├── demo/        minimal SvelteKit app consuming cyphertap
    └── fren-feed/   posts + NIP-38 statuses from your follows
                     live: https://plebeiusgaragicus.github.io/nostr-ecash-ecosystem/
```

## Quickstart

```sh
git clone --recurse-submodules <this-repo>
pnpm install
pnpm --filter fren-feed dev    # or --filter demo
```

Apps consume the library **from source** — no build step; edits inside
`cyphertap/` hot-reload straight into a running app. (If the library's
Tailwind classes change, run `pnpm --filter cyphertap watch:css` to
regenerate its committed stylesheet.)

## Checks

```sh
pnpm check    # svelte-check across library + apps (CI runs this)
pnpm build    # library dist escape hatch + app production builds
pnpm --filter cyphertap exec vitest --project server --run   # unit tests
```

## Adding an app

```sh
cd apps && pnpm dlx sv@latest create my-app --template minimal --types ts --no-add-ons --no-install
```

Then add `"cyphertap": "workspace:*"` to its dependencies and follow
`cyphertap/docs/CONSUMING.md` — in short: import `cyphertap/styles.css` in
the root layout, and keep the `@nostr-dev-kit/ndk` override from
`pnpm-workspace.yaml`. Theming: `cyphertap/docs/THEMING.md`.

External apps in their own repos consume cyphertap as a submodule instead —
same doc, Pattern B.

## Working with the submodule

Commits to the library happen inside `cyphertap/` (its own git repo, pushed
to the fork on GitHub). After committing there, record the new pointer here:

```sh
git add cyphertap && git commit -m "chore: bump cyphertap (<what changed>)"
```

Both repos have CI; this repo's CI verifies the library and apps work
together at the pinned submodule commit. Contributor knowledge — landing
checklist, known gotchas, decision history — lives in [CLAUDE.md](CLAUDE.md)
and `cyphertap/docs/TECH-DEBT.md`.
