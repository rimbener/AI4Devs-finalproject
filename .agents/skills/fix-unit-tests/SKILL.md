---
name: fix-unit-tests
description: >
  Run a workspace's unit tests with `pnpm --filter <workspace> test` and fix every failing test
  until the suite is green. Use this whenever the user wants to fix failing tests, get a lib or app
  "green"/"passing", repair tests broken by a refactor or moved code, or says something like
  "run the tests in <folder> and fix the failures". Trigger even if they only point at a folder
  and say "tests are broken" — that's this skill.
---

# Fix Unit Tests

Take a workspace folder, run its test suite, and drive it to green by fixing the tests —
without weakening what they verify. Testing conventions: `.agents/rules/unit-tests.mdc`.

## Input

A single workspace folder: a lib (`libs/*`) or the app (`apps/app-study-buddy`). That folder has a
`package.json` with a `test` script (`jest --coverage=false --passWithNoTests --watchman=false`)
and a workspace name (`@helsoft/*`, or `app-study-buddy`).

If no folder was given, infer it from the packages touched on the current branch
(`git diff --name-only main...HEAD`); if that's ambiguous, ask which folder before running.

## The one rule that matters: fix the test, not by gutting it

A test fails for one of two reasons, and telling them apart is the whole job:

1. **The test is stale.** The code legitimately changed — a module moved, an export was
   renamed, a prop became required, a mock's shape drifted. The test is asserting against a
   world that no longer exists. **This is yours to fix.** Update the test to match current
   reality: fix the import path, the mock, the props, the expected value.

2. **The code regressed.** The test encodes correct behavior and the source genuinely broke
   it. **This is NOT yours to fix** (you're scoped to tests, and root `AGENTS.md` requires
   asking the user before modifying source code in response to a "fix unit tests" request). Do
   not edit source, and — this is the trap — do not "fix" the test by deleting the failing
   assertion, loosening a matcher, wrapping it in a try/catch, `.skip`-ing it, or changing the
   expected value to whatever the broken code now returns. That turns a real bug into a silent
   green check, which is worse than a red one. Leave it failing and report it as a suspected
   source regression with the evidence.

The test's job is to verify user-facing behavior. Every fix must preserve that intent. If
you can't make a test pass without weakening what it checks, that's the signal it belongs in
bucket 2 — flag it, don't force it.

## Workflow

1. **Run the full suite** for the workspace:
   ```bash
   pnpm --filter <workspace> test   # e.g. --filter @helsoft/hooks, --filter app-study-buddy
   ```
2. **Collect the failures.** For each failing test, read the failure message, the test file,
   and the source it exercises. Form a hypothesis: stale test (fix it) or source regression
   (flag it).
3. **Fix the stale ones.** Make the smallest change that restores the test's original intent
   against the current code. Match the surrounding test style and this repo's testing rules
   (mock at the DAO/service boundary per `.agents/rules/hooks-service-dao.mdc`, an inline
   `QueryClientProvider` wrapper for tanstack-query hooks per `.agents/rules/tanstack-query.mdc`,
   `@testing-library/react-native`'s `renderHook` — never `@testing-library/react-hooks`).
4. **Re-run the affected files** to confirm — jest takes path args, so you don't re-run the
   whole workspace each round:
   ```bash
   pnpm --filter <workspace> test -- path/to/file.test.tsx another.test.ts
   ```
5. **Loop.** Repeat 2–4 until either all tests pass or a full round produces no new passes
   (you're stuck on the remaining ones — those are flags, not fixes).
6. **Final full run** of `pnpm --filter <workspace> test` to confirm nothing else broke, then
   report.

## Snapshot failures

A stale snapshot is just a stale test in another form, so updating it is in scope — and
because snapshots churn constantly after legitimate refactors, update them automatically once
you've confirmed the diff is benign:

```bash
pnpm --filter <workspace> test -- -u path/to/file.test.tsx   # -u / --updateSnapshot passes through to jest
```

But run the same bucket check first — `jest -u` is the snapshot version of "delete the
assertion to force green," so don't reach for it blind. Read the snapshot diff:

- The diff is a **legitimate rendering change** — a moved import, renamed test ID, restyled
  markup, a prop you intentionally changed. The snapshot is stale; update it. This is the
  common case and you should just do it.
- The diff exposes a **regression** — text that's now wrong, an element that disappeared, a
  value the source computes incorrectly. Updating the snapshot would bake the bug in as the
  new "expected." That's bucket 2: leave it red and flag it, exactly as with any other
  source regression.

When you do update, scope `-u` to the specific failing test files, not the whole suite, so an
unrelated stale snapshot elsewhere doesn't get silently rewritten in the same pass.

## Report

End with a concise summary:

```
## Fixed (<n>)
- <file>: <what changed and why> (e.g. "updated import after X moved to @helsoft/Y")

## Could not fix — needs attention (<n>)
- <file>: <failing assertion> — suspected source regression: <evidence>. Left red on purpose.

## Final: <X passed / Y failed> via `pnpm --filter <workspace> test`
```

If everything passed, say so plainly and give the final count. Don't claim green unless the
final full `pnpm --filter <workspace> test` run actually was.
