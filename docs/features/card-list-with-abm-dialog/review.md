> ⚠ **STALE relative to current code.** Everything below predates a substantial human-authored
> architecture rewrite (Context + `useReducer`, atom/molecule/organism extraction) and a new
> Add-dialog feature (see `spec.md`'s "Issues found by this doc pass" and `task-4.md`). This delta
> has not been reviewed by `reviewer_engineering`/`reviews_lead`. Do not read the APPROVED verdicts
> below as covering the current tree.

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

## Post-pr_ready mini-gate review — CardListRow extraction

**Context.** The feature was already `pr_ready` (Round 2 above, APPROVED; plus the empty-dialog
flash mini-gate above, also APPROVED; plus a human-accepted 97.2% mutation score — see
`mutation.md`). The human then asked for a second, purely structural mini-gate: promote
`CardListRow` — previously an inline, unexported component in `card-list-with-abm-dialog.tsx` with
no `.stories.tsx` of its own — to its own molecule, `libs/components/src/molecules/card-list-row/`,
matching this lib's `PdfDocumentListItem` precedent. Full rationale in `spec.md`'s last "Open
decisions" entry ("Post-`pr_ready` architecture fix (mini-gate)"). Intended as a pure structural
move: no prop/behavior/API change, no new `@s` scenarios.

**Commit reviewed (delta only):** `e4b2a5a54` — `refactor(components): extract CardListRow to its
own molecule`, on top of the empty-dialog-flash mini-gate HEAD above. Touches:
- New: `libs/components/src/molecules/card-list-row/card-list-row.tsx`, `.types.ts`,
  `.stories.tsx`, `.test.tsx`.
- Modified: `libs/components/src/molecules/index.ts` (barrel export added);
  `organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.tsx` (`CardListRow` definition
  removed, now imports it from the molecule);
  `organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.test.tsx` (row-level tests moved
  out, organism-level tests kept).
- Doc-only: `spec.md`, `tdd.md`.

Doc-only follow-up commit `902b30c87` (touches only `tasks.md`, flips status to `in_review`) is
not itself part of the reviewed delta. Not a re-review of the whole feature — Round 1/Round 2/the
empty-dialog-flash mini-gate above are not re-litigated (all already `resolved`/`APPROVED`).

**CI (run once by `reviews_lead`, not the reviewer):**
- `pnpm lint` — green, repo-wide (turbo, 14 packages).
- `pnpm check-types` — green, repo-wide (turbo, 14 packages, full cache hit).
- `pnpm test` — green, repo-wide (turbo, 12 packages with tests); `@helsoft/components` explicitly
  reflected in the run: 71 suites / 534 tests passed, including the new
  `libs/components/src/molecules/card-list-row/card-list-row.test.tsx`.
- Feature e2e — `tests/e2e/organisms/card-list-with-abm-dialog/` run explicitly
  (`--reporter=list`): 5/5 passed, single parallel run, no flake observed.
- **CI green @ `902b30c87`** (current worktree HEAD at that time).

**Reviewer invoked:** `reviewer_engineering`, scoped to the extraction delta only (commit
`e4b2a5a54` in full, plus the current full contents of every touched file and the cited precedent,
`pdf-document-list-item`/`pdf-document-list`). Full findings recorded in `review-engineering.md`
under "## Post-pr_ready mini-gate delta review — CardListRow extraction (architecture/molecule
split)".

### Verdict (initial): CHANGES_REQUESTED

One major finding below (architecture/layering) — blocks approval per protocol (any finding, any
severity, blocks). Everything else — code quality/TDD, performance, security — checked clean, zero
findings.

### Findings

1. **[arch] major — `resolved` (fix verified below)** — Fixed: `CardListRowProps` flattened to primitives (`content`,
   `disabled?`, `showEditButton?`/`showRemoveButton?`, `onEditPress: () => void`,
   `onRemovePress: () => void`, `editAccessibilityLabel`/`removeAccessibilityLabel: string`,
   `testID?`/`editTestID?`/`removeTestID?: string`) — zero import from
   `organisms/card-list-with-abm-dialog/*`. Reintroduced a thin, unexported, generic
   `CardListRowAdapter` in `card-list-with-abm-dialog.tsx` (mirroring `pdf-document-list.tsx`'s
   `PdfDocumentListRow`) that maps `CardListItem<TItem>` + the organism's builder-prop/callback
   vocabulary down to `CardListRow`'s flat props at the `renderItem` call site; the three
   `card-list-with-abm-dialog-*` testID-literal helpers moved back to the organism (they were
   never a portable-molecule concern). `card-list-row.tsx`/`.stories.tsx`/`.test.tsx` updated to
   the flat shape with equivalent coverage; `card-list-with-abm-dialog.test.tsx`'s testID-helper
   import switched to the organism module. `pnpm --filter @helsoft/components lint check-types
   test` green (71 suites/533 tests) and the feature's Playwright e2e re-run 5/5 passed; no `@s`
   scenario changed. Full detail in `review-engineering.md`'s "Fix applied (implementer)" note
   under the same section.

   **Fix-delta verification (`reviewer_engineering`, delta review of commit `f753311a5`):**
   confirmed resolved — full detail in the "Fix verification — round 2 of this mini-gate"
   subsection below.

   Original finding — `CardListRow`'s new molecule types file inverts the atomic-design
   dependency direction the refactor was supposed to fix, and does not actually match the
   precedent its own `spec.md` rationale claims to mirror.

   `libs/components/src/molecules/card-list-row/card-list-row.types.ts:1`:
   ```ts
   import type { CardListItem } from '../../organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.types';
   ```
   `CardListRowProps<TItem>` (`card-list-row.types.ts:6-12`) is defined entirely in terms of this
   imported **organism** type (`item: CardListItem<TItem>`, `onEditPress: (item: CardListItem<TItem>) => void`,
   etc.) — the molecule imports its whole prop shape from the organism it was extracted out of.
   The call site confirms there is no flattening/adapter step left anywhere:
   `card-list-with-abm-dialog.tsx:60-68`'s `renderItem` passes the organism's full generic
   `CardListItem<TItem>` straight through to `<CardListRow item={item} .../>` with zero mapping.

   Compare against the precedent `spec.md`'s rationale explicitly cites, `pdf-document-list-item`:
   `PdfDocumentListItemProps` (`libs/components/src/molecules/pdf-document-list-item/pdf-document-list-item.types.ts:3-12`)
   is fully flat/primitive (`filename: string`, `status: PdfDocumentStatus`, `createdAt: string`,
   `pageCount: number | null`, plain `onGenerate?`/`onOpenLesson`/`onDelete?` callbacks) — **zero
   import from `organisms/pdf-document-list/pdf-document-list.types.ts`**. The organism keeps its
   own thin, unexported, `memo`-wrapped adapter row, `PdfDocumentListRow`
   (`organisms/pdf-document-list/pdf-document-list.tsx:19-23,164-187`), which is the piece that
   maps the organism's `PdfDocumentListItemData` DTO down to the molecule's flat props at the call
   site — that adapter is intentionally *not* promoted to the molecule layer, precisely so the
   molecule stays organism-agnostic.

   This is a real violation of `.agents/rules/atomic-design.mdc`'s "Compose upward" principle
   (an atom never imports a molecule — applied one level up here: a molecule should not import
   from the organism that consumes it) and of the same file's molecule contract ("still portable
   and reusable — drop in wherever that pattern is needed"): `CardListRow` cannot currently be
   dropped into an unrelated context without also importing `card-list-with-abm-dialog.types.ts`,
   coupling it to that one organism's generic `TItem`/dialog-orchestration vocabulary
   (`getEditAccessibilityLabel`/`getRemoveAccessibilityLabel` builder-function props, not resolved
   strings). Legal TypeScript, not a runtime bug (CI green, behavior unchanged) — but it does not
   deliver what `spec.md`'s rationale claims ("it's a composed unit… not organism-specific chrome" /
   "matches this lib's own precedent"): the precedent's whole point is that the molecule *isn't*
   organism-specific, and this one still is.
   - **Fix (implementer, TDD):** flatten `CardListRowProps` to primitives (`content: ReactNode`,
     `disabled?: boolean`, `showEditButton?/showRemoveButton?: boolean`, `onEditPress: () => void`,
     `onRemovePress: () => void`, `editAccessibilityLabel: string`, `removeAccessibilityLabel:
     string` — resolved by the caller, not builder functions) and reintroduce a thin, unexported
     row-adapter in the organism (mirroring `PdfDocumentListRow`) that maps `CardListItem<TItem>` →
     those flat props at the call site. This is the true structural mirror of the cited precedent.
     (Alternative if the human instead accepts the generic-payload coupling as an intentional,
     narrower exception for this generic-over-`TItem` case: `spec.md`'s rationale must be amended
     to say so explicitly rather than claim full alignment with a precedent it doesn't structurally
     match — but flattening is the reviewer's and reviews_lead's recommended path, since it fully
     achieves the mini-gate's own stated goal.)

### Lenses checked, no findings this round

See `review-engineering.md`'s "## Post-pr_ready mini-gate delta review — CardListRow extraction
(architecture/molecule split)" section for full detail (not copied here in full per protocol —
summary only): code quality/TDD discipline (no new `@s` scenarios needed, confirmed genuinely a
pure structural move; new `.test.tsx`/`.stories.tsx` for the molecule are genuine, non-degraded
coverage — icon visibility, disabled state, per-item accessible names, press callbacks, all three
testID-helper exports preserved verbatim, all moved 1:1 out of the organism's old test with no gap;
story covers BothIcons/EditOnly/RemoveOnly/Disabled meaningfully, nothing broken in the move),
architecture/layering aside from finding 1 (`Component → Hook` chain untouched, no DAO/service
import, barrel wiring in `molecules/index.ts` correct and matches the `pdf-document-list-item`
entry's exact two-line shape), performance (confirmed genuinely neutral — same `memo` +
generic-preserving cast, same `useCallback`'d `onEditPress`/`onRemovePress` call-throughs,
byte-identical to the pre-move inline code, only the module boundary changed), security (N/A,
confirmed via targeted grep across both touched directories — no service/DAO/auth/network/storage/
Supabase surface, no secrets/env reads, no logging).

