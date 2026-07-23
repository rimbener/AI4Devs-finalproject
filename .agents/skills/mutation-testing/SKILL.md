---
name: mutation-testing
description: Run mutation testing with StrykerJS on a feature's CHANGED source files in this monorepo (`@helsoft/services`, `@helsoft/supabase-services`, `@helsoft/hooks`, `@helsoft/components`, `@helsoft/logging-in-out`, `@helsoft/activities`, `@helsoft/study-buddy`) and prove the tests bite. Use when the orchestrator's mutation phase runs, after a suite is green, or on "run mutation", "stryker", "mutation score", "are my tests any good". Scopes to changed files only (never whole-repo). Do NOT use to write or fix tests — a surviving mutant is handed back to the TDD implementer.
---

# Mutation testing — proving the tests bite (StrykerJS)

> A green suite says "the code doesn't explode on these inputs." It does **not** say "the tests would fail if the code were wrong." Mutation testing measures the second thing.

**When it runs:** once, **after** the full review — the final quality gate before DoD. It mutates the feature's changed files (vs the **delivery branch**, not blind `main`), so it covers the code the review just fixed as well as the original build. The threshold must be met and every survivor killed, **or the gate escalates to the human — agents never fabricate a PASS** (see §Escalate-only).

## How it works

StrykerJS introduces small defects (*mutants*) into the source and re-runs the Jest suite:

- Some test **fails** → mutant **killed** (good — the net caught it).
- All tests **pass** → mutant **survived** (bad — a hole: a missing assert or case).

**Mutation score = killed / total.** Higher = tests bite harder.

## Run it (scoped to the feature's changed files)

Always mutate **only the files the feature changed** — never the whole repo. The helper computes the changed source per lib (vs the base ref) and runs Stryker for each affected lib. It is **hardened for agent/CI use**: it continues across every affected lib and aggregates the exit code (no abort on the first lib under threshold), refuses to start if a Stryker run is active (`.stryker-tmp`), forces non-TTY reporters (`CI=1`; configs emit `clear-text,json,html`, never `progress`), and — with `ORCHESTRATOR_FEATURE=<name>` — stubs `mutation.md` from the JSON via `parse-mutation-report.mjs`.

```bash
export ORCHESTRATOR_FEATURE=<name>
# Base ref: explicit arg → $ORCHESTRATOR_BASE_REF → auto-detected feature-entrega* → main.
# Pass the DELIVERY BRANCH — never a blind main (that pulls the whole entrega into scope).
.agents/skills/mutation-testing/scripts/run-mutation.sh feature-entrega3-HernanLaura
# then (run-mutation.sh calls it for you when ORCHESTRATOR_FEATURE is set):
node .agents/skills/mutation-testing/scripts/parse-mutation-report.mjs <name>
```

**Do not hand-roll `stryker`** and **do not `python`/`node -e`/`rg` the HTML report** — the helper + parse script own scope, reporters, and the `mutation.md` table. Run a single lib by hand only for debugging:

```bash
pnpm --filter @helsoft/services            exec stryker run --mutate "src/services/foo.service.ts,src/dao/foo.dao.ts"
pnpm --filter @helsoft/supabase-services   exec stryker run --mutate "src/services/foo.service.ts,src/dao/foo.dao.ts"
pnpm --filter @helsoft/hooks           exec stryker run --mutate "src/hooks/use-foo.ts"
pnpm --filter @helsoft/components      exec stryker run --mutate "src/atoms/foo/foo.tsx"
pnpm --filter @helsoft/logging-in-out  exec stryker run --mutate "src/organisms/foo/foo.tsx"
pnpm --filter @helsoft/activities      exec stryker run --mutate "src/organisms/foo/foo.tsx"
pnpm --filter @helsoft/study-buddy     exec stryker run --mutate "src/components/foo/foo.tsx"
```

Per-lib config lives in `libs/<lib>/stryker.config.mjs` (Jest runner; `coverageAnalysis: 'perTest'`; `thresholds.break = 100`).

## Tooling notes

