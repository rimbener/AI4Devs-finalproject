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

1. **[perf] minor — `resolved`** — Fixed: `CardListRow` now wrapped in `memo` (generic-preserving cast,
   `as <TItem>(props: CardListRowProps<TItem>) => ReactNode`), and its `onEditPress`/`onRemovePress`
   call-throughs wrapped in `useCallback(() => onEditPress(item), [onEditPress, item])` /
   `useCallback(() => onRemovePress(item), [onRemovePress, item])`, mirroring
   `pdf-document-list.tsx`'s `PdfDocumentListRow`. `pnpm --filter @helsoft/components lint
   check-types test` green (70 suites/515 tests) and the feature's Playwright e2e re-run 5/5
   passed; no test changes needed (non-functional fix, existing `.test.tsx`/`.e2e.js` assertions
   still pass unmodified).

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

2. **[code] minor — `resolved`** — Fixed: extracted the shared `isSubmitting`-swap shape into two
   local helpers in `card-list-with-abm-dialog.tsx` — `dialogInteractionProps` (the
   `onClose`/`actions` swap, spread into both `Dialog`s) and `renderDialogBody(type, render)` (the
   body ternary, called by both `Dialog`s with `'edit'`/`renderEditForm` and
   `'remove'`/`renderRemoveConfirmation`). Both `Dialog` blocks now share one code path for the
   duplicated shape. `pnpm --filter @helsoft/components lint check-types test` green and the
   feature's e2e re-run 5/5 passed; no test changes needed (non-functional fix).

   Original finding — Duplicated `isSubmitting`-swap wiring across the two `Dialog`
   instances (`card-list-with-abm-dialog.tsx:121-154`). Both blocks repeat the identical shape:
   `onClose={isSubmitting ? undefined : closeDialog}`, `actions={isSubmitting ? EMPTY_DIALOG_ACTIONS : undefined}`,
   and a body ternary (`isSubmitting ? <SubmittingIndicator /> : render*(dialogState.item)`)
   gated on `dialogState?.type === 'edit'|'remove'`. Not a DRY blocker at this size (two call
   sites, each dialog genuinely has distinct data/labels), but the ~15 lines of repeated
   conditional structure could be extracted into a small local helper to remove the duplication
   outright.
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

*Round 2, if needed, will be appended below — this section is never overwritten.*