### Notes for the fix (implementer, TDD)

- Finding 1: `libs/components/src/molecules/card-list-row/card-list-row.types.ts:1` — remove the
  `import type { CardListItem } from '../../organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.types'`
  dependency. Flatten `CardListRowProps<TItem>` to primitive/resolved props (no organism-owned
  generic type), and add a thin, unexported adapter component in
  `card-list-with-abm-dialog.tsx` (mirroring `pdf-document-list.tsx:19-23,164-187`'s
  `PdfDocumentListRow`) that maps the organism's `CardListItem<TItem>` down to the molecule's flat
  props at the `renderItem` call site (`card-list-with-abm-dialog.tsx:60-68`).
- This is a pure structural fix — no new `@s` scenario, no behavior change expected. Existing
  `card-list-row.test.tsx`/`.stories.tsx` will need updating to the new flat prop shape (still
  genuine coverage, same assertions, different prop names/values); existing
  `card-list-with-abm-dialog.test.tsx`/`.e2e.js` assertions should continue to pass unmodified
  (organism-level behavior is unaffected).
- Re-run `pnpm --filter @helsoft/components lint check-types test` and this feature's Playwright
  e2e suite after the fix.
- If the fix is instead to keep the coupling and amend `spec.md`'s rationale (the documented
  alternative above), that still requires human sign-off on the amended rationale before this
  mini-gate can close — the reviewer's/reviews_lead's recommended path is the flattening fix.

### Fix verification — round 2 of this mini-gate

**Commit reviewed (delta only):** `f753311a5` — `fix(components): flatten CardListRow props, add
organism-owned adapter`, the only commit on top of the round-1-of-this-mini-gate HEAD (`902b30c87`)
reviewed above (`git diff 902b30c87 f753311a5`). Touches (production): `card-list-row.types.ts`,
`card-list-row.tsx`, `card-list-with-abm-dialog.tsx`; (tests) `card-list-row.stories.tsx`,
`card-list-row.test.tsx`, `card-list-with-abm-dialog.test.tsx`; (doc-only) `tdd.md` plus this file
and `review-engineering.md`.

**CI (run once by `reviews_lead`, not the reviewer):**
- `pnpm lint` — green, repo-wide (turbo, 14 packages).
- `pnpm check-types` — green, repo-wide (turbo, 14 packages, full cache hit).
- `@helsoft/components` test suite explicitly re-run, not cache-trusted (`pnpm exec jest`): 71
  suites / 533 tests passed, including `card-list-row.test.tsx` (flat-prop shape) and
  `card-list-with-abm-dialog.test.tsx` (organism-level `@s`-scenarios plus the testID-helper
  import switch).
- Feature e2e — `tests/e2e/organisms/card-list-with-abm-dialog/` re-run explicitly
  (`--reporter=list`): 5/5 passed, single run, no flake observed.
- **CI green @ `f753311a5`.**

**Reviewer invoked:** `reviewer_engineering`, scoped to the fix delta only (`git diff 902b30c87
f753311a5` plus full current contents of every touched file and the `pdf-document-list`/
`pdf-document-list-item` precedent), confirming three explicit questions per protocol:

- **(a) Flat/portable molecule types** — confirmed clean. `card-list-row.types.ts:1` now imports
  only `ReactNode` from `react`; the prior organism import is gone. `CardListRowProps` (no longer
  generic) is fully flat/primitive, structurally matching `PdfDocumentListItemProps` — the
  precedent match is now genuine, not merely claimed.
- **(b) Adapter preserves all prior behavior** — confirmed clean. The new `CardListRowAdapter`
  (`card-list-with-abm-dialog.tsx:38-72`) reproduces the three testID literal templates
  byte-identically (`cardListItemCardTestId`/`cardListItemEditTestId`/`cardListItemRemoveTestId`,
  now exported from the organism module — `card-list-with-abm-dialog.test.tsx`'s import switch
  resolves correctly, no stale reference to the old molecule path remains), resolves accessible
  names at the adapter boundary via `getEditAccessibilityLabel(item)`/`getRemoveAccessibilityLabel(item)`
  exactly as before, and wraps item-bound press callbacks with correct `useCallback` deps
  (`[onEditPress, item]`/`[onRemovePress, item]`) — same shape as the already-`resolved` Round-2
  perf fix, just relocated one layer up. Verified end-to-end via the organism's unchanged `@s5`-`@s9`
  tests: item-bound routing (item-2's edit opens item-2's dialog, item-1's remove confirms against
  item-1 only) still holds.
- **(c) No new issue introduced by the fix itself** — confirmed clean. No duplication/double-
  wrapping (the molecule no longer wraps handlers at all — exactly one `useCallback` binding point
  now, in the adapter). The generic-preserving `as <TItem>(props: CardListRowAdapterProps<TItem>)
  => ReactNode` cast is the same accepted, compile-time-only idiom already cleared in Round 2.
  `card-list-row.test.tsx`/`.stories.tsx` updated to the flat shape with equivalent, non-degraded
  coverage. No stale/orphaned imports or dead exports (both barrels use wildcard re-exports, no
  manual list to update). Security grep across both touched directories: still N/A, consistent with
  every prior round.

Full delta analysis recorded in `review-engineering.md` under "## Post-pr_ready mini-gate
fix-delta review — CardListRow flatten + organism-owned adapter".

### Verdict: APPROVED

**Zero new findings.** The one `[arch] major` finding above is confirmed genuinely resolved by
`f753311a5`; nothing new was introduced by the fix itself. CI green @ `f753311a5`. This mini-gate
is now closed with a clean approval — nothing outstanding for `implementer` to fix.

---

*Full findings trail retained above through the CardListRow-extraction mini-gate — nothing
deleted. Round 1's two minor findings and Round 2's verification remain marked `resolved`; the
empty-dialog-flash mini-gate is a clean `APPROVED` round with zero findings of any severity; the
CardListRow-extraction mini-gate's one major finding is confirmed `resolved` (fix verified in
commit `f753311a5`) and that section closed `APPROVED`. `review-engineering.md` carries the full
lens-by-lens detail for every round above, including both mini-gates, under its own matching
section headers.*

---

## Mini-gate 3: architecture rewrite + Add-dialog + real consumer wiring

**Context.** After the CardListRow-extraction mini-gate above closed `APPROVED`, the human authored
a large, direct rewrite outside `implementer` (undocumented by any TDD log until after the fact):
the organism-decomposition into `CardListWithABMDialogHeader`/`CardListWithABMDialogList`/
`CardListWithABMDialogDialog`/`CardListRowAdapter` + a `CardListWithABMDialogProvider`/
`useCardListWithABMDialogContext` React Context wrapping a `useReducer`; a new Add-dialog feature
(`renderAddForm`/`addDialogTitle`/`addSubmitLabel`/`addCancelLabel`/`onAddSubmit`, `errorMessage`,
`submitDisabled`, `showAddButton`); and real consumer wiring — `ApiKeySettingsScreen` now uses
`CardListWithABMDialog` directly, replacing the deleted `ApiKeyManager`/`ApiKeyFormDialog`/
`ApiKeySavedList`. Full rationale: `spec.md`'s "Architecture", "Open decisions", and "Outstanding"
sections; `task-4.md`; `gherkin-scenarios.md`'s `@s21`-`@s27`. This is this delta's **first** pass
through any review gate (`review_round` reset to 0 in `tasks.md` for this cycle, cap 2).

**Scope verified:** `git merge-base feature-entrega3-HernanLaura HEAD` == `git rev-parse
feature-entrega3-HernanLaura` (`080bc22f4`) — clean, fast-forward-mergeable ancestry, no divergence.
Diff reviewed: `feature-entrega3-HernanLaura..HEAD` (120 files, +7230/-2831), primarily
`libs/components/src/{atoms,molecules,organisms}/card-list-with-abm-dialog*` (the direct subject)
plus `libs/study-buddy/src/components/api-key-settings-screen/**` (real consumer wiring) and
supporting changes in `libs/hooks`, `libs/services`, `libs/localization`.

### CI (run once by `reviews_lead`, not the reviewer) — **RED, feature-caused**

- `pnpm lint` — green, repo-wide (turbo, 14 packages, cache hit).
- `pnpm check-types` — green, repo-wide (turbo, 14 packages, cache hit).
- `pnpm test` (repo-wide) — green via turbo, but fully cached (no packages re-executed by the
  cache-hit run) — **not trusted as-is**. Force-re-executed explicitly, not cache-trusted, for
  every package touched by this delta: `@helsoft/components` (72 suites / 517 tests, green),
  `@helsoft/study-buddy` (43 suites / 384 tests, green), `@helsoft/hooks` (21 suites / 182 tests,
  green), `@helsoft/services` (5 suites / 24 tests, green), `@helsoft/localization` (14 suites /
  245 tests, green, including `migration-coverage.test.ts`). All jest green.
