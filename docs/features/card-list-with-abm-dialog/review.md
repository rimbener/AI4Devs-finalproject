# Full review — card-list-with-abm-dialog

Durable trail (`reviews_lead`). Never emptied; every finding retained across rounds, marked
`open`/`resolved`/`ACCEPTED`. Covers the **full** review (all 3 vertical slices combined), run
after per-slice review (`review-spec.md` for the spec gate, `review-slice.md` for the 3 per-slice
design/a11y/rules reviews — all findings there already `resolved`, slice 3 approved with zero
findings). Mutation testing is a separate phase (`mutation_tester`), not part of this file.

Sole full reviewer this round: `reviewer_engineering` (code quality/TDD discipline ·
architecture/layering · runtime/delivery performance · security). Design and accessibility are
**not** re-covered here — already fully covered per slice in `review-slice.md`.

---

## Round 1

**Commit range reviewed:** `feature-entrega3-HernanLaura..HEAD` (`b66c101ef..61087aa22`, branch
`feat/card-list-with-abm-dialog`), all 3 vertical slices (task-1, task-2, task-3) combined.

**CI (run once by `reviews_lead`, not the reviewer):**
- `pnpm lint` — green, repo-wide (turbo, 14 packages, cached where unaffected).
- `pnpm check-types` — green, repo-wide (turbo, 14 packages, full cache hit).
- `pnpm test` — green, repo-wide (turbo, 12 packages with tests).
- Feature e2e — `libs/components/tests/e2e/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.e2e.js`
  run explicitly (not just via turbo cache): 5/5 passed, single parallel run (`--reporter=list`),
  no flake observed — no need to serialize/re-run.
- **CI green @ `61087aa22`.**

**Reviewer invoked:** `reviewer_engineering` (sole full reviewer) — full findings in
`review-engineering.md`. Lens coverage: code quality/TDD — applicable, reviewed; architecture —
applicable, reviewed; performance — applicable (FlatList/renders present), reviewed; **security —
marked N/A by the reviewer** (pure presentational UI organism in `@helsoft/components`; no
service/DAO/auth/network/storage/Supabase surface touched anywhere in the diff, no secrets/env
reads, no logging, confirmed via grep — reasoning recorded in `review-engineering.md`).

### Verdict: CHANGES_REQUESTED

Per protocol, **any** finding (any severity, including minor) blocks approval. Two minor findings
below — both must be fixed before this round can close.

### Findings

