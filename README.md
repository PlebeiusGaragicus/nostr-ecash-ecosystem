# nostr-ecash-ecosystem

Workspace for the [cyphertap](https://github.com/PlebeiusGaragicus/cyphertap)
library (nostr + Lightning + ecash on a single button, consumed as a git
submodule) and the web apps built on it.

```
├── cyphertap/       the library — git submodule, its own repo & history
└── apps/
    └── demo/        minimal SvelteKit app consuming cyphertap
```

## Quickstart

```sh
git clone --recurse-submodules <this-repo>
pnpm install
pnpm build:lib              # build cyphertap dist (required once)
pnpm --filter demo dev      # run the demo app
```

While editing the library, run `pnpm --filter cyphertap package:watch` in a
second terminal so apps pick up changes.

## Adding an app

```sh
cd apps && pnpm dlx sv@latest create my-app --template minimal --types ts --no-add-ons --no-install
```

Then add `"cyphertap": "workspace:*"` to its dependencies and follow
`cyphertap/docs/CONSUMING.md` (SSR off, runes-mode exception for linked
packages).

External apps in their own repos consume cyphertap as a submodule instead —
same doc, Pattern B.

## Working with the submodule

Commits to the library happen inside `cyphertap/` (its own git repo, pushed
to the fork on GitHub). After committing there, record the new pointer here:

```sh
git add cyphertap && git commit -m "chore: bump cyphertap"
```