- **Feature e2e — RED.** `libs/components/tests/e2e/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.e2e.js`:
  **4 of 5 tests fail**, reproduced twice — once parallel (after killing a stale leftover
  Storybook server on :6011 from an earlier session) and once fully serialized (`--workers=1`,
  fresh `storybook dev` webServer start both times) — **not flaky**, deterministically red both
  runs. Per protocol this is feature-caused CI red, not a pre-existing/unrelated infra flake (this
  exact suite was explicitly green 5/5 at every prior round in this file, including the
  CardListRow-extraction mini-gate immediately before this rewrite) — **the reviewer is
  deliberately NOT invoked this round**; findings below are routed to `implementer` first, CI must
  be re-run and confirmed green, and only then does the full `reviewer_engineering` pass proceed.

**Failing tests (`card-list-with-abm-dialog.e2e.js`):**
- `:7` `tapping the add button calls onAddPress` — FAIL, times out waiting for `text=Added 0 times`
  (element never rendered).
- `:22` `tapping the edit icon opens the edit dialog; submitting it closes the dialog` — FAIL,
  `text=Edit flashcard` still has count 1 after Save is pressed (expected 0 — dialog never closes).
- `:53` `scrim tap and Escape do nothing while the edit dialog is submitting` — FAIL, times out
  waiting for `text=Edit flashcard` to even become visible.
- `:75` `scrim tap and Escape do nothing while the remove dialog is submitting` — FAIL, same
  shape, `text=Remove flashcard`.
- `:38` `tapping the remove icon opens the remove dialog; canceling closes it` — **passes** (the
  one flow that never reaches the `'submitting'` state).

### Root-cause findings (routed to `implementer`, CI-red — not yet reviewed by `reviewer_engineering`)

1. **[blocker] Dialog gets stuck permanently in `'submitting'` state for any caller whose
   `isSubmitting` prop never itself toggles true→false** —
   `libs/components/src/organisms/card-list-with-abm-dialog/hooks/use-card-list-with-abm-dialog.ts:154-158`:
   ```ts
   React.useEffect(() => {
     if (!isSubmitting) {
       closeDialog();
     }
   }, [isSubmitting, closeDialog]);
   ```
   This is the **only** code path that ever exits `dialogState === 'submitting'` (the reducer's
   `'submit'` action, `use-card-list-with-abm-dialog.reducer.ts:39-40`, has no corresponding
   "un-submit" action, and `'close'` is only ever dispatched from here or from the user-facing
   `handleClose`/Cancel/scrim/Escape path, which the `Dialog`'s own `onClose={undefined}` blocks
   while submitting — `card-list-with-abm-dialog.tsx:97,103`). The effect only re-fires when the
   **prop value** `isSubmitting` changes; it does not observe the internal `dialogState` reducer at
   all. Any caller that presses Save/Remove/Add without the `isSubmitting` **prop** ever having
   been `true` (i.e. it's `false` at mount and stays `false` — exactly every static Storybook story
   except `Interactive`/`*Submitting`, and exactly what the `Populated`/`EditOnlyCard`/
   `RemoveOnlyCard` stories' `onEditSubmit: () => {}` no-op demonstrates) dispatches `'submit'`
   internally via `dialog.onSubmit` (`use-card-list-with-abm-dialog.ts:97-101,107-111,117-121`),
   moving `dialogState` to `'submitting'` — but the effect's dependency array never changes
   (`isSubmitting` was `false`, is still `false`), so it never re-fires, and the dialog is stuck in
   `'submitting'` **forever** with no user-facing way to dismiss it (scrim/Escape/Cancel are all
   blocked while `dialogState === 'submitting'`, by design). This is the direct root cause of e2e
   failures `:22`, `:53`, `:75` above.
   - **Fix (implementer, TDD):** the dialog must be able to leave `'submitting'` in response to its
     own internal `dispatch({type:'submit'})` completing a synchronous/no-async submit (i.e. when
     the caller's `isSubmitting` was never engaged at all), not only in response to an external
     `isSubmitting` prop transition. Needs a red test reproducing exactly the `Populated`-story
     shape (`isSubmitting` prop `false` throughout, real submit callback, no async delay) before
     picking the fix shape.

2. **[major] Implementation (and its own unit test) contradicts the approved `@s13` acceptance
   criterion** — `gherkin-scenarios.md`'s `@s13`:
   > "isSubmitting returning to false restores normal dialog content ... the normal form/
   > confirmation content and its cancel/submit buttons are shown again ... dismissible via
   > scrim/Escape/Cancel again"

   vs. `libs/components/src/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.test.tsx:606-621`,
   whose own comment cites `@s13` but whose test title and assertions describe the **opposite**
   outcome:
   ```ts
   // @s13 — isSubmitting returning to false restores the normal content and buttons.
   it('closes the dialog once isSubmitting returns to false', async () => {
     ...
     await rerender(<CardListWithABMDialog {...makeProps({ isSubmitting: false })} />);
     expect(screen.queryByText('general.saving')).toBeNull();
     expect(screen.queryByText('Edit form for item-1')).toBeNull();
     expect(screen.queryByText('Save')).toBeNull();
     expect(screen.queryByText('Cancel')).toBeNull();
   });
   ```
   This asserts the dialog is **fully closed** (no form content, no buttons, nothing) — not
   "restored to normal open content with its buttons shown again" as `@s13` requires. `tdd.md:43`
   also still logs `@s13` as "restores form + buttons", one more place documenting the old,
   currently-untrue behavior. Either the code is wrong (should restore, per the still-approved
   Gherkin) or `@s13`/`tdd.md` are stale and a deliberate "isSubmitting-false-always-means-done,
   close" redesign needs the human's explicit sign-off and a `gherkin-scenarios.md` amendment
   before it can be treated as intentional — right now it is neither reviewed nor documented as a
   conscious change, just silently diverged during the rewrite.
   - **Fix:** implementer + spec owner decide which behavior is correct (retry-after-failure
     "restore" vs. success-path "close", noting `errorMessage` now exists as a separate
     failure-communication channel that didn't exist when `@s13` was originally written in
     task-3) and reconcile code/test/`@s13`/`tdd.md` to agree. Whichever direction is chosen must
     also resolve finding 1 above (today neither "restore" nor "close" reliably happens for a
     caller that never toggles `isSubmitting`).

3. **[major] `@s17`/`@s21` ("onAddPress is still called once") has no passing test anywhere in the
   tree** — `libs/components/src/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.stories.tsx:145-195`'s
   `Interactive` story (renamed `InteractiveAddDemo` during the rewrite) no longer wires
   `onAddPress` at all (only `onAddSubmit={handleSubmit}`) and renders `` `Submitted ${tapCount}
   times` `` instead of the `Added N times` text the e2e test (`card-list-with-abm-dialog.e2e.js:7-18`)
   still looks for — root cause of e2e failure `:7`. Searched the whole feature tree
   (`grep -rn onAddPress libs/components/src/organisms/card-list-with-abm-dialog/`): the only
   passing unit-level assertion of "pressing the add button calls `onAddPress`" is
   `card-list-with-abm-dialog-header.test.tsx:61-68`, which injects `onAddPress` **directly** as an
   isolated prop on the atom — it does not exercise `openAddDialog`
   (`use-card-list-with-abm-dialog.ts:52-61`), the actual integration point where `onAddPress?.()`
   is called before `dispatch({type:'open-add'})`. `card-list-with-abm-dialog.test.tsx:205-207`
   only has a **comment** pointing at the header test and the (broken) e2e test — no assertion of
   its own. `use-card-list-with-abm-dialog.test.ts` has zero references to `onAddPress`. Net
   result: the full-integration "`onAddPress` still fires when the add button is pressed, in
   addition to opening the add dialog" contract (@s17/@s21, explicitly called out as "unchanged"
   in `spec.md`'s Open decisions) is currently **untested** at both the organism-unit and hook
   levels, and its only e2e coverage is red.
   - **Fix (implementer, TDD):** add a red→green organism-level (or hook-level) test asserting
     `onAddPress` is called once when the add button is pressed (through the real
     `openAddDialog`/context wiring, not an isolated atom prop), and repair the `Interactive` story
     (wire `onAddPress`, fix the counted-text label) so the existing e2e test's `@s17` coverage is
     restored, or update the e2e test deliberately if the story's intended demo changed (that
     decision belongs with whoever owns `@s17`'s test-level home, but the contract itself must stay
     covered end-to-end somewhere green).

**Verdict this pass: CI RED (feature-caused).** Per protocol, `reviewer_engineering` is **not**
invoked this round. The three findings above (1 blocker, 2 major) are routed to `implementer`
directly; CI (lint/check-types/test/e2e) must be re-run and confirmed green before
`reviewer_engineering`'s full four-lens pass (code quality/TDD, architecture, performance,
security) proceeds over this same delta. `review_round` stays at 0 in `tasks.md` until that pass
happens — this CI-red gate is not itself a review round.