1. **[perf] minor — `resolved` (round 2)** — Fixed: `CardListRow` now wrapped in `memo` (generic-preserving cast,
   `as <TItem>(props: CardListRowProps<TItem>) => ReactNode`), and its `onEditPress`/`onRemovePress`
   call-throughs wrapped in `useCallback(() => onEditPress(item), [onEditPress, item])` /
   `useCallback(() => onRemovePress(item), [onRemovePress, item])`, mirroring
   `pdf-document-list.tsx`'s `PdfDocumentListRow`. `pnpm --filter @helsoft/components lint
   check-types test` green (70 suites/515 tests) and the feature's Playwright e2e re-run 5/5
   passed; no test changes needed (non-functional fix, existing `.test.tsx`/`.e2e.js` assertions
   still pass unmodified).

   **Round 2 verification (`reviewer_engineering`, delta review of commit `174d6b455`):** confirmed
   resolved. The `memo` + generic-preserving cast is a sound, standard TS workaround (compile-time
   only; the component body never branches on the concrete `TItem`, so the cast reflects genuinely
   generic-safe runtime behavior); does not defeat displayName/devtools (name resolved from the
   named function expression). The perf benefit is genuine, not cosmetic, in the component's most
   frequent re-render path: `renderItem` and `openEditDialog`/`openRemoveDialog` are all stably
   `useCallback`'d (deps `[]`), so per-row `item` references stay stable across `dialogState`/
   `isSubmitting` toggles — matching exactly the scenario the `pdf-document-list.tsx` precedent was
   memoized for. No new finding introduced by the fix.

   Original finding — `CardListRow` (`libs/components/src/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.tsx:167-206`)
   is not wrapped in `memo`, unlike the closest precedent row in this lib, `PdfDocumentListRow`
   (`libs/components/src/organisms/pdf-document-list/pdf-document-list.tsx:164-187`), which is
   explicitly memoized with an inline comment citing a prior full-review perf finding ("keeps
   per-cell handlers stable across parent `FlatList` re-renders"). The per-item press handlers
   `onPress={() => onEditPress(item)}` / `onPress={() => onRemovePress(item)}`
   (`card-list-with-abm-dialog.tsx:189`, `:199`) are also recreated on every render of
   `CardListRow` with no `useCallback`, whereas the precedent wraps its equivalent handlers in
   `useCallback(..., [onRequestDelete, item.id])`. `CardListWithABMDialog` re-renders on every
   `dialogState`/`isSubmitting` change (dialog open/close, submit toggle); if `FlatList` ever
   re-invokes `renderItem` on those parent re-renders, every visible row recreates its
   `IconButton` handler references — O(N) unneeded work per re-render where the lib's own
   established convention (same organism family, same `FlatList`-of-`Card`-rows shape) already
   demonstrates O(1) is achievable. Not correctness-affecting, but a real regression against a
   lesson this same lib already learned and encoded in its closest analog.
   - **Fix:** wrap `CardListRow` in `memo`, and wrap its `onEditPress`/`onRemovePress`
     call-throughs in `useCallback(() => onEditPress(item), [onEditPress, item])` (mirroring
     `pdf-document-list.tsx:164-187`).

2. **[code] minor — `resolved` (round 2)** — Fixed: extracted the shared `isSubmitting`-swap shape into two
   local helpers in `card-list-with-abm-dialog.tsx` — `dialogInteractionProps` (the
   `onClose`/`actions` swap, spread into both `Dialog`s) and `renderDialogBody(type, render)` (the
   body ternary, called by both `Dialog`s with `'edit'`/`renderEditForm` and
   `'remove'`/`renderRemoveConfirmation`). Both `Dialog` blocks now share one code path for the
   duplicated shape. `pnpm --filter @helsoft/components lint check-types test` green and the
   feature's e2e re-run 5/5 passed; no test changes needed (non-functional fix).

   **Round 2 verification (`reviewer_engineering`, delta review of commit `174d6b455`):** confirmed
   resolved. Verified by case analysis that `renderDialogBody`'s `dialogState?.type !== type`
   early-return is the exact logical negation of the original `=== type ? ... : null` ternary for
   all three cases (null state, matching type, other-dialog's type) — behavior-preserving.
   `dialogInteractionProps`'s per-render object literal is a trivial allocation, no regression.
   The `{...dialogInteractionProps}` spread is fully compatible with `DialogProps`'s optional
   `onClose`/`actions` shape. No new finding introduced by the fix.

   Original finding — Duplicated `isSubmitting`-swap wiring across the two `Dialog`
   instances (`card-list-with-abm-dialog.tsx:121-154`). Both blocks repeat the identical shape:
   `onClose={isSubmitting ? undefined : closeDialog}`, `actions={isSubmitting ? EMPTY_DIALOG_ACTIONS : undefined}`,
   and a body ternary (`isSubmitting ? <SubmittingIndicator /> : render*(dialogState.item)`) gated
   on `dialogState?.type === 'edit'|'remove'`. Not a DRY blocker at this size (two call sites, each
   dialog genuinely has distinct data/labels), but the ~15 lines of repeated conditional structure
   could be extracted into a small local helper to remove the duplication outright.
   - **Fix:** extract the shared `isSubmitting`-swap shape into a small local helper (e.g. a
     `renderDialogBody(type, renderContent)` closure) reused by both `Dialog` blocks.

### Lenses checked, no findings this round

See `review-engineering.md` for the full detail (not copied here in full per protocol — summary
only): code quality/TDD discipline (every `@s1`-`@s18` maps to a concrete test across
`.test.tsx`/`.e2e.js`/`.stories.tsx`; hook has a logged Red→Green cycle in `tdd.md`; no
console/debug leftovers; i18n decision not re-litigated), architecture/layering
(`Component → Hook` respected, no DAO/service touched, generic types sound, `state.mdc`/
`state-sharing.mdc` correctly N/A, atom-ban respected, barrel updated), performance (`FlatList`
used per precedent, `keyExtractor`/`renderItem` correctly `useCallback`-stabilized — the one gap
is finding 1 above), security (N/A, reasoning above).

### Notes for the fix (implementer, TDD)

- Finding 1: `libs/components/src/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.tsx:167-206` —
  wrap `CardListRow` in `memo`; wrap `onEditPress`/`onRemovePress` call-throughs in `useCallback`.
  Mirror `libs/components/src/organisms/pdf-document-list/pdf-document-list.tsx:164-187`.
- Finding 2: `libs/components/src/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.tsx:121-154` —
  extract the duplicated `isSubmitting`-swap ternary shared by both `Dialog` blocks into one
  local helper.
- Re-run `pnpm --filter @helsoft/components lint check-types test` and this feature's Playwright
  e2e suite after the fix; no behavior change is expected (both findings are non-functional), so
  existing `.test.tsx`/`.e2e.js`/`.stories.tsx` assertions should continue to pass unmodified —
  confirm they do, and add/adjust a unit test only if `memo`/`useCallback` changes surface a new
  observable behavior worth asserting (e.g. a row-identity/re-render-count regression test), per
  TDD discipline.

---

## Round 2

**Commit range reviewed (delta only):** `61087aa22..174d6b455` — `implementer`'s single fix commit
(`fix(components): memoize CardListRow and extract dialog-swap helper`) on top of the round-1
reviewed HEAD, addressing both round-1 minor findings above. Confirmed via `git show --stat
174d6b455`: only `card-list-with-abm-dialog.tsx` changed production code; `review-engineering.md`
and `review.md` are doc-only additions.

**CI (run once by `reviews_lead`, not the reviewer):**
- `pnpm lint` — green, repo-wide (turbo, 14 packages).
- `pnpm check-types` — green, repo-wide (turbo, 14 packages).
- `pnpm test` — green, repo-wide (turbo, 12 packages with tests); `@helsoft/components` explicitly
  re-run (not cache-trusted): 70 suites / 515 tests passed, including
  `card-list-with-abm-dialog.test.tsx` and `use-card-list-with-abm-dialog.test.ts`.
- Feature e2e — `card-list-with-abm-dialog.e2e.js` run explicitly with `--reporter=list`: 5/5
  passed, single run, no flake observed.
- **CI green @ `174d6b455`.**

**Reviewer invoked:** `reviewer_engineering`, scoped to the fix delta only (`git diff 61087aa22
174d6b455 -- .../card-list-with-abm-dialog.tsx` plus the full commit), per round-2 protocol — not a
full re-review, only confirming the two round-1 findings are resolved and the fix mechanics
themselves introduce nothing new. Verdict: **RESOLVED**. Full delta analysis recorded in
`review-engineering.md` under "## Round 2 — fix-delta verification"; summary folded into each
finding's `resolved` note above.

### Verdict: APPROVED

Both round-1 minor findings confirmed resolved; no new blocker/major/minor finding introduced by
the fix itself (generic-preserving `memo` cast verified sound; `dialogInteractionProps`/
`renderDialogBody` extraction verified behavior-preserving). Zero findings open. CI green @
`174d6b455`. `review_round` incremented to 2 in `tasks.md`.

---

## Post-pr_ready mini-gate review — empty-dialog flash on close

**Context.** The feature had already reached `pr_ready` (Round 2 above, APPROVED, plus a
human-accepted 97.2% mutation score — see `mutation.md`). After `pr_ready`, the human reported a
bug: closing the edit/remove dialog briefly showed an empty dialog body while the shared `Dialog`
organism's `Modal` faded out. This was fixed as a scoped mini-gate reopen (not a full feature
re-review): root cause and intended fix shape are recorded in `spec.md`'s last "Open decisions"
entry ("Post-`pr_ready` bug fix (mini-gate)"); the new contract is `gherkin-scenarios.md`'s
`@s19`/`@s20`.

**Commit reviewed (delta only):** `8aa12b28e129a706c47642fee770b264489fe3ac` —
`fix(components): stop empty-dialog flash on CardListWithABMDialog close`, on top of the
`pr_ready` HEAD reviewed in Round 2. Touches only:
- `libs/components/src/organisms/card-list-with-abm-dialog/use-card-list-with-abm-dialog.ts`
  (production) — added a second `isOpen` boolean state, decoupled from the existing `dialogState`
  discriminated union; `closeDialog` now only flips `isOpen` false instead of nulling
  `dialogState`.
- `libs/components/src/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.tsx`
  (production) — both `Dialog`'s `open` prop gated on `isOpen && dialogState?.type ===
  'edit'|'remove'` instead of just `dialogState?.type === ...`.
- `use-card-list-with-abm-dialog.test.ts` / `card-list-with-abm-dialog.test.tsx` (tests) — new
  `@s19`/`@s20` coverage, including a fully-delegating `jest.mock('../dialog/dialog', ...)` spy
  (`jest.fn(actual.Dialog)`) to inspect `Dialog`'s exact `open`/`children` props at the close tick.
- `docs/features/card-list-with-abm-dialog/tdd.md` (doc-only).

Not a re-review of the whole feature — Round 1/Round 2 findings above are not re-litigated (both
already `resolved`).

**CI (run once by `reviews_lead`, not the reviewer):**
- `pnpm lint` — green, repo-wide (turbo, 14 packages).
- `pnpm check-types` — green, repo-wide (turbo, 14 packages).
- `pnpm --filter @helsoft/components test` — explicitly re-run: 70 suites / 529 tests green,
  including both delta test files.
- `pnpm test` (repo-wide, `--output-logs=errors-only`) — one failure surfaced:
  `@helsoft/activities`'s `slide-view.test.tsx` ("renders a bounded 50/50 split row for a portrait
  image") timed out at 5000ms under full parallel `turbo run test`. Confirmed **pre-existing,
  unrelated flake**: re-ran `@helsoft/activities` serialized (`pnpm exec jest --runInBand`) — all
  32 suites/401 tests green, the same test completing in 1198ms; re-ran in isolation — also green.
  `@helsoft/activities` has zero overlap with this feature's delta (`@helsoft/components`, an
  unrelated organism/lib) — scoped out per protocol as pre-existing infra debt, not absorbed as a
  feature fix. Documented here, not silently dropped.
- Feature e2e — `card-list-with-abm-dialog.e2e.js` re-run explicitly (`--reporter=list`): 5/5
  passed. No new e2e added for `@s19`/`@s20` — documented, reasonable decision in `tdd.md`:
  animation-timing isn't reliably Playwright-assertable without flakiness (and `Dialog`'s `Modal`
  is instant-hide, not animated, under the RN Jest/JSDOM test environment anyway), covered instead
  at the hook/component-prop level.
- **CI green @ `2b50eb877`** (current worktree HEAD).

**Reviewer invoked:** `reviewer_engineering`, scoped to the mini-gate delta only (commit
`8aa12b28e` in full, plus the full current source of both production files for context). Full
findings recorded in `review-engineering.md` under "## Mini-gate bug-fix delta review — empty-dialog
flash on close".

### Verdict: APPROVED

**Zero findings, at any severity, across all four lenses:**
- **Code quality/TDD** — `@s19`/`@s20` map to concrete, demonstrably Red→Green tests at both the
  hook level (`isOpen`/`dialogState` assertions) and component-prop level (`bodyText`/`open` on
  the `Dialog` spy); reasoned against the pre-fix hook and confirmed to fail without the fix. The
  `jest.mock('../dialog/dialog', ...)` spy fully delegates (`jest.fn(actual.Dialog)`, doesn't
  alter behavior for any of the file's ~20 pre-existing tests); `DialogMock.mockClear()` correctly
  scoped (call-history only, delegation persists). The `bodyText()` shallow-string workaround is a
  faithful proxy for "did the last content survive," not a masked assertion gap. No console/TODO
  leftovers.
- **Architecture/layering** — two `useState` fields (`dialogState`, `isOpen`), below `state.mdc`'s
  ≥3-threshold; traced every call site — `isOpen === true && dialogState === null` is unreachable,
  so the "only one dialog open" invariant still holds. Inline `isOpen && dialogState?.type === X`
  gating in the `.tsx` continues the exact pre-existing, already-`APPROVED` Round-1 pattern, not a
  new `component-split.mdc` violation. Zero diff to `dialog.tsx`/`dialog.types.ts` — atom-ban
  respected, fix is entirely local to the consuming hook/component per spec.md's stated rationale.
- **Runtime/delivery performance** — one added `useState`, negligible. `openEditDialog`/
  `openRemoveDialog`'s two `setState` calls batch into one render (no doubling vs. pre-fix).
  Stale-reference retention of `dialogState.item` between close and next open is bounded to one
  item at a time, released on the next open or unmount — the fix's explicit, spec.md-documented
  intent (@s19/@s20), not a leak.
- **Security** — **N/A**, confirmed: only the hook and component are touched, no service/DAO/auth/
  network/storage/Supabase surface, no secrets/env reads, no logging (`grep` clean).

No change request issued — nothing for `implementer` to fix this round.

---

*Full findings trail retained above — nothing deleted. Round 1's two minor findings and Round 2's
verification remain marked `resolved`; the post-`pr_ready` mini-gate delta review above is a clean
`APPROVED` round with zero findings of any severity. `review-engineering.md` carries the full
lens-by-lens detail for every round, including this mini-gate delta, under its own matching
section headers.*
