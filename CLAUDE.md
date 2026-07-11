# nostr-ecash-ecosystem — working notes

pnpm workspace: the **cyphertap** library (git submodule, its own repo:
`PlebeiusGaragicus/cyphertap`) plus the apps built on it. This is an active
product, not reference code — production quality bar (proper error handling,
NIP-44 not NIP-04, no unverified hacks). The `../` reference repos (nips,
nuts, ndk, nostr-tools, …) are read-only inspiration.

## Map

```
├── cyphertap/        the library (submodule). Canonical docs live HERE:
│   ├── CLAUDE.md         library-specific working notes
│   └── docs/
│       ├── CONSUMING.md  how apps embed it (source consumption, NDK override, styles import)
│       ├── THEMING.md    CSS-var override contract (:root:root)
│       └── TECH-DEBT.md  debt + dated decisions — THE decision log, read first
└── apps/
    ├── demo/         minimal consumer (exercises relays prop)
    └── fren-feed/    real app: posts from follows + NIP-38 statuses + theme override
                      LIVE: https://plebeiusgaragicus.github.io/nostr-ecash-ecosystem/
```

## Dev loop

```sh
pnpm install                      # once (lockfile is authoritative, CI uses --frozen-lockfile)
pnpm --filter fren-feed dev       # apps compile cyphertap SOURCE directly — no build step,
pnpm --filter demo dev            # library edits HMR straight into the app
pnpm check                        # svelte-check: library + all apps (CI runs this)
pnpm --filter cyphertap exec vitest --project server --run   # unit tests
pnpm build                        # dist escape hatch + app builds (CI runs this)
```

There is **no dist step** for normal development (since 2026-07-10; see
TECH-DEBT #6). `pnpm --filter cyphertap package` still exists as an escape
hatch and CI keeps it green.

## Landing checklist (every library change)

1. Commit + push inside `cyphertap/` (its own repo).
2. Bump the pointer here: `git add cyphertap && git commit -m "chore: bump cyphertap (<what>)" && git push`.
3. Both CIs must go green — this repo's CI checks the pair actually work together.

Pushing here auto-deploys fren-feed to GitHub Pages; pushing cyphertap
auto-deploys its showcase. **A broken merge ships.**

## Gotchas that have already bitten us (don't relearn)

- **Two lockfiles must agree.** cyphertap has its own `pnpm-lock.yaml` (for
  standalone CI) *and* is resolved by this workspace's lockfile. After any
  dependency change, run `pnpm i` in BOTH `cyphertap/` and here, and keep the
  `@nostr-dev-kit/ndk` override identical in both `pnpm-workspace.yaml`
  files — otherwise CI type-checks diverge from local.
- **`import 'cyphertap/styles.css'` is mandatory in every app's root layout.**
  The library's internal CSS import is tree-shaken from production builds
  only — dev looks fine, prod ships unstyled. (CONSUMING.md #5.)
- **ndk-wallet is pinned exactly 0.7.0** — 0.7.1 is a broken npm publish
  (no `dist/` in the tarball). NDK 3.0 is blocked until companion packages
  move off 2.15.x. (TECH-DEBT #4.)
- **Never run pnpm/svelte-kit commands from a subdirectory of `src/`** —
  `svelte-kit sync` generates a stray `.svelte-kit/` wherever it runs
  (gitignore now catches it, but still).
- **Verify UI changes with rendered screenshots** (playwright is available in
  cyphertap's node_modules), not curl — SSR output hides styling/hydration
  problems.
- Theme overrides must use `:root:root` and be verified against a `vite
  build`, not just dev — CSS order differs. (THEMING.md.)

## Test infrastructure (2026-07-10)

- **Relay**: `wss://relay.abvstudio.net` — our own strfry on the mac mini
  (homelab repo: `~/Downloads/2026-project`, docs/strfry.md), whitelisted:
  only pubkeys in `~/.strfry/whitelist.d/*.txt` (ssh host `mini`) can
  publish; the app group file is `cyphertap.txt`. This is the canonical
  relay (there is no relay.plebchat.me).
- **Test accounts — POLICY**: the apps are used ONLY with the whitelisted
  test accounts in `.test-accounts.json` (gitignored, repo root — three
  keypairs alice/bob/carol with nsec for the login form). "Create new
  account" generates a key the relay rejects, and that's expected: a
  create-account→whitelist onboarding workflow is deliberately out of
  scope for now.
- **Mint**: default is `https://nofee.testnut.cashu.space` — FAKE ecash,
  fake Lightning (invoices auto-settle ~seconds; great for wallet tests).
  NO real funds until the stack is thoroughly tested (user decision).
  Don't use `testnut.cashu.space` — it runs bleeding-edge cdk with v2
  keyset IDs ('01…') that cashu-ts 2.9 can't verify. And never
  `mint.minibits.cash` — that one is real funds.
- **Gotcha**: mints apply only at NEW wallet creation; a NIP-60 wallet event
  pinned to a bad mint must be deleted (strfry delete on our relay + kind-5
  to public relays) before re-login recreates it.

## State of the world (2026-07-10)

The 10-phase maturation roadmap is COMPLETE: config injection
(`<Cyphertap relays mints/>` + `configure()`), app API (publishAddressable,
subscribeLatest, getFollows, getNDK, SimpleNostrFilter), CI on both repos,
fren-feed live, SSR-safe component, fully runes-mode library, source
consumption, 29 contract tests (incl. official NIP-49 vectors), THEMING.md,
README warnings. NDK stack unified at 2.15.2. Remaining debt is all
blocked-upstream or needs-a-product-decision — see TECH-DEBT.md.