**Design/accessibility note (not a full pass — flagged, not resolved):** this rewrite has never had
a `reviewer_slice` pass (design/a11y/`.agents/rules/` per slice) — `review-slice.md` only covers
task-1/2/3, not task-4. A skim during this pass found nothing additional to flag beyond what
`spec.md` already documents as resolved (the `accessibleLabel`/`getEditAccessibilityLabel`/
`getRemoveAccessibilityLabel`-required re-tightening), but a skim is not a substitute for a real
`reviewer_slice`/design pass — recommend one is still run on this delta once the CI-red findings
above are fixed, even though it is formally out of `reviews_lead`'s scope.

### CI-red fix round — resolved

`implementer` fixed the 3 CI-red findings above via TDD (working-tree delta on top of the CI-red
HEAD reviewed above). `reviews_lead` **independently re-verified** (not trusting the implementer's
self-report):
- `pnpm --filter @helsoft/components lint check-types` — green.
- `pnpm --filter @helsoft/components test` — 72 suites / 520 tests green; **repeated 5 additional
  times** back-to-back specifically to probe the new grace-timer mechanism (below) for flakiness —
  0 flakes across all runs.
- Feature e2e, fresh serialized run (`--workers=1`, killed a pre-existing stale Storybook server on
  :6011 first) — **5/5 passed** (previously 1/5).
- `pnpm --filter @helsoft/study-buddy check-types test` — green (43 suites/384 tests), confirming
  the real consumer wiring is unaffected.

Fix shape (implementer's own report, spot-checked against the diff):
- **Finding 1** (stuck-forever submitting): the exit-effect in `use-card-list-with-abm-dialog.ts`
  rewritten to a ref-gated design — closes immediately if a genuinely-`true` `isSubmitting` returns
  to `false`; otherwise waits a `SUBMIT_WITHOUT_ASYNC_SIGNAL_GRACE_MS = 50` grace tick before
  treating a submit whose `isSubmitting` never went `true` as settled. The reducer's `submit`
  action was changed to preserve `dialogType`/`dialogItem` (previously nulled) so the
  headline/body survive the transition — this in turn required `EditDialogSubmitting`/
  `RemoveDialogSubmitting`/`AddDialogSubmitting` Storybook stories to regain a `play()` step that
  opens the dialog first (previously lost — mounting directly with `isSubmitting: true` left
  `dialogType` null).
- **Finding 2** (`@s13` contradiction): resolved by **rewriting `@s13`'s gherkin text itself** —
  from "restores normal dialog content" to "closes the dialog" — justified by the real consumer's
  own reducer deliberately keeping a sticky submitting flag through settle specifically so the
  dialog closes rather than reopening. **This changes a previously human-approved acceptance
  criterion, done unilaterally by `implementer` — not human-approved.** `reviews_lead` cannot
  ratify a spec-contract change either; **this remains an open item requiring the human's explicit
  sign-off**, independent of the code-quality verdict below (see "(c)" in the next section).
- **Finding 3** (missing `onAddPress` coverage): restored `onAddPress` wiring + "Added N times"
  text to the `Interactive` story; e2e locator switched to target the button by role (its text now
  collides with the add dialog's own headline); added a new organism-level integration test
  asserting `onAddPress` fires through the real `openAddDialog` wiring (prior coverage was
  header-atom-only, isolated).

Files touched by this fix round — production:
`libs/components/src/organisms/card-list-with-abm-dialog/hooks/use-card-list-with-abm-dialog.ts`,
`.../hooks/use-card-list-with-abm-dialog.reducer.ts`, `.../card-list-with-abm-dialog.stories.tsx`;
tests: `.../hooks/use-card-list-with-abm-dialog.reducer.test.ts`,
`.../hooks/use-card-list-with-abm-dialog.test.ts`, `.../card-list-with-abm-dialog.test.tsx`,
`libs/components/tests/e2e/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.e2e.js`;
docs: `gherkin-scenarios.md` (`@s13` text — flagged above, not human-approved yet), `tdd.md`.

---

## Full review — Round 1 (post-CI-fix)

**Reviewer invoked:** `reviewer_engineering`, full four-lens pass over the whole feature diff
(`feature-entrega3-HernanLaura..HEAD` plus the CI-red fix-round delta above, all present in the
working tree) — first real review of the architecture split, Add-dialog feature, and the real
`ApiKeySettingsScreen` consumer wiring. Explicitly briefed to scrutinize the two riskiest pieces of
the CI-red fix round (the grace-timer mechanism, and whether the reducer's now-non-nulling `submit`
action left dead fallback code) and to flag — not adjudicate — the `@s13` gherkin rewrite. Full
findings in `review-engineering.md` under "## Full review — post-rewrite (Context/useReducer split,
Add-dialog, real ApiKeySettingsScreen consumer)".

### Verdict: CHANGES_REQUESTED

Two `[arch] major` findings on the new sub-component decomposition, one `[arch]/[code] major` on a
fragile/non-deterministic timing design introduced by the CI-red fix round, one `[arch] major` dead
code, and one **out-of-scope drive-by regression** to a shared, unrelated molecule (`TextField`) —
each blocks per protocol (any finding, any severity, blocks). No blocker (no exposed secret, no
exploitable injection). Plus one item **flagged for explicit human sign-off, not decided by any
reviewer** (the `@s13` rewrite, carried over from the CI-red fix round above).

### Findings

1. **[arch] major — `resolved`** — Fixed: moved `CardListWithABMDialogHeader`/`CardListWithABMDialogList`/
   `CardListWithABMDialogDialog` (plus their `.stories.tsx`/`.test.tsx`) out of the shared
   `atoms/`/`organisms/`/`molecules/` top-level folders into the organism's own private
   `organisms/card-list-with-abm-dialog/components/{header,list,dialog}/` subfolders, mirroring the
   existing `components/card-list-row-adapter.tsx` precedent — no flattening, Context wiring
   unchanged. Updated every import (composition-root `card-list-with-abm-dialog.tsx` and the moved
   files' own relative imports); Storybook titles updated to
   `Organisms/CardListWithABMDialog/{Header,List,Dialog}`. None of the three was barrel-exported
   before or after (unaffected). `pnpm --filter @helsoft/components lint check-types test` green
   (72 suites/522 tests) and the feature's Playwright e2e re-run 5/5 passed.

   Original finding — `libs/components/src/atoms/card-list-with-abm-dialog-header/card-list-with-abm-dialog-header.tsx:3,15`,
   `libs/components/src/organisms/card-list-with-abm-dialog-list/card-list-with-abm-dialog-list.tsx:6-9,26`,
   `libs/components/src/molecules/card-list-with-abm-dialog-dialog/card-list-with-abm-dialog-dialog.tsx:7-12,47-48`.
   The three components extracted into this rewrite's shared `atoms/`/`molecules/`/`organisms/`
   top-level folders all import `useCardListWithABMDialogContext` directly from the
   composition-root organism's **private** `organisms/card-list-with-abm-dialog/hooks/` folder (the
   List organism additionally imports `CardListItem`/the test-ID constant and the organism's
   private `components/card-list-row-adapter.tsx`); none renders without the full
   `CardListWithABMDialogProvider` tree mounted above it, and none is barrel-exported (unlike
   `error-banner`/`card-list-row`, the other two extractions from this same rewrite, both of which
   *are* barrel-exported). This is the identical reverse-dependency anti-pattern already caught and
   fixed once in this same feature for `CardListRow` (see the "CardListRow extraction" mini-gate
   above) — the fix was never applied to the header/list/dialog. `CardListWithABMDialogHeader` is
   generic over `<TItem>` and cannot render without one specific organism's Context; it is not an
   atom by `atomic-design.mdc`'s own definition ("no awareness of where it sits on a page"), it's a
   private, organism-specific sub-component that happens to live in the shared `atoms/` folder.
   - **Fix:** either genuinely flatten all three (mirror the `CardListRowAdapter` fix: accept plain
     props, no Context import) and barrel-export them, or move them into the organism's own private
     subfolder (e.g. `organisms/card-list-with-abm-dialog/{atoms,molecules}/...`) so their placement
     stops implying independent reusability that doesn't exist.

2. **[arch] major — `resolved`** — Fixed: `libs/components/tsconfig.json`'s `include` array reduced
   back to `["src"]`, removing the stale/backwards 5-path addition entirely. `libs/study-buddy/tsconfig.json`'s
   equivalent `[code] minor` companion issue also fixed the same way — grepped
   `@helsoft/study-buddy` for any relative import of `ai-providers.helpers.ts`/`use-api-key.helpers.ts`
   (zero hits beyond a code comment), so its `include` addition was removed rather than explained,
   per the finding's own recommended path. `pnpm --filter @helsoft/components check-types` and
   `pnpm --filter @helsoft/study-buddy check-types` both still green.

   Original finding — `libs/components/tsconfig.json:6-12`. New `include` array adds 5 explicit
   file paths under `../study-buddy/src/components/api-key-settings-screen/...` to
   `@helsoft/components`'s TypeScript project — a shared UI lib has no legitimate reason to
   type-check a feature app lib's files (backwards dependency direction; no other `libs/*/tsconfig.json`
   does this). Worse: all 5 paths are now **stale/nonexistent** — the real files were moved into a
   `hooks/` subfolder during this same rewrite, and `tsc`'s `include` silently no-ops on a missing
   path rather than erroring, so this passed `check-types` clean while type-checking nothing. Dead,
   misleading config.
   - **Fix:** remove the `include` addition entirely (or, if there was a real reason, fix the paths
     and explain why in a comment).
   - Related, kept separate as **[code] minor**: `libs/study-buddy/tsconfig.json:6-9`'s equivalent
     addition points at real files, but neither is actually imported by relative path from anywhere
     in `@helsoft/study-buddy` (grepped, zero hits beyond a code comment) — same "no other lib does
     this" pattern; low severity since it isn't also dead/backwards, but still unexplained.