- `@helsoft/services` (REST), `@helsoft/hooks` — ts-jest; `checkers: ['typescript']`.
- `@helsoft/supabase-services` — ts-jest + `checkers: ['typescript']`, **plus `inPlace: true`** baked into its config (Edge-relative imports don't resolve in Stryker's sandbox copy). This is now config-owned — **agents must not hand-roll `stryker --inPlace`** (it was invented ad-hoc during the entitlements run).
- `@helsoft/components` — jest-expo/babel; no typescript checker. UI components are mutated via their `<name>.test.tsx` unit tests.
- `@helsoft/logging-in-out`, `@helsoft/activities`, `@helsoft/study-buddy` — jest-expo/babel like `components`, plus `inPlace: true` (their jest `setupFiles` reach into the sibling `@helsoft/components` theme, which Stryker's sandbox copy can't resolve).
- Reporters are `clear-text,json,html` (no `progress`) so agent/CI shells don't hit the "console doesn't support progress" downgrade; `json` is what `parse-mutation-report.mjs` reads.
- `src/**/test-utils/**` is never mutated (pure test-fixture builders; unkillable mutants) — excluded both by `run-mutation.sh` and per-lib `stryker.config.mjs`.

## Scope & threshold (feature policy)

- **Mutate only the feature's changed files** (changed `.ts` for logic, changed `.tsx` for components). No global runs.
- **Threshold: 100% of mutants killed on the new/changed lines** (`thresholds.break = 100`). Legacy untouched code is measured, not blocked.
- `coverageAnalysis: 'perTest'` keeps runs affordable (Stryker re-runs the suite per mutant — compute-bound, the slowest gate; that cost is the point).
- **Equivalent mutants** (no observable behavior change) may be excluded **only** with a written justification in `docs/features/<name>/mutation.md`.
- **A high error-mutant count (CompileError/RuntimeError) is a ⚠, never a PASS.** It means the config/sandbox is off (the entitlements run had 81 error mutants "passing"). `parse-mutation-report.mjs` surfaces it; investigate or escalate.

## Escalate-only (no fabricated PASS)

The mutation gate is **escalate-only**. If the threshold is unmet after **≤ 2 kill rounds**, the reviewer returns **`ESCALATE`** (hard) and the human decides. Agents must **never**:
- rewrite surviving/error mutants as killed, or edit the score in `mutation.md`;
- invent a `human-excluded` column/schema to manufacture 100%.

A human may waive a specific survivor **outside** the gate (a documented decision), but the agent-run gate never self-certifies a PASS it didn't earn.

## Atom mutate ban

**Do not mutate (and prefer not to edit) `libs/*/src/atoms/**` unless the user story _owns_ that atom** (the story is about changing that atom's API/behavior). `run-mutation.sh` drops non-owned atom files from the mutate scope and warns; signal ownership with `ORCHESTRATOR_ATOM_OWNED=<atom-path-or-name[,...]>` only when it's true.

Why: a feature that touched a shared atom for its own a11y/focus (e.g. adding a `ref` to `IconButton`) makes Stryker mutate the **whole** atom — styles/defaults on pre-existing untested lines — producing a survivor flood (the `activity-image-sizing` run: 19 survivors, ~54%, when the real feature delta had 1). **Fix:** revert the atom edit and put focus/behavior on a **local wrapper** (`View`/dialog container), not the shared atom.

## What is / isn't mutated

- **In scope (Jest-testable):** services, hooks, DAOs, and component logic/behavior (`.tsx`).
- **Out of scope:** Playwright `.e2e.js` visual tests (Stryker's Jest runner can't run them) and `*.stories.tsx`. Playwright (see the `storybook-e2e-tests` skill) guards rendered/visual behavior; Jest is what mutation bites.

## Reporting

`parse-mutation-report.mjs <name>` writes `docs/features/<name>/mutation.md` from the per-lib JSON: a per-lib `total / killed / survived / errors / score` table + each **surviving mutant** as `file:line` + mutator. Don't scrape the HTML by hand. A survivor is not fixed here — it's handed to `implementer`, who writes the red test that kills it (a kill isn't real until a Stryker re-run confirms it). **Style / `flattenStyle` asserts alone don't kill layout mutants** — prefer behavioral assertions.