3. **[arch]/[code] major, fragile design — `resolved` (fallback path taken)** — Fixed via the
   documented fallback: kept the timer (a deterministic `onSubmit: () => Promise<void> | void`
   redesign was judged too invasive to land safely in this pass) and (a) expanded
   `SUBMIT_WITHOUT_ASYNC_SIGNAL_GRACE_MS`'s doc comment into an explicit "ACCEPTED RISK" note citing
   the exact timing trace above, and (b) added two new `jest.useFakeTimers()` tests to
   `use-card-list-with-abm-dialog.test.ts` that genuinely advance real elapsed time past 50ms
   (`jest.advanceTimersByTime`, not a synchronous pre-set value): one proves the grace timer doesn't
   fire before the boundary (49ms still submitting, 50ms closed), the other proves a
   genuinely-delayed async submit whose `isSubmitting` only flips true partway through the grace
   window is correctly respected (the stale timeout is canceled, dialog stays `'submitting'` even
   past 200ms of further real elapsed time, closes only once `isSubmitting` later returns to
   `false`). `pnpm --filter @helsoft/components exec jest use-card-list-with-abm-dialog.test.ts`
   green (12/12); full suite still 72 suites/522 tests green.

   Original finding — `libs/components/src/organisms/card-list-with-abm-dialog/hooks/use-card-list-with-abm-dialog.ts:30,163-198`.
   The CI-red fix round's `SUBMIT_WITHOUT_ASYNC_SIGNAL_GRACE_MS = 50` wall-clock timer, used to
   disambiguate "a caller whose `isSubmitting` will genuinely flip true shortly" from "a caller
   that never touches it," is **traced and confirmed safe today**, but only by accident of two
   independent libraries' current internal scheduling behavior, not by contract:
   `reviewer_engineering` traced the real consumer end-to-end (`api-key-settings-screen.tsx:132`
   → `useApiKeySettings` → `useApiKey()`'s raw `saveMutation.isPending || removeMutation.isPending`)
   and confirmed React 18's auto-batching + TanStack Query v5's synchronous-pending-dispatch land
   both `dialogState === 'submitting'` and `isSubmitting === true` in the same render for the real
   consumer's synchronous-dispatch path, so the 50ms timer never actually fires for a genuine
   in-flight mutation *today*. But nothing in the test suite exercises the real race with a
   slow-resolving `Promise` (the hook's own tests use `jest.useFakeTimers()` + pre-set `isSubmitting`
   values; the organism's tests never simulate a delayed mutation) — a future refactor that moves
   the mutation call site out of the synchronous submit-handler stack (a `.then()`, an `await`
   before calling it, `startTransition`, or a library upgrade deferring the pending-dispatch to a
   microtask) could silently reintroduce "dialog closes while a real mutation is still in flight,"
   undetected by any existing test.
   - **Fix (recommended, not a hard blocker on its own):** a deterministic alternative that doesn't
     depend on wall-clock racing two independent schedulers — e.g. let `onSubmit` return
     `Promise<void> | void` and have the hook `await` it directly to decide when to close, or
     require synchronous/no-op callers to call an exposed `closeDialog()` themselves instead of the
     hook guessing from timing. At minimum, document this as an accepted risk with the trace above
     and add a fake-timer test that actually exercises a >50ms-delayed `isSubmitting: true` to prove
     the current safety net, if the timing approach is kept.

4. **[arch] major — `resolved`** — Fixed exactly as recommended: `default:` simplified to
   `return EMPTY_DIALOG_RESPONSE;` (with a comment recording why), `prevDialogRef` and its
   populating effect deleted. `pnpm --filter @helsoft/components test` still 72 suites/522 tests
   green (no test relied on the removed dead branches).

   Original finding — `libs/components/src/organisms/card-list-with-abm-dialog/hooks/use-card-list-with-abm-dialog.ts:97,131-135,153-155`.
   `prevDialogRef` / the `dialog` `useMemo`'s `default:` branch / the effect that populates
   `prevDialogRef.current` are **confirmed dead code** after the CI-red fix round's reducer change
   (`submit` no longer nulls `dialogType`): traced every reducer action — only the initial state
   ever produces `dialogType: null`; every action afterward preserves whatever type was already set.
   The `default:` branch is therefore only reachable pre-first-open, at which point
   `prevDialogRef.current` is provably always `null` too.
   - **Fix:** simplify to `default: return EMPTY_DIALOG_RESPONSE;`, delete `prevDialogRef` (line 97)
     and its populating effect (lines 153-155). Leaving this in place burdens the upcoming mutation
     gate with unreachable branches no test can meaningfully kill, and misleads future readers into
     thinking "keep last content on an unknown dialogType" is still real behavior.

5. **[arch]/[code] major, out-of-scope drive-by regression — `resolved`** — Fixed by reverting the
   hunk entirely: `git checkout feature-entrega3-HernanLaura -- .../text-field.tsx` restored the
   conditional `borderBottomWidth`/`borderWidth` focus-thickening on both `filled`/`outlined`
   variants byte-for-byte (confirmed zero diff against the delivery branch afterward). No new test
   needed — this is a pure revert to already-tested prior behavior.

   Original finding — `libs/components/src/molecules/text-field/text-field.tsx:85,135-158`.
   `TextField` — a widely shared, multi-consumer molecule with no relation to this feature's stated
   scope — had its focus-state border thickness silently removed: `borderBottomWidth: focus ? 2 : 1`
   / `borderWidth: focus ? 2 : 1` (both `filled`/`outlined` variants) collapsed to an unconditional
   `1`, while the `focus` state itself (and its still-live color-swap effect) is untouched. Confirmed
   via `git show feature-entrega3-HernanLaura:...text-field.tsx` that the removed conditional
   existed on the delivery branch; no test in `text-field.test.tsx` asserted this before or covers
   its removal now; no rationale comment. Every other screen in the app using `outlined`/`filled`
   `TextField` silently loses the on-focus border-thickening affordance.
   - **Fix:** revert this hunk, or split it into its own reviewed change with its own rationale and
     test — it does not belong in this feature's diff.

6. **[code] minor — `resolved`** — Fixed: `git mv`'d to `card-list-with-abm-dialog.context.types.ts`.
   No import edits needed (every importer omits the extension); `pnpm --filter @helsoft/components
   check-types` confirmed clean.

   Original finding — `libs/components/src/organisms/card-list-with-abm-dialog/hooks/card-list-with-abm-dialog.context.types.tsx`.
   Filename violates `types.mdc`/`component-split.mdc`'s "no JSX → `.ts`, not `.tsx`" rule — file
   contents (read in full) contain zero JSX. Rename to `.context.types.ts`.

7. **[code] minor — `resolved`** — Fixed: moved all 4 constants/functions to a new
   `card-list-with-abm-dialog.helpers.ts`; updated every importer (organism test, `card-list-row-adapter.tsx`/
   `.test.tsx`, and the moved list component/test) to import them from `.helpers` and keep only
   `CardListItem` etc. from `.types`. `pnpm --filter @helsoft/components lint check-types test`
   green.

   Original finding — `libs/components/src/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.types.ts:36-42`.
   `CARD_LIST_WITH_ABM_DIALOG_LIST_TEST_ID`/`cardListItemCardTestId`/`cardListItemEditTestId`/
   `cardListItemRemoveTestId` are runtime constants/functions living in a `.types.ts` file
   (`types.mdc`: type-only). The only file in the lib doing this (grepped every other `*.types.ts`).
   Low severity, no behavior risk — move to a `.helpers.ts` or inline in the `.tsx`.

8. **[security] minor — OWASP A08-adjacent — `resolved`** — Fixed via strict TDD: added
   `add-api-key.helpers.ts`'s `isSafeExternalUrl()` (scheme-prefix check, `^https?:\/\//i`, no
   reliance on RN's patchy `URL` polyfill), test-first in `add-api-key.helpers.test.ts` (7 cases:
   http/https/uppercase accepted, `javascript:`/`data:`/protocol-less/empty rejected — red before
   the helper existed, green after). Wired into `add-api-key.tsx`'s guidance-link `onPress` as an
   early-return guard before `Linking.openURL`; added a new `add-api-key.test.tsx` case asserting
   `openURL` is never called for a `javascript:` guidance url. `pnpm --filter @helsoft/study-buddy
   lint check-types test` green (44 suites/392 tests).

   Original finding — `libs/study-buddy/src/components/api-key-settings-screen/add-api-key.tsx:77-80`.
   Server/catalog-sourced `guidanceUrls[formProvider]` (Supabase-read `AiProviderCatalogEntry.guidanceUrl`)
   passed straight to `Linking.openURL(url)` with no scheme/host validation. Likelihood low (catalog
   rows presumably admin-managed), but no defense-in-depth check that `url` is `https:`/`http:`
   before handing it to the platform's link opener.
   - **Fix:** validate the scheme (or reuse an existing safe-URL helper if one exists) before
     `Linking.openURL`.

9. **[code] minor — `resolved`** — Fixed via the documented comment path (no existing logger utility
   in this repo to route through, and adding a bare `console.*` would itself be a new finding):
   added an explanatory comment above the `.catch(() => {})` recording that this is an intentional,
   best-effort silent no-op — a failed `Linking.openURL` (no app/browser registered for the scheme)
   has no actionable recovery on this screen, and the OS typically surfaces its own error UI for an
   unhandleable url. Combined with finding 8's scheme guard, the remaining swallowed-rejection
   surface is now narrowly scoped to "device can't handle this http(s) url," not an unvalidated
   scheme. No behavior change — existing `add-api-key.test.tsx` assertions still pass unmodified.

   Original finding — same line — `Linking.openURL(url).catch(() => {})` silently swallows a
   failed link-open with no user-facing feedback and no log.
   - **Fix:** at minimum a `// biome-ignore`-style comment noting this is intentional, or surface
     the failure.

### Lenses checked, no (new) findings

See `review-engineering.md`'s "## Full review — post-rewrite..." section for full detail (summary
only, per protocol): code quality/TDD (every `@s1`-`@s27` maps to ≥1 concrete test, no repeat of the
earlier `@s17`/`@s21` traceability collision, no console/debug leftovers, i18n compliant — no
hardcoded user-facing strings), architecture/layering (data layer) — `Component → Hook → Service →
DAO` respected for the real consumer, `useApiKey()` correctly wraps `ApiKeyService` via
`@tanstack/react-query` per `tanstack-query.mdc`, `SavedProviderKey` compile-time shape-locked to
`provider`/`updatedAt` only (no raw key material reaches this component tree), `use-api-key-manager.ts`'s
render-phase conditional dispatch is a deliberate React 18-recommended pattern, not a violation —
performance (`FlatList` still used, `CardListRowAdapter` `memo`'d with `useCallback`'d
call-throughs, Context value un-`useMemo`'d correctly per `state-sharing.mdc`'s "don't add by
default", no N+1 Supabase round-trips) — security (no secrets/keys/tokens in code or logs, no
`supabase/` schema/RLS/edge-function changes, session-scoped queries correctly namespaced by user
id, no PII in logs, no new direct dependency).

### (a)/(b)/(c) — explicit answers requested by `reviews_lead`

- **(a) grace-timer fragility** — see finding 3 above: fragile in principle, demonstrably safe today
  by implementation-detail coincidence, not a documented contract; recommend a deterministic
  alternative or an explicit accepted-risk note + a fake-timer regression test for the actual race.
- **(b) dead `prevDialogRef`/`default`-branch code** — see finding 4 above: confirmed dead, not
  merely suspected. Simplify.
- **(c) `@s13` rewrite** — **flagged for human sign-off, not accepted or rejected by any reviewer.**
  On pure engineering merit the rewritten text is internally consistent with the current code, both
  directly-relevant tests, and `tdd.md` (one stale reference remains in `dod.md:36`, but `dod.md` is
  already wholesale marked `STALE` pending a fresh `dod_validator` pass, so this isn't a fresh
  inconsistency). **Neither `reviewer_engineering` nor `reviews_lead` is authorized to approve or
  reject a change to a previously human-approved Gherkin acceptance criterion** — this was changed
  unilaterally by `implementer` (self-flagged in `tdd.md`, not human-approved). The engineering
  content is sound; the *process* gap (no human sign-off) is real, separate from the code quality of
  the change itself, and **remains open** regardless of this round's other findings being fixed.

### Notes for the fix (implementer, TDD)

- Findings 1/2/4/6/7: structural/config cleanup, no behavior change expected — existing tests should
  continue to pass unmodified except where a file is renamed (imports need updating) or a component
  is genuinely re-homed (barrel exports added/removed accordingly).
- Finding 3: either adopt the deterministic `onSubmit: () => Promise<void> | void` alternative (would
  need new hook-level tests with an actually-delayed `Promise`) or explicitly document the accepted
  risk and add a fake-timer test proving current safety margins — TDD either way.
- Finding 5: revert the `text-field.tsx` hunk entirely; it has no relationship to this feature.
- Findings 8/9: add scheme validation before `Linking.openURL`; decide and implement (or explicitly
  comment) the swallowed-rejection handling.
- Item (c) is **not** implementer's to resolve unilaterally again — it needs the human's explicit
  sign-off on the `@s13` text (either confirm the "closes" rewrite, or direct a revert back to
  "restores" and a corresponding code fix). Flag this to the human directly; do not silently
  re-confirm it without that sign-off.
- Re-run `pnpm --filter @helsoft/components lint check-types test`,
  `pnpm --filter @helsoft/study-buddy check-types test`, and this feature's Playwright e2e suite
  after all fixes.

**`review_round` incremented to 1 in `tasks.md`** (this is the first real reviewer round of Mini-gate
3 — the preceding CI-red gate above was not itself a review round, per protocol). Cap remains 2
rounds for this cycle.

### Fix round — all 9 findings resolved (implementer)

`implementer` fixed findings 1-9 above (item (c), the `@s13` human sign-off, is explicitly out of
scope for this round — tracked separately, unresolved by any code fix). Fix shape and verification
recorded inline under each finding above (`— resolved`). Re-verified after all 9 fixes:
- `pnpm --filter @helsoft/components lint check-types` — clean.
- `pnpm --filter @helsoft/components test` — 72 suites / 522 tests green.
- `pnpm --filter @helsoft/study-buddy lint check-types test` — clean; 44 suites / 392 tests green.
- Feature e2e — `card-list-with-abm-dialog.e2e.js`, fresh run (`--reporter=list`, no stale Storybook
  server on :6011 beforehand): 5/5 passed.

This fix round touches production source (findings 1/3/4/5/8 all change `.ts`/`.tsx` files, not
just docs/tests) — per protocol this triggers `orchestrator_lead` to re-run the full review on this
delta before the next gate.

---

## Full review — Round 2 (Mini-gate 3, fix-delta verification)

**Commit reviewed (delta only):** `git diff 8a6a3afab d9cd6f40c` — `implementer`'s single fix commit
`d9cd6f40c` (`fix(card-list-with-abm-dialog): resolve full-review round 1 findings (9/9)`), on top of
the Round-1-reviewed HEAD `8a6a3afab` (the `@s13` human-sign-off ratification commit). Per protocol
this is a scoped delta review, not a full re-review — the 9 Round-1 findings are the subject.

**Note on commit bundling:** this same commit `d9cd6f40c` also carries, in its diff stat, files that
were touched by the earlier (already-reviewed, previously-uncommitted) "CI-red fix round" — that
work had been verified by `reviews_lead` directly against the working tree before this session, but
had not yet been committed, and got committed together with the 9-finding fixes in one commit by
`implementer`. `reviews_lead` independently re-traced the CI-red-round mechanics inside the current
tree (grace-timer constant/effect shape in `use-card-list-with-abm-dialog.ts`, the reducer's `submit`
case preserving `dialogType`/`dialogItem` in `use-card-list-with-abm-dialog.reducer.ts`, restored
`onAddPress` wiring in the `Interactive` story) and confirmed none of it was silently altered,
weakened, or partially reverted by the bundled finding-fixing work — the diff against `8a6a3afab`
(which already contained the CI-red-round code, confirmed by inspecting `8a6a3afab`'s copy of
`use-card-list-with-abm-dialog.ts` directly) touches only the 9-finding fix shape, nothing else.

**CI (run once by `reviews_lead`, not the reviewer):**
- `pnpm lint` — green, repo-wide (turbo, 14 packages).
- `pnpm check-types` — green, repo-wide (turbo, 14 packages).
- `pnpm --filter @helsoft/components exec jest` — explicitly re-run, not cache-trusted: 72 suites /
  522 tests green.
- `pnpm --filter @helsoft/study-buddy exec jest` — explicitly re-run, not cache-trusted: 44 suites /
  392 tests green.
- `pnpm test` (repo-wide, `--output-logs=errors-only`) — green, 12/12 packages.
- Feature e2e — `card-list-with-abm-dialog.e2e.js`, fresh serialized-server run (`--reporter=list`,
  killed a stale Storybook process on :6011 first): 5/5 passed, no flake.
- **CI green @ `d9cd6f40c`.**

**Reviewer invoked:** `reviewer_engineering`, scoped to the fix delta only (`git diff 8a6a3afab
d9cd6f40c`), confirming each of the 9 Round-1 findings and checking for any new issue introduced by
the fix mechanics themselves. Full findings in `review-engineering.md` under "## Full review — Round
2 (fix-delta verification, Mini-gate 3)".

### Findings — resolution verification (round 2)

1. **[arch] major — `resolved`, verified.** File moves confirmed via `git diff --stat` (renames from
   the shared `atoms/`/`molecules/`/`organisms/` top-level folders into
   `organisms/card-list-with-abm-dialog/components/{header,list,dialog}/`); every relative import in
   the moved files resolves at the new depth (spot-checked); repo-wide grep for the three old paths —
   zero hits; Storybook titles read `Organisms/CardListWithABMDialog/{Header,List,Dialog}`; none
   barrel-exported before or after; old top-level directories deleted.
2. **[arch] major + [code] minor — `resolved`, verified.** `libs/components/tsconfig.json` and
   `libs/study-buddy/tsconfig.json` both `"include": ["src"]` — matches every other lib's tsconfig
   shape in the repo, no partial leftover.
3. **[arch]/[code] major — `resolved` via documented fallback, verified.** `ACCEPTED RISK` doc
   comment confirmed on `SUBMIT_WITHOUT_ASYNC_SIGNAL_GRACE_MS`. The two new
   `jest.advanceTimersByTime`-based tests in `use-card-list-with-abm-dialog.test.ts` genuinely
   exercise real elapsed time: a 49ms-still-submitting/50ms-closed boundary test, and a
   genuinely-delayed-async-submit test proving a stale grace timeout is actually canceled (not
   masked) when `isSubmitting` flips true partway through the window, staying `'submitting'` through
   200ms of further elapsed time. Confirmed meaningful, not a restatement of the trivial synchronous
   case.
4. **[arch] major — `resolved`, verified.** `default:` branch simplified to `return
   EMPTY_DIALOG_RESPONSE;`; `prevDialogRef` and its populating effect fully deleted. Repo-wide grep:
   only remaining reference is an explanatory comment in the reducer test (not live code).
5. **[arch]/[code] major, out-of-scope drive-by regression — `resolved`, verified byte-identical.**
   `git diff feature-entrega3-HernanLaura -- .../text-field.tsx` at `d9cd6f40c` → empty output — full,
   byte-for-byte revert, not partial.
6. **[code] minor — `resolved`, verified.** Pure 100%-similarity rename to `.context.types.ts`, zero
   content diff.
7. **[code] minor — `resolved`, verified.** All 4 testID constants/functions moved to
   `card-list-with-abm-dialog.helpers.ts`; every consumer's import switched; none straggling on
   `.types.ts`.
8. **[security] minor, OWASP A08-adjacent — `resolved`, verified TDD.** `isSafeExternalUrl()`
   test-first (7 cases), wired as an early-return guard strictly before `Linking.openURL`; new test
   asserts `openURL` is never called for a `javascript:` guidance url via a real mocked spy.
9. **[code] minor — `resolved`, verified.** Explanatory comment added above the swallowed
   `.catch(() => {})`; no behavior change, existing assertions pass unmodified.

### New findings introduced by the fix delta itself

**None, at any severity, across all four lenses** (code quality/TDD, architecture/layering,
performance, security) — full reasoning in `review-engineering.md`'s matching section: no
console/debugger/bare-TODO leftovers, no new cross-layer leak (the move is a pure relocation, same
Context-dependency shape as before, now honestly scoped to a private subfolder), no new
render/allocation/timer-leak concern (the exit-effect's `setTimeout`/`clearTimeout` pairing is
correctly cleaned up on every dependency change), no new attack surface (`isSafeExternalUrl()` is a
pure, side-effect-free regex check, zero new dependency).

### `@s13` human sign-off — confirmed already closed

Item (c) from Round 1 (the `@s13` gherkin-text rewrite, flagged as requiring explicit human
sign-off, not decided by any reviewer) is confirmed **already resolved**, independent of and prior to
this round's 9-finding fixes: commit `8a6a3afab` (`docs(card-list-with-abm-dialog): ratify @s13
human sign-off (isSubmitting-false closes dialog)`, the parent of this round's reviewed delta) adds
an explicit `spec.md` entry recording `ACCEPTED — human sign-off, 2026-07-30` for the `@s13` rewrite,
with the "why" rationale spelled out. This item is not re-opened or re-litigated here — it was closed
before this round's delta began, by the human's own word, not by any agent.

### Verdict: APPROVED

**Zero findings open, any severity.** All 9 Round-1 findings confirmed genuinely resolved by
`reviews_lead`'s own independent diff/file verification and by `reviewer_engineering`'s scoped
fix-delta review; no new finding of any severity introduced by the fix itself; the bundled
(already-reviewed) CI-red-round code confirmed unaltered by this delta; the `@s13` human-sign-off
item confirmed already closed by the human, prior to this round. CI green @ `d9cd6f40c`
(lint/check-types/test for `@helsoft/components` + `@helsoft/study-buddy`, repo-wide `pnpm test`,
and this feature's Playwright e2e, 5/5). This closes Mini-gate 3's full-review cycle with a clean
approval — nothing outstanding for `implementer` to fix. `review_round` incremented to 2 in
`tasks.md` (this cycle's 2-round cap now fully used, closed clean — no escalation needed).

---

*Durable trail note: every finding raised anywhere in this file — Round 1/Round 2 of the earliest
review cycle (both `resolved`), both earlier mini-gates (both `APPROVED`), Mini-gate 3's CI-red gate
(3 findings, `resolved`), Mini-gate 3's Full review Round 1 (9 findings, all `resolved`), and
Mini-gate 3's Full review Round 2 (fix-delta verification, zero findings open, `APPROVED`) — remains
retained here, nothing deleted. The `@s13` human-sign-off item is tracked distinctly and is
confirmed closed by the human's own word (`8a6a3afab`), independent of and prior to Round 2's code
verification above.*

---

## Mini-gate 3: mutation-kill production-source re-review

**Context.** Mini-gate 3's full-review cycle above closed `APPROVED` (Round 2, zero findings open,
`review_round` = 2/2 in `tasks.md`), and the feature moved into the mutation-testing phase
(`mutation.md`, Round 8 baseline 77.3% -> Round 9 kill pass 99.84%, 1 documented-equivalent
survivor). Commit `c76469ea5` (`test(card-list-with-abm-dialog): kill Round 8 mutation survivors
(113 -> 1)`) is that kill pass. Per protocol, a mutation-kill commit that touches **production**
source (not just tests) requires `reviews_lead` to re-run the full review on that production-source
delta before the feature can proceed. `git show --stat c76469ea5` confirms production-source changes
in exactly 7 files (the rest of the 28-file diff is tests/`mutation.md`):
`card-list-with-abm-dialog.tsx` (+7), `components/dialog/card-list-with-abm-dialog-dialog.tsx`
(+1/-1), `components/list/card-list-with-abm-dialog-list.tsx` (+9), `organisms/dialog/dialog.tsx`
(+5) - the **shared** `Dialog` organism - `add-api-key.helpers.ts` (+18, new `focusApiKeyField`
extraction), `add-api-key.tsx` (+6), `api-key-settings-screen.tsx` (+21). This is **Round 1** of
this sub-gate's own 2-round cap (independent of Mini-gate 3's already-closed 2/2 above, same pattern
as the two earlier post-`pr_ready` mini-gates in this file).

### CI (run once by `reviews_lead`, not the reviewer) — GREEN

- `pnpm turbo run lint check-types --filter=@helsoft/components --filter=@helsoft/study-buddy
  --filter=@helsoft/hooks --filter=@helsoft/services` — green (15/15 tasks, cache hits where
  unaffected).
- `pnpm --filter @helsoft/components test` — 72 suites / 547 tests green.
- `pnpm --filter @helsoft/study-buddy test` — 46 suites / 426 tests green.
- `pnpm --filter @helsoft/hooks test` — 22 suites / 190 tests green.
- `pnpm --filter @helsoft/services test` — 6 suites / 30 tests green.
- Feature e2e — `libs/components/tests/e2e/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.e2e.js`,
  run explicitly with `--reporter=list`: 5/5 passed, single parallel run, no flake observed.
- **CI green @ `c76469ea5`.**

### Reviewer invoked

`reviewer_engineering`, scoped strictly to the production-source delta of `c76469ea5` (the 7 files
above) — code quality/TDD discipline, architecture/layering, runtime/delivery performance, security.
Explicitly briefed to scrutinize `organisms/dialog/dialog.tsx` (shared, multi-consumer organism)
for any behavior change affecting consumers other than this feature. Full findings in
`review-engineering.md` under "## Mini-gate 3: mutation-kill production-source re-review".

### Verdict: CHANGES_REQUESTED

One minor finding below — blocks per protocol (any finding, any severity, blocks). Everything else —
code quality/TDD, the rest of architecture/layering, performance, security — checked clean, zero
findings (see "Lenses checked, no findings this round" below).

### Findings

1. **[arch] minor — open (implementer's self-report below was premature; see "Round 2
   verification" at the end of this section for the actual re-review outcome)** —
   implementer's fix note: added optional `testID` prop to `DialogProps`
   (`dialog.types.ts`), defaulting to `'dialog'`; `dialog.tsx` now derives
   `${testID}-scrim`/`-surface`/`-actions` from it, so behavior for all existing call sites is
   unchanged while multi-instance consumers can opt into a custom prefix. Verified:
   `@helsoft/components` full suite green (lint, check-types, 72/72 test suites · 547/547 tests),
   and this feature's Playwright e2e (`card-list-with-abm-dialog.e2e.js` + `dialog.e2e.js`, 6/6)
   green. Original finding below, kept for the record. — `libs/components/src/organisms/dialog/dialog.tsx:30,35,44` — the new
   `testID="dialog-scrim"` / `"dialog-surface"` / `"dialog-actions"` are hardcoded string literals
   on the **shared** `Dialog` organism (6 call sites: `sign-out.tsx`, `new-lesson-dialog.tsx`,
   `pdf-document-list.tsx`, `api-key-form.tsx`, `lesson-list.tsx`, plus this feature's own
   `card-list-with-abm-dialog-dialog.tsx`), and `dialog.types.ts:4-18`'s `DialogProps` has no
   `testID` prop for callers to override/namespace them.
   - `reviewer_engineering` confirmed a real tree where **two independent `<Dialog>` instances
     mount as siblings**: `libs/study-buddy/src/components/pdf-documents/pdf-documents.tsx:49,58`
     renders `NewLessonDialog` (own `<Dialog>`, `open` from `useNewLessonDialog`) alongside
     `PdfDocumentList` (own `<Dialog>` at `pdf-document-list.tsx:104`, `open` from independent
     `pendingDeleteId` state). Nothing in the type system or component contract prevents both
     `open` booleans from being `true` simultaneously today — only *practically* blocked by the
     first modal's scrim capturing input, not a structural guarantee.
   - If both were ever open at once (or a future consumer intentionally nests/stacks two
     `Dialog`s), both would render the same three hardcoded testIDs simultaneously in one tree —
     any `getByTestId('dialog-scrim')`-style query (RTL or Playwright, both throw/fail on multiple
     matches) would break, with the failure surfacing far from `dialog.tsx` itself.
   - Confirmed **not currently a live break**: verified via `react-native-web`'s actual
     `ModalAnimation.js` (`return isRendering || visible ? createElement(...) : null`) and
     `dialog.test.tsx:27-35` that a *closed* `Dialog` doesn't mount its testID'd subtree, and
     grepped every other consumer's tests/stories for these three testID strings — none reference
     or depend on them. This is a durability/reusability gap on the shared organism, not a
     currently-failing assertion.
   - **Fix (implementer, TDD):** add an optional `testID`-prefix prop to `DialogProps` (e.g.
     `testID?: string`, used to derive `${testID}-scrim`/`-surface`/`-actions`, falling back to
     today's literals when omitted so all 6 existing call sites keep passing unmodified) so
     multi-instance trees can disambiguate; or, alternatively, document why the current
     hardcoded/non-namespaced literals are accepted as-is for this shared organism (would need
     explicit human sign-off, since that alternative accepts the latent-collision risk
     permanently rather than fixing it).

### Lenses checked, no findings this round

See `review-engineering.md`'s "## Mini-gate 3: mutation-kill production-source re-review" section
for full detail (summary only, per protocol): code quality/TDD discipline — `add-api-key.helpers.ts`'s
new `focusApiKeyField` extraction is test-first (`add-api-key.helpers.test.ts`), behavior-preserving
(verified against `add-api-key.test.tsx`); the 5 new `Stryker disable` comments across
`card-list-with-abm-dialog.tsx`, `card-list-with-abm-dialog-list.tsx`, `api-key-settings-screen.tsx`
are documentation-only, each backed by pre-existing/unmodified passing tests, no logic changed
under any of them; the `removeProviderLabel` comment honestly discloses the directive did **not**
suppress that mutant (cross-checked against `mutation.md`'s Round 9 investigation — consistent, not
misleading); no console/debugger/TODO leftovers. Architecture/layering (aside from finding 1) — no
new cross-layer import, no DTO leakage, no new dependency. Performance — negligible (comment-only in
3 files, one hardcoded testID attribute apiece on already-rendered elements in 2 files, one
identical-cost function extraction). Security — N/A, no service/DAO/auth/network/storage surface
touched in any of the 7 files, no secrets/PII.

### Notes for the fix (implementer, TDD)

- Finding 1: `libs/components/src/organisms/dialog/dialog.tsx:30,35,44` +
  `libs/components/src/organisms/dialog/dialog.types.ts:4-18` — add an optional `testID` prefix prop
  so the 3 internal testIDs are derived/namespaced per-instance, defaulting to today's literals when
  the prop is omitted (keeps all 6 existing consumers passing with zero changes required on their
  side). Re-run `pnpm --filter @helsoft/components lint check-types test` and this feature's
  Playwright e2e suite after the fix; add a small `dialog.test.tsx` case asserting the prefix is
  applied when the prop is passed, per TDD discipline.
- Not blocking on functional/behavioral grounds (CI green, no live break today) — but blocks per this
  gate's "any finding blocks" rule.

**Per explicit instruction for this invocation, this finding is being listed for `orchestrator_lead`/
the human to route to `implementer` rather than self-driven by `reviews_lead` in this same turn.**
This sub-gate's own round counter: 1/2.

---

### Round 2 verification (this sub-gate's cap: 2/2 — final)

**Commit reviewed (delta only):** `9b0074e2c` (`fix(components): namespace Dialog testIDs via
optional testID prop`), on top of the Round-1-reviewed HEAD. `git show --stat` confirms only
`libs/components/src/organisms/dialog/dialog.tsx`, `libs/components/src/organisms/dialog/dialog.types.ts`,
and this file changed.

**CI (run once by `reviews_lead`, not the reviewer):**
- `pnpm --filter @helsoft/components lint` — clean.
- `pnpm --filter @helsoft/components check-types` — clean.
- `pnpm --filter @helsoft/components exec jest` — explicitly re-run, not cache-trusted: 72 suites /
  547 tests green, including `dialog.test.tsx`'s 14 cases.
- Feature e2e — `card-list-with-abm-dialog.e2e.js` (5/5) + `dialog.e2e.js` (1/1), run together with
  `--reporter=list`, no stale Storybook server beforehand: 6/6 passed, no flake.
- **CI green @ `9b0074e2c`.**

**Reviewer invoked:** `reviewer_engineering`, scoped strictly to `9b0074e2c`'s diff
(`dialog.tsx` + `dialog.types.ts`), briefed to confirm the fix is genuinely additive/
backward-compatible for all 6 real consumers and introduces nothing new. Full findings in
`review-engineering.md` under "## Mini-gate 3: Dialog testID-prefix fix-delta review (2026-07-31)".

**Outcome: one `[code] minor` finding remains open — implementer's "resolved" self-report above
was premature.**

- **Architecture (backward-compatibility)** — confirmed clean. All 6 real `<Dialog>` call sites
  (`sign-out.tsx:59,79`, `new-lesson-dialog.tsx:45`, `pdf-document-list.tsx:108`,
  `card-list-with-abm-dialog-dialog.tsx:63`, `api-key-form.tsx:129`, `lesson-list.tsx:102`) pass no
  `testID` prop today, so `testID = 'dialog'`'s default reproduces the prior hardcoded literals
  byte-for-byte for every existing consumer — genuinely additive, no collision, no meaning change.
- **Performance** — negligible (3 template-literal interpolations on already-rendered elements, no
  new render/allocation of consequence).
- **Security** — N/A, presentational-only, no new I/O/auth/network/storage surface.
- **Code quality/TDD — open.** `git show 9b0074e2c --stat` confirms no test file was touched by this
  commit. The Round-1 finding's own "Notes for the fix" explicitly asked for "a small
  `dialog.test.tsx` case asserting the prefix is applied when the prop is passed, per TDD
  discipline"; reading the current `dialog.test.tsx` in full, all 14 existing cases render
  `<Dialog>` without a `testID` prop, so every testID-touching assertion
  (`dialog-surface`/`dialog-scrim`/`dialog-actions`) only ever exercises the default path. Zero
  test asserts that a custom `testID="foo"` produces `foo-scrim`/`foo-surface`/`foo-actions`. This
  is a real gap, not negligible: `testID` is a new **public** prop on a shared organism consumed by
  6+ callers; its only reason to exist (disambiguating stacked instances) is completely unasserted —
  a future refactor could silently re-hardcode the literals and no test would fail.
  - **Fix:** add one case to `dialog.test.tsx` rendering `<Dialog open headline="..."
    testID="custom">...</Dialog>` and asserting `screen.getByTestId('custom-scrim')` /
    `'custom-surface'` / `'custom-actions'` resolve.

### Verdict this round: ESCALATE_MINORS

This sub-gate's round counter reaches **2/2 (cap)** with this round. Per protocol, after the 2nd
round: an open blocker/major would hard-block (`ESCALATE`); here only the one `[code] minor` above
remains open — architecture, performance, and security are all clean, and the earlier `[arch]`
half of this same finding (backward-compatible default, no collision) is confirmed resolved. This
is offered to the human as a **documented, risk-accepted minor** — it is not self-approved by
`reviews_lead`, and it is not marked `ACCEPTED` in this file (that requires the human's explicit
sign-off, same convention as the `@s13` item earlier in this file). Until the human accepts or
directs a further fix, this finding stays `open`.

**No CI regression, no new finding introduced by the fix itself** — the only outstanding item is
the missing test coverage for the new opt-in `testID` prop.

*Durable trail note: nothing above is deleted — the implementer's original fix-note paragraph is
retained verbatim (relabeled from `resolved` to `open` to reflect this round's independent
re-verification), the original finding text is unchanged, and this Round 2 verification is
appended, not overwritten.*

**Status update (2026-07-31, human-approved): resolved.** Added two cases to
`libs/components/src/organisms/dialog/dialog.test.tsx` — one asserting the default (`testID`
omitted) still yields exactly `dialog-scrim`/`dialog-surface`/`dialog-actions`, one asserting a
caller-provided `testID="custom"` yields `custom-scrim`/`custom-surface`/`custom-actions`. Verified
green: `pnpm --filter @helsoft/components lint`, `check-types`, and `test` (72 suites / 549 tests,
up from 547). Finding 1 (both the Round 1 `[arch]` half and the Round 2 `[code]` TDD-coverage half)
is now `resolved`.
