# Full engineering review — card-list-with-abm-dialog

> ⚠ **STALE relative to current code.** See the same notice in `review.md` — a substantial
> architecture rewrite and new Add-dialog feature landed after everything below was written and
> has not been reviewed. See `spec.md`'s "Issues found by this doc pass" and `task-4.md`.

Durable trail (`reviews_lead` → `reviewer_engineering`). Never emptied; updated per round.
Scope: sole reviewer of the full review — code quality/TDD, architecture/layering, performance,
security only. Design + accessibility already fully covered per slice in `review-slice.md` and are
explicitly out of scope this round (not re-litigated).

**Commit range reviewed:** `feature-entrega3-HernanLaura..HEAD` (`b66c101ef..61087aa22`, branch
`feat/card-list-with-abm-dialog`), all 3 vertical slices combined.
**CI:** green @ `61087aa22` (`pnpm lint`/`check-types`/`test` repo-wide + this feature's Playwright
e2e suite run explicitly, 5/5 passed, no flake) — taken as given per protocol, not re-run.

## Round 1

### Verdict: APPROVED

No blocker or major findings. Two minor findings below (non-blocking); everything else checked
clean.

### Findings

1. **[perf] minor** — `CardListRow` (`libs/components/src/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.tsx:167-206`) is not wrapped in `memo`, unlike the closest precedent row in this lib, `PdfDocumentListRow` (`libs/components/src/organisms/pdf-document-list/pdf-document-list.tsx:164-187`), which is explicitly memoized with an inline comment citing a prior full-review perf finding ("keeps per-cell handlers stable across parent `FlatList` re-renders (full-review minor [perf])"). Additionally the per-item press handlers `onPress={() => onEditPress(item)}` / `onPress={() => onRemovePress(item)}` (`card-list-with-abm-dialog.tsx:189`, `:199`) are recreated on every render of `CardListRow` with no `useCallback`, whereas the precedent wraps its equivalent handlers in `useCallback(..., [onRequestDelete, item.id])`. `CardListWithABMDialog` re-renders on every `dialogState`/`isSubmitting` change (dialog open/close, submit toggle), so if `FlatList` ever re-invokes `renderItem` on those parent re-renders, every visible row recreates its `IconButton` handler references — for a list of N items this is O(N) unneeded work where the lib's own established convention (same organism family, same `FlatList`-of-`Card`-rows shape) already demonstrates O(1) is achievable. Not a blocker — functional correctness is unaffected, and `FlatList`'s own prop-stability (stable `data`/`renderItem`/`keyExtractor`/style refs here, matching the precedent) may already limit actual reconciliation reach — but it is a real regression against a lesson this same lib already learned and encoded in its closest analog. Suggested fix: wrap `CardListRow` in `memo`, and wrap its `onEditPress`/`onRemovePress` call-throughs in `useCallback(() => onEditPress(item), [onEditPress, item])` (mirroring `pdf-document-list.tsx`).

2. **[code] minor** — Duplicated `isSubmitting`-swap wiring across the two `Dialog` instances (`card-list-with-abm-dialog.tsx:121-154`). Both blocks repeat the identical shape: `onClose={isSubmitting ? undefined : closeDialog}`, `actions={isSubmitting ? EMPTY_DIALOG_ACTIONS : undefined}`, and a body ternary (`isSubmitting ? <SubmittingIndicator /> : render*(dialogState.item)`) gated on `dialogState?.type === 'edit'|'remove'`. Not a DRY blocker at this size (two call sites, each dialog genuinely has distinct data/labels), but the ~15 lines of repeated conditional structure could be extracted into a small local helper (e.g. a `renderDialogBody(type, renderContent)` closure) to remove the duplication outright. Non-blocking.

### Lenses checked, no findings

- **Code quality/TDD** — every `@s1`–`@s18` in `gherkin-scenarios.md` maps to ≥1 concrete test per `tdd.md`'s `@s → test` tables (slices 1–3) and confirmed directly in `card-list-with-abm-dialog.test.tsx`/`.e2e.js`/`.stories.tsx` (verified `@s18`'s 10-story matrix by reading `.stories.tsx` in full: Populated, EmptyWithMessage, EmptyWithoutMessage, DisabledCard, EditOnlyCard, RemoveOnlyCard, EditDialogOpen, RemoveDialogOpen, EditDialogSubmitting, RemoveDialogSubmitting, + Interactive). TDD-by-file-type respected: the one non-UI `.ts` (`use-card-list-with-abm-dialog.ts`) has a logged Red→Green cycle in `tdd.md` (4 cycles: starts-null → openEditDialog → openRemoveDialog → closeDialog) and its production code (`dialogState`, `openEditDialog`/`openRemoveDialog`/`closeDialog`) is not inflated beyond what `use-card-list-with-abm-dialog.test.ts` demands — no untested exports. UI `.tsx` files (implementation-first, per `tdd.mdc`) each have their `.test.tsx`, `.stories.tsx`, and an interaction `.e2e.js` (5 tests, all genuine interactions per `e2e.mdc` — no render-only presence checks). No `console.log`/debug leftovers (`grep` clean), no bare TODOs. Functional React only, `Props` types present (`CardListListItem`/`CardListWithABMDialogProps<TItem>`, private `CardListRowProps<TItem>` correctly kept un-exported next to its sole use site per `types.mdc`'s "keep it next to the implementation" carve-out for non-public types), kebab-case filenames throughout. i18n: no hardcoded user-facing strings, no `labels`/pre-resolved-`t()` collection — all chrome is caller-supplied props per spec.md's explicit human-approved domain-agnostic-organism decision (not re-litigated).
- **Architecture/layering** — `Component → Hook` respected (`.tsx` imports only `use-card-list-with-abm-dialog`, atoms/molecules/`Dialog`, theme — no DAO/service import anywhere in the diff). `use-card-list-with-abm-dialog.ts` is correctly a UI-local interaction-state hook (discriminated-union `dialogState`), not a data-layer hook wrapping a service — consistent with `use-pdf-document-list.ts`'s precedent and `hooks-service-dao.mdc`'s scope (N/A for pure UI-local state). `CardListDialogState<TItem>` (hook-private) and `CardListRowProps<TItem>` (component-private) both correctly unexported per `types.mdc`; `CardListItem<TItem>`/`CardListWithABMDialogProps<TItem>` (the actual public contract) live in `.types.ts` only. One `useState` (not `useReducer`) — correct per `state.mdc`, matches spec.md's documented rationale (not ≥3 independently-changing fields). No cross-subtree prop-drilling — `state-sharing.mdc` N/A (state stays one hop: hook → component → `CardListRow`). No DTOs leaked (no DAO in this diff). Generic `CardListItem<TItem>`/`CardListWithABMDialogProps<TItem>`/component signatures (`<TItem,>`) are type-sound — verified `CardListWithABMDialog`/`CardListRow` both use the correct `<TItem,>` trailing-comma generic-arrow-function `.tsx` syntax. Barrel (`libs/components/src/organisms/index.ts:11-12`) updated, alphabetically placed. No new dependencies. Atom-ban respected — no diff under `atoms/`, `molecules/submitting-indicator/`, or `organisms/dialog/`; per-icon testIDs solved via local wrapper `View`s instead of adding a `testID` prop to the shared `IconButton` atom.
- **Performance** — `FlatList` used (not `.map()`), matching `PdfDocumentList`'s precedent (explicit human decision, not re-litigated); `keyExtractor`/`renderItem` both `useCallback`-stabilized with correct, minimal dependency arrays (`[]` and `[openEditDialog, openRemoveDialog, getEditAccessibilityLabel, getRemoveAccessibilityLabel]` respectively) — same discipline as the precedent. `EMPTY_DIALOG_ACTIONS` is a module-level constant (referentially stable, no per-render allocation). No unbounded/N+1 network calls (no network layer in this diff). No unvirtualized large lists. One row-memoization gap noted above (minor, non-blocking).
- **Security** — **N/A.** The full diff (`.tsx`, `.types.ts`, `.stories.tsx`, `.test.tsx`, hook + hook test, barrel, `.e2e.js`) is a pure presentational UI organism in `@helsoft/components`: no service/DAO/auth/network/storage/Supabase surface touched, no secrets/env reads, no logging, no user input parsing beyond caller-supplied `ReactNode`/callback props (validated, if at all, by the caller — this organism has no service layer of its own to validate at). No PII sinks (no analytics/logging code paths added). Confirmed via `grep` for `console.`/network/storage APIs in the diff — none found. OWASP Top 10 / MASVS controls have no applicable surface here.

### Notes for the fix (optional, non-blocking)

- Finding 1: wrap `CardListRow` in `memo` + `useCallback` its `onEditPress`/`onRemovePress` call-throughs, mirroring `pdf-document-list.tsx:164-187`.
- Finding 2: optionally extract the duplicated `isSubmitting`-swap ternary shared by both `Dialog` blocks into one local helper.

## Round 2 — fix-delta verification

**Scope:** delta-only review of `implementer`'s fix commit `174d6b455` on top of the round-1
reviewed HEAD `61087aa22` — `git diff 61087aa22 174d6b455 -- .../card-list-with-abm-dialog.tsx`
plus `git show 174d6b455` in full. Round-1 findings' original severity/reasoning not re-litigated —
only whether each is now resolved, and whether the resolution itself introduces anything new.

**CI:** green @ `174d6b455` (`pnpm lint`/`check-types`/`test` repo-wide + this feature's Playwright
e2e suite re-run explicitly, 5/5 passed, no flake) — handed down as given, not re-run by this
reviewer.

**`git show --stat 174d6b455`:** three files changed — `card-list-with-abm-dialog.tsx` (production
code), `review-engineering.md` and `review.md` (both newly added, doc-only). No other production
file touched. Confirms scope claim.

### Finding 1 [perf] — CONFIRMED RESOLVED

`CardListRow` (now `card-list-with-abm-dialog.tsx:172-216`) is `memo(function CardListRow<TItem>(...) {...}) as <TItem>(props: CardListRowProps<TItem>) => ReactNode`. Inside, `handleEditPress`/`handleRemovePress` are `useCallback(() => onEditPress(item), [onEditPress, item])` / `useCallback(() => onRemovePress(item), [onRemovePress, item])` — deps correct (both closed-over values are actually used, nothing extraneous, nothing missing). `IconButton.onPress` now points at the memoized handlers, not inline arrows. This is exactly the suggested fix and mirrors `pdf-document-list.tsx:164-187`'s `PdfDocumentListRow` line for line (same `useCallback` shape, same dep arrays, same comment convention).

Scrutiny of the fix's own mechanics, per the four specific questions asked:

- **Is the generic-preserving cast sound?** Yes. `memo`'s TS signature is `memo<P extends object>(Component: FunctionComponent<P>): NamedExoticComponent<P>` — it is not itself generic over a type parameter the caller controls per-callsite, so passing a generic function component to it forces TS to instantiate `TItem` to a fixed type (effectively `unknown`) and the result loses genericity: without the cast, `CardListRow` would type as `NamedExoticComponent<CardListRowProps<unknown>>`, unusable at the actual call site (`renderItem`'s `<CardListRow item={item} .../>`, where `item: CardListItem<TItem>` for the real `TItem`) without an unsound `as unknown as CardListItem<unknown>`-style escape hatch there instead. The `as <TItem>(props: CardListRowProps<TItem>) => ReactNode` cast is the standard, well-documented workaround for typing a generic component wrapped in `memo`/`forwardRef` (same idiom as the React+TypeScript cheatsheet's generic-component guidance) and is a compile-time-only reinterpretation — it changes nothing at runtime. Verified the component body never inspects or branches on `TItem` concretely (only touches `item.id`, `item.disabled`, `item.content`, `item.showEditButton`, `item.showRemoveButton`, and passes `item` opaquely to `onEditPress`/`onRemovePress`; the generic payload field `data: TItem` is untouched) — so the runtime behavior really is generic-safe for any `TItem`, and the cast doesn't paper over an actual type-unsound operation. It does not defeat displayName/devtools: the wrapped function is a named function expression (`function CardListRow<TItem>(...)`), so React/devtools resolve the name from `Component.name` at runtime regardless of the compile-time cast (the cast only changes the exported TS type, not the underlying `$$typeof: REACT_MEMO_TYPE` object). No mismatched-generic type-safety hole found.
- **Is `memo`'s benefit genuine or cosmetic given `item` is an object reference?** Genuine in the scenario this component itself creates most often. `renderItem` (`card-list-with-abm-dialog.tsx:71-82`) is `useCallback`-stabilized with deps `[openEditDialog, openRemoveDialog, getEditAccessibilityLabel, getRemoveAccessibilityLabel]`; `openEditDialog`/`openRemoveDialog` come from `use-card-list-with-abm-dialog.ts:22-28`, both `useCallback(..., [])` — permanently stable identity for the component's lifetime. So on every `dialogState`/`isSubmitting` re-render of `CardListWithABMDialog` (the component's single most frequent re-render trigger — opening/closing a dialog, toggling submitting), `renderItem`'s reference is unchanged, `items`/`keyExtractor` are unchanged (assuming the caller passes a stable `items` reference, which is the caller's contract to uphold, same assumption `pdf-document-list.tsx` already makes for its own memoized row), so per-row `item` references are unchanged too. In that common case `CardListRow`'s `memo` prevents `FlatList`'s internal re-invocation of each row's function body (and the nested `Card`/`IconButton` subtree) from re-running needless work whenever `FlatList` does re-run `renderItem` for currently-mounted cells on a parent re-render — which is exactly the dialog-open/close/submit-toggle path this component is built around. The benefit is conditional on caller-supplied `items`/`getEditAccessibilityLabel`/`getRemoveAccessibilityLabel` reference stability (outside this component's control), but that's an inherent, pre-existing limitation of the pattern itself, identical to `PdfDocumentListRow`'s own precedent — not a new gap introduced by this fix, and not grounds for a new finding.
- **Any risk of a mismatched generic silently type-checking?** No new risk found — see above; the cast reflects genuinely generic-safe runtime behavior, and each call site is still checked against `CardListRowProps<TItem>` for the `TItem` inferred at that site (only one call site, `renderItem`, exists in this file).

### Finding 2 [code] — CONFIRMED RESOLVED

`dialogInteractionProps` (`:100-102`) and `renderDialogBody` (`:106-112`) replace the duplicated ternary shape in both `Dialog` blocks (`:138-147`, `:148-157`), each now `{...dialogInteractionProps}` plus `{renderDialogBody('edit'|'remove', renderEditForm|renderRemoveConfirmation)}`. Checked:

- **Recomputed every render — perf concern?** `dialogInteractionProps` is a two-key object literal computed once per parent render (not per-item, not in a loop) — trivial allocation, no measurable cost, consistent with how the original inline `isSubmitting ? ... : ...` ternaries were already recomputed per render in the pre-fix code. Not a regression, not worth `useMemo`.
- **Does `renderDialogBody`'s narrowing preserve original per-branch behavior?** Yes, confirmed equivalent by De Morgan/case analysis: original was `dialogState?.type === type ? (isSubmitting ? <SubmittingIndicator/> : render(item)) : null`; new is `if (dialogState?.type !== type) return null; return isSubmitting ? <SubmittingIndicator/> : render(dialogState.item)`. `!==` is the exact negation of `===`, so the two are logically identical for all three cases (`dialogState` null, `dialogState.type` equal, `dialogState.type` different-branch) — verified each: `dialogState` null → `undefined !== type` → true → `null` (matches original `undefined === type` → false → `null`); `dialogState.type` matches → early-return skipped, falls to submitting-swap (matches); `dialogState.type` is the *other* dialog's type → early-return fires → `null` (matches original's `false` branch). `check-types` green confirms TS's control-flow narrowing accepts `dialogState.item` after the `dialogState?.type !== type` early return (TS narrows the optional-chain discriminant here) — no `as`/`!` needed, no type-safety shortcut taken.
- **Is `{...dialogInteractionProps}` safe against `Dialog`'s prop types?** `DialogProps` (`dialog.types.ts`) has `onClose?: () => void` and `actions?: ReactNode`, both optional; `dialogInteractionProps`'s two branches (`{onClose: undefined, actions: EMPTY_DIALOG_ACTIONS}` / `{onClose: closeDialog, actions: undefined}`) are each fully assignable to that shape — same values that were previously passed inline, just relocated. No extra/mismatched keys spread onto `Dialog`.

### Full-file re-read (`174d6b455`, whole `.tsx`)

Re-read the complete file top to bottom. `EMPTY_DIALOG_ACTIONS` semantics unchanged (still the module-level `<></>` constant, still only referenced from `dialogInteractionProps`). All testIDs (`cardListItemCardTestId`/`EditTestId`/`RemoveTestId`, `CARD_LIST_WITH_ABM_DIALOG_LIST_TEST_ID`) and the a11y wiring (`accessibilityRole="header"`, per-row `getEditAccessibilityLabel`/`getRemoveAccessibilityLabel`, local wrapper `View`s for icon testIDs rather than an atom `testID` prop) are all intact and unchanged by the fix. `CardListWithABMDialog`'s own `<TItem,>` generic signature is untouched. No new state, no new props, no new imports beyond `memo`/`ReactNode` (both used). Nothing else the fix could plausibly have broken was found.

### Precedent comparison (`pdf-document-list.tsx`)

`PdfDocumentListRow` needs no generic-preserving cast because it's non-generic (`PdfDocumentListRowProps` has no type parameter) — `memo(function PdfDocumentListRow({...}: PdfDocumentListRowProps) {...})` types cleanly on its own. `CardListRow`'s cast is the correctly-adapted equivalent for a generic row component; it is not a divergence introduced carelessly but the minimum necessary adaptation of the same idiom to a generic context, matching the same `useCallback` shape, same inline-comment convention citing the full-review perf finding, and the same "memoize the row, useCallback its call-throughs" structure. No divergence worth flagging.

### Round 2 verdict: RESOLVED

Both round-1 minor findings are cleanly fixed; the fix's own mechanics (the generic-preserving `memo` cast, `dialogInteractionProps`/`renderDialogBody` extraction) introduce no new blocker/major/minor finding. No other production file changed in `174d6b455` (doc-only elsewhere, confirmed via `git show --stat`).

## Mini-gate bug-fix delta review — empty-dialog flash on close

**Scope:** delta-only review of the post-`pr_ready` mini-gate reopen, exactly commit
`8aa12b28e129a706c47642fee770b264489fe3ac` ("fix(components): stop empty-dialog flash on
CardListWithABMDialog close") on top of the already-`APPROVED`/97.2%-mutation-accepted HEAD. Not a
full feature re-review — Round 1/Round 2 findings above are not re-litigated (both already
`RESOLVED`). Reviewed the full current source of both production files in context (not just the
diff), `gherkin-scenarios.md`'s `@s19`/`@s20`, and `spec.md`'s "Post-`pr_ready` bug fix (mini-gate)"
Open decision.

**CI:** green @ `2b50eb877` — `pnpm lint`/`check-types` repo-wide clean; `pnpm --filter
@helsoft/components test` 70 suites/529 tests green (explicit re-run, includes both delta test
files); `@helsoft/activities` re-run in isolation (`--runInBand`) also green — the one full-parallel
`slide-view.test.tsx` timeout is a confirmed pre-existing unrelated flake in an unrelated lib, out
of scope for this delta. Feature e2e re-run explicitly: 5/5 passed, no new e2e for @s19/@s20 (typed
decision in `tdd.md`: animation-timing isn't reliably Playwright-assertable without flakiness,
covered at hook/component-prop level instead — reasonable given `Dialog`'s own `Modal` is
instant-hide, not animated, under the RN Jest/JSDOM test environment, so no e2e tool available here
could actually observe a mid-fade frame either).

### Verdict: APPROVED

No blocker or major findings. Zero new findings at any severity for this delta.

### TDD reasoning (reasoned, not re-run — per protocol, no `pnpm test` execution by this reviewer)

Read the pre-fix hook (`git show 8aa12b28e^:.../use-card-list-with-abm-dialog.ts`): `closeDialog`
was `setDialogState(null)` only, no `isOpen` field existed. Against the new tests in this commit:
`use-card-list-with-abm-dialog.test.ts`'s `closeDialog flips isOpen to false but keeps the last
dialogState (edit/remove)` reads `result.current?.isOpen` (undefined on the pre-fix hook — the
field didn't exist, so `toBe(false)` would fail) and `result.current?.dialogState` (would be `null`
on pre-fix code, failing `toEqual({type:'edit', item})`). `card-list-with-abm-dialog.test.tsx`'s
two new tests assert `closedProps.open === false` and `bodyText(closedProps.children) ===
'Edit form for item-1'`/`'Remove item-2?'` — on pre-fix code `renderDialogBody` returns `null` once
`dialogState` is nulled (since `dialogState?.type !== type` is `true` when `dialogState` is `null`),
so `bodyText(null)` → `''`, failing the `toBe(...)` assertion. All four new/changed assertions
demonstrably fail against the pre-fix code and pass against the fix — genuine Red→Green, not a
vacuous regression test. `use-card-list-with-abm-dialog.ts` is the one non-UI `.ts` file touched
(test-first expected per `tdd.mdc`) — production code added (`isOpen` state + its two `setIsOpen`
call sites) is exactly what the new/changed hook-test assertions demand, nothing further; no scope
inflation. `card-list-with-abm-dialog.tsx` is UI `.tsx` (implementation-first) — no test-first
evidence required there, and it already has its `.test.tsx`/`.stories.tsx`/`.e2e.js` from the prior
slices (no new component created this delta, so no new co-location artifacts required).

### `jest.mock('../dialog/dialog', ...)` spy — soundness check

`libs/components/src/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.test.tsx:12-18`:
`Dialog: jest.fn(actual.Dialog)` fully delegates to the real `Dialog` implementation (verified by
reading `dialog.tsx` in full — `jest.fn(impl)` calls through to `impl` on every invocation, unlike
`jest.fn()` with no arg, which would stub it to `undefined`-returning). Confirmed this doesn't
change behavior for any of the ~20 pre-existing tests in this file: every other assertion in the
file queries by role/text/testID against the rendered output (e.g. `screen.getByText('Edit card')`,
`within(...).getByRole('button')`), which is unaffected by the spy — the spy only adds an
observation point (`DialogMock.mock.calls`), it doesn't alter `Dialog`'s rendered tree, props
handling, or the `Modal`'s `visible`/`onRequestClose` wiring. `DialogMock.mockClear()` in
`beforeEach` (`:103-109`) is correctly scoped: `mockClear()` resets only `mock.calls`/
`mock.instances`/`mock.results`, not the mock's implementation (that's `mockReset()`/
`mockRestore()`), so the delegation to the real `Dialog` persists across every test while each
test's own call history starts empty — exactly the intent documented in the adjacent comment
(avoids the previous run's accumulated call history, which per the comment was the actual cause of
a worker heap blowup, not anything under test). No leakage found.

### `bodyText()` shallow-string-comparison workaround

`card-list-with-abm-dialog.test.tsx:47-50`. The assertion's real target is whether
`renderDialogBody` still supplies the last-known `renderEditForm(item)`/
`renderRemoveConfirmation(item)` `<Text>` element (vs. `null`) after `closeDialog` runs — `bodyText`
reads `element.props.children`, which for this file's `renderEditForm`/`renderRemoveConfirmation`
fixtures (`(item) => <Text>{`Edit form for ${item.id}`}</Text>`) is exactly the plain string
content. This is a faithful proxy for "did `dialogState.item` survive the close," not a weakened
assertion: a regression (dialogState nulled) collapses `children` to `null` → `bodyText` returns
`''`, which still fails the `toBe('Edit form for item-1')` assertion (verified in the TDD-reasoning
section above). The documented reason for avoiding `toEqual` on the raw React element (dev-only
class-component instance getters recursing pathologically under Jest's equality algorithm) is a
known, real Jest/RTL interaction with React elements holding host-component refs/instances, and
using string-content comparison instead doesn't mask a broader assertion gap here since the two
new tests' only substantive claims are exactly `open` (checked directly, not through `bodyText`)
and body content (what `bodyText` checks) — no other props of `closedProps` needed comparing.

### Lenses checked, no findings

- **Code quality/TDD** — `@s19`/`@s20` each map to ≥2 concrete tests (hook-level +
  component-prop-level), per `tdd.md`'s `@s → test` table, cross-checked directly in both test
  files (see TDD reasoning above). No `console.log`/debug leftovers, no bare TODOs (`grep` clean
  against the diff). Functional React only; `Props` unaffected (no new public type — `isOpen` is
  an added field on the hook's already-untyped-as-explicit-interface return object, consistent with
  the existing pattern where the return shape is inferred, not a named `.types.ts` export).
  Kebab-case filenames unchanged. i18n: no new user-facing strings introduced by this fix (the
  fix touches only boolean gating logic, not chrome text).
- **Architecture/layering** — `Component → Hook` respected; no service/DAO touched. Two
  `useState` fields (`dialogState`, `isOpen`) in `use-card-list-with-abm-dialog.ts:29-30`: below
  `state.mdc`'s ≥3-related-fields → `useReducer` threshold (2, matching spec.md's stated
  rationale) — verified the reachable-state-space claim by tracing every call site:
  `openEditDialog`/`openRemoveDialog` (`:32-50`) always set both fields together in the same
  callback (batched into one render), `closeDialog` (`:52-58`) only ever flips `isOpen`, so
  `isOpen === true && dialogState === null` is unreachable — the "only one dialog open at a
  time"/"no invalid combined state" invariant the original single-discriminated-union comment
  claims (`:4-9`) still holds even though the state is now split across two `useState` calls.
  Gating `Dialog`'s `open` prop as `isOpen && dialogState?.type === 'edit'|'remove'` inline in
  `card-list-with-abm-dialog.tsx:153,163` (rather than as a derived `isEditOpen`/`isRemoveOpen`
  getter returned from the hook) continues the exact pre-existing, already-`APPROVED`-in-Round-1
  pattern (`open={dialogState?.type === 'edit'}` was already computed inline in the `.tsx`, not in
  the hook, before this fix) — not a new `component-split.mdc` violation, just the same established
  style extended by one `&&` clause. No atom-ban violation: `dialog.tsx`/`dialog.types.ts` have
  zero diff in this commit (confirmed via `git show 8aa12b28e --stat`) — the fix is entirely local
  to the consuming hook/component, exactly as spec.md's rationale claims.
- **Performance** — one added `useState` call is a fixed, negligible per-render cost. No new
  render cycle on open: `openEditDialog`/`openRemoveDialog`'s two `setState` calls
  (`setDialogState`+`setIsOpen`) are called synchronously in the same event-handler tick and are
  batched by React's automatic batching into one render, same as the single `setDialogState` call
  pre-fix — no doubling of render count. `closeDialog` still does exactly one `setState` call, same
  as before. Stale-reference note (explicitly asked to evaluate): `dialogState.item` (and its
  caller-owned `data: TItem` payload) is now retained in memory for the interval between
  `closeDialog` and the next `openEditDialog`/`openRemoveDialog` call, whereas pre-fix it was
  nulled immediately — bounded to exactly one item reference at a time (never accumulates a list),
  released as soon as the next dialog opens (replaced, not appended) or the component unmounts;
  this is the fix's explicit, spec.md-documented intent (@s19/@s20 require the last content to keep
  rendering through the close transition) and not a leak — no finding.
- **Security** — **N/A.** Confirmed via `git show 8aa12b28e --stat`: only two production files
  touched (`use-card-list-with-abm-dialog.ts`, `card-list-with-abm-dialog.tsx`), both pure
  UI-local-state hook/component code — no service/DAO/auth/network/storage/Supabase surface, no
  secrets/env reads, no logging, no new user input parsing. `grep` for `console.`/network/storage
  APIs across the diff: none found. OWASP Top 10/MASVS: no applicable surface in this delta.

### Notes for the fix

None — this delta is clean at all four lenses. No follow-up requested.

## Post-pr_ready mini-gate delta review — CardListRow extraction (architecture/molecule split)

**Scope:** delta-only review of commit `e4b2a5a54` ("refactor(components): extract CardListRow to
its own molecule") on top of the already-`APPROVED` HEAD (Round 1/Round 2/empty-dialog-flash
mini-gate all closed, not re-litigated). Doc-only follow-up `902b30c87` (touches only `tasks.md`)
explicitly out of scope per instructions. Reviewed `git show --stat e4b2a5a54` and the full
`git show e4b2a5a54` diff, plus the current full contents of every touched file and the cited
precedent (`molecules/pdf-document-list-item/pdf-document-list-item.types.ts`,
`organisms/pdf-document-list/pdf-document-list.tsx`).

**CI:** green @ `902b30c87` (`pnpm lint`/`check-types`/`test` repo-wide — 71 suites/534 tests in
`@helsoft/components`, including the new `card-list-row.test.tsx`; feature e2e 5/5, no flake) —
taken as given per protocol, not re-run.

### Verdict: CHANGES_REQUESTED

One major architecture finding (below); everything else checked clean — see per-lens summary.

### Findings

1. **[arch] major** — `CardListRow`'s new molecule types file inverts the atomic-design
   dependency direction the refactor was supposed to fix, and does not actually match the
   precedent its own rationale (`docs/features/card-list-with-abm-dialog/spec.md`'s "Post-`pr_ready`
   architecture fix (mini-gate)" entry) claims to mirror.

   `libs/components/src/molecules/card-list-row/card-list-row.types.ts:1`:
   ```ts
   import type { CardListItem } from '../../organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.types';
   ```
   `CardListRowProps<TItem>` (`card-list-row.types.ts:6-12`) is defined entirely in terms of this
   imported organism type (`item: CardListItem<TItem>`, `onEditPress: (item: CardListItem<TItem>) => void`,
   etc.) — i.e. the molecule imports its whole prop shape from the organism it was extracted out
   of. The call site confirms there is no flattening/adapter step left anywhere:
   `card-list-with-abm-dialog.tsx:60-68`'s `renderItem` passes the organism's full generic
   `CardListItem<TItem>` straight through as `<CardListRow item={item} onEditPress={openEditDialog}
   onRemovePress={openRemoveDialog} .../>` with zero mapping.

   Compare against the precedent the spec.md rationale explicitly cites,
   `pdf-document-list-item`: `PdfDocumentListItemProps`
   (`libs/components/src/molecules/pdf-document-list-item/pdf-document-list-item.types.ts:3-12`)
   is fully flat/primitive (`filename: string`, `status: PdfDocumentStatus`, `createdAt: string`,
   `pageCount: number | null`, plain `onGenerate?`/`onOpenLesson`/`onDelete?` callbacks) — **zero
   import from `organisms/pdf-document-list/pdf-document-list.types.ts`**. The organism keeps its
   own thin, unexported, `memo`-wrapped adapter row, `PdfDocumentListRow`
   (`organisms/pdf-document-list/pdf-document-list.tsx:19-23,164-187`), which is the piece that
   maps the organism's `PdfDocumentListItemData` DTO down to the molecule's flat props at the call
   site (`:177-186`) — that adapter is intentionally *not* promoted to the molecule layer, precisely
   so the molecule stays organism-agnostic.

   This is a real violation of `.agents/rules/atomic-design.mdc:8` ("Compose upward. An atom never
   imports a molecule…") applied one level up (a molecule should not import from the organism that
   consumes it) and of the same file's molecule contract (line 23: "Still portable and reusable —
   drop in wherever that pattern is needed"): `CardListRow` cannot currently be dropped into an
   unrelated context without also importing `card-list-with-abm-dialog.types.ts`, coupling it to
   that one organism's generic `TItem`/dialog-orchestration vocabulary
   (`getEditAccessibilityLabel`/`getRemoveAccessibilityLabel` builder-function props, not resolved
   strings). It is legal TypeScript (`CardListItem` is exported, so no `types.mdc` private-type leak),
   and it is not a runtime bug — CI is green and behavior is unchanged — but it does not deliver
   what `spec.md`'s rationale claims ("it's a composed unit… not organism-specific chrome" / "matches
   this lib's own precedent"): the precedent's whole point is that the molecule *isn't*
   organism-specific, and this one still is. Recommend before closing this mini-gate: either (a)
   flatten `CardListRowProps` to primitives (`content: ReactNode`, `disabled?: boolean`,
   `showEditButton?/showRemoveButton?: boolean`, `onEditPress: () => void`, `onRemovePress: () =>
   void`, `editAccessibilityLabel: string`, `removeAccessibilityLabel: string` — resolved by the
   caller) and reintroduce a thin, unexported `CardListWithABMDialogRow` adapter in the organism
   that maps `CardListItem<TItem>` → those flat props at the call site (true mirror of
   `PdfDocumentListRow`), or (b) if the team accepts the generic-payload coupling as an intentional,
   narrower exception for this generic-over-`TItem` case, update `spec.md`'s rationale to say so
   explicitly rather than claim full alignment with a precedent it doesn't structurally match.

### Lenses checked, no findings

- **Code quality/TDD** — no new `@s` scenarios (commit message and `tdd.md` both state this is a
  pure structural move); no `@s` needs new test mapping. `card-list-row.test.tsx` is genuine,
  non-degraded coverage of the moved unit, not a verbatim copy with gaps: icon visibility
  (`:387-409`, @s3/@s4 + both-omitted case), disabled state incl. exact opacity value and
  `accessibilityState.disabled` on both icons (`:412-437`, @s2), per-item accessible names built
  from `get*AccessibilityLabel(item)` (`:372-384`, @s14), press-callback forwarding for both edit
  and remove with cross-checks that the *other* handler is not called (`:441-471`), the exported
  testID-helper literal templates (`:365-369`), and the row-layout flex assertions moved verbatim
  from the organism's old test (`:475-494`). All were removed from `card-list-with-abm-dialog.test.tsx`
  at the same lines they were added to the molecule's test — no coverage gap, confirmed by reading
  both full diffs side by side. `card-list-row.stories.tsx` covers BothIcons (default `meta.args`),
  EditOnly, RemoveOnly, Disabled — each a distinct, renderable `Story` object with valid
  `CardListItem<StoryFlashcard>` args (no missing required prop, no `undefined`-callback path that
  would throw on render) — meaningful, not just present. TDD-by-file-type: both new files are UI
  (`.tsx`/`.stories.tsx`), implementation-first per `tdd.mdc` — no test-first evidence expected, and
  none of the three required co-located artifacts (`.tsx`, `.stories.tsx`, `.test.tsx`) is missing.
  No `console.log`/debug leftovers, no bare TODOs (grep clean). Functional React only; `Props` type
  (`CardListRowProps`) present and correctly promoted to `.types.ts` now that it's shared across two
  files (component + test) instead of component-private. Kebab-case filenames throughout
  (`card-list-row/card-list-row.tsx`, `.types.ts`, `.stories.tsx`, `.test.tsx`). i18n: no
  user-facing strings added or changed by this move (all chrome still caller-supplied via props,
  unchanged from Round 1).
- **Architecture/layering (aside from finding 1)** — `Component → Hook` chain untouched (this
  delta doesn't touch `use-card-list-with-abm-dialog.ts`). No DAO/service/cross-layer import
  introduced. `molecules/index.ts:5-6` barrel wiring is correctly shaped and alphabetically placed —
  `export * from './card-list-row/card-list-row'` + `export type * from
  './card-list-row/card-list-row.types'`, matching the `pdf-document-list-item` entry's exact
  two-line export shape (`molecules/index.ts:21-22`). No new dependency added. `CardListItem<TItem>`
  itself is not a DTO (no DAO in this feature) — it's the organism's own public domain type, so no
  DTO-leak violation independent of finding 1.
- **Performance** — confirmed genuinely neutral, not a regression or improvement:
  `card-list-row.tsx:23-31` — same `memo(function CardListRow<TItem>(...) {...}) as <TItem>(props:
  CardListRowProps<TItem>) => ReactNode` cast, same `useCallback(() => onEditPress(item),
  [onEditPress, item])` / `useCallback(() => onRemovePress(item), [onRemovePress, item])` pattern,
  byte-identical to the pre-move inline definition (diffed old `card-list-with-abm-dialog.tsx:167-216`
  against new `card-list-row.tsx:23-73` — only the import paths' relative depth and the module
  boundary changed, confirmed both files sit at the same `src/`-relative depth
  (`src/molecules/card-list-row/` vs `src/organisms/card-list-with-abm-dialog/`) so `../../atoms/...`
  and `../../theme/spacing` resolve identically). `FlatList` usage, `keyExtractor`/`renderItem`
  `useCallback` stabilization in the organism unaffected by this delta. No new N+1/network
  round-trips (no network surface in this diff).
- **Security** — **N/A.** Confirmed via `grep -rn "console\.|process\.env|SECRET|API_KEY|fetch(|supabase"`
  across both touched directories (`molecules/card-list-row/`, `organisms/card-list-with-abm-dialog/`):
  no matches. Pure presentational move within `@helsoft/components` — no new service/DAO/auth/
  network/storage/Supabase surface, no secrets/env reads, no logging, no PII sink. OWASP Top
  10/MASVS: no applicable surface in this delta.

### Confirmations (specific checks requested)

- **No-op verification** — prop surface, behavior, `memo`/`useCallback` wrapping, and all three
  testID exports (`cardListItemCardTestId`/`cardListItemEditTestId`/`cardListItemRemoveTestId`)
  preserved verbatim (same literal template strings, same call sites) — confirmed by diffing the
  removed block in `card-list-with-abm-dialog.tsx` against the new `card-list-row.tsx` line by
  line; only the module boundary changed.
- **Barrel wiring** — correct, matches precedent shape (see Architecture bullet above).
- **Test/story coverage genuineness** — confirmed genuine, not degraded (see Code quality bullet
  above); nothing visibly broken in the move (no lost testID, no lost accessible name, no story
  that would fail to render).

### Fix applied (implementer) — finding 1 resolved

`CardListRowProps` (`libs/components/src/molecules/card-list-row/card-list-row.types.ts`)
flattened to primitives — `content: ReactNode`, `disabled?`, `showEditButton?`/`showRemoveButton?`,
`onEditPress: () => void`, `onRemovePress: () => void`, `editAccessibilityLabel`/
`removeAccessibilityLabel: string`, plus `testID?`/`editTestID?`/`removeTestID?: string` (mirrors
`Card`'s own `testID?` prop) — zero import from `organisms/card-list-with-abm-dialog/*`.
`card-list-row.tsx` is now a plain (non-generic) memoized component; no more generic-preserving
cast needed. A new unexported, generic `CardListRowAdapter` in `card-list-with-abm-dialog.tsx`
(mirroring `pdf-document-list.tsx`'s `PdfDocumentListRow`) maps the organism's `CardListItem<TItem>`
+ its builder-prop/callback vocabulary down to `CardListRow`'s flat props at the `renderItem` call
site — item-bound `onEditPress`/`onRemovePress` closures, resolved accessible-name strings, and the
three testID literals (`cardListItemCardTestId`/`cardListItemEditTestId`/`cardListItemRemoveTestId`,
moved back to `card-list-with-abm-dialog.tsx` since they are this organism's own literal templates,
not a portable molecule concern) all now live in the adapter, not the molecule. `card-list-row.tsx`/
`.stories.tsx`/`.test.tsx` updated to the flat shape (same coverage — icon visibility, disabled
state, accessible names, press callbacks, layout — now driven by plain caller-supplied testID
strings instead of `item.id`-derived ones). `card-list-with-abm-dialog.test.tsx`'s import of the
testID helpers switched to `./card-list-with-abm-dialog`; no other test changes needed (organism
behavior unchanged). `pnpm --filter @helsoft/components lint check-types test` green (71
suites/533 tests) and the feature's Playwright e2e re-run 5/5 passed. No `@s` scenario changed.

## Post-pr_ready mini-gate fix-delta review — CardListRow flatten + organism-owned adapter

**Scope:** delta-only review of `implementer`'s fix commit `f753311a5` ("fix(components): flatten
CardListRow props, add organism-owned adapter") — the ONLY commit on top of the previously-reviewed
HEAD `902b30c87` (`git diff 902b30c87 f753311a5`). Resolves the one `[arch] major` finding from the
"Post-`pr_ready` mini-gate review — CardListRow extraction" section above (reverse
molecule→organism dependency). That finding's original reasoning is not re-litigated — only whether
it is now genuinely resolved and whether the resolution itself introduces anything new, per this
round's four explicit questions (a/b/c).

**CI:** green @ `f753311a5` — taken as given per protocol, not re-run by this reviewer.

**`git show --stat f753311a5`:** touched files — `card-list-row.types.ts`, `card-list-row.tsx`,
`card-list-row.stories.tsx`, `card-list-row.test.tsx` (molecule), `card-list-with-abm-dialog.tsx`,
`card-list-with-abm-dialog.test.tsx` (organism), plus `review.md`/`review-engineering.md`/`tdd.md`
(doc-only). No other production file touched.

### (a) Flat/portable molecule types — CONFIRMED CLEAN

`card-list-row.types.ts:1` now imports only `type { ReactNode } from 'react'`; the prior
`import type { CardListItem } from '../../organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.types'`
is gone. `CardListRowProps` is fully flat/primitive: `content: ReactNode`, `disabled?: boolean`,
`showEditButton?/showRemoveButton?: boolean`, `onEditPress: () => void`, `onRemovePress: () =>
void`, `editAccessibilityLabel/removeAccessibilityLabel: string`, `testID?/editTestID?/removeTestID?:
string`. Grepped the whole `molecules/card-list-row/` tree for any `organisms/` or
`card-list-with-abm-dialog` reference — none found (`card-list-row.tsx`, `.types.ts` both clean;
`.test.tsx`/`.stories.tsx` are test/story fixtures, not the production import graph, and both are
also clean — confirmed below). `CardListRowProps` is no longer generic (`CardListRowProps`, not
`CardListRowProps<TItem>`), matching `PdfDocumentListItemProps`'s non-generic shape exactly — the
structural match to the precedent is now genuine, not merely claimed: both molecules take plain
primitives/callbacks and own zero knowledge of their respective organism's generic/DTO vocabulary.

### (b) Adapter preserves all prior behavior — CONFIRMED CLEAN

`CardListRowAdapter` (`card-list-with-abm-dialog.tsx:38-72`), unexported, generic, `memo`-wrapped,
cast `as <TItem>(props: CardListRowAdapterProps<TItem>) => ReactNode` (same idiom already accepted
for `CardListRow` itself pre-fix and for `PdfDocumentListRow`'s non-generic case).

- **testIDs** — `cardListItemCardTestId`/`cardListItemEditTestId`/`cardListItemRemoveTestId`
  (`:21-25`) moved back verbatim — same three literal template strings, byte-identical to what was
  in the molecule before this fix and to the original pre-extraction versions (`` `card-list-with-abm-dialog-card-${id}` ``
  etc.). `card-list-with-abm-dialog.test.tsx`'s import switched from
  `'../../molecules/card-list-row/card-list-row'` to `'./card-list-with-abm-dialog'` (`:26-29`) —
  resolves correctly (both names are now exported from the organism module, confirmed by reading the
  full diff: `export const cardListItem*TestId` sit at organism top-level, `card-list-with-abm-dialog.tsx:21-25`).
  Since `check-types`/`test` are green at this SHA, the import resolves and every existing
  `cardListItemEditTestId('item-2')`/`cardListItemRemoveTestId('item-1')` call site in that test
  file still produces the exact same testID strings against the exact same rendered DOM.
- **Accessible names** — `getEditAccessibilityLabel(item)`/`getRemoveAccessibilityLabel(item)`
  resolved at the adapter boundary (`:66-67`: `editAccessibilityLabel={getEditAccessibilityLabel(item)}`,
  `removeAccessibilityLabel={getRemoveAccessibilityLabel(item)}`) — same resolution point and same
  builder-function contract as before the extraction; `CardListRow` itself only ever sees the
  already-resolved string, never the builder function.
- **Item-bound press callbacks** — `handleEditPress`/`handleRemovePress` (`:59-60`):
  `useCallback(() => onEditPress(item), [onEditPress, item])` / `useCallback(() => onRemovePress(item),
  [onRemovePress, item])`. Deps arrays correct — both closed-over values (`onEditPress`/`onRemovePress`
  from the organism's `openEditDialog`/`openRemoveDialog`, and `item`) are actually read inside the
  callback, nothing extraneous, nothing missing. This is the exact same shape `CardListRow` had
  pre-fix (Round 2's already-`RESOLVED` perf fix) — the wrapping simply moved from the molecule to
  the adapter, one level up, with the molecule now receiving the already-bound zero-arg
  `onEditPress`/`onRemovePress` handlers as its flat prop contract requires. `memo` is applied to
  `CardListRowAdapter` (`:52`) and separately to `CardListRow` (`card-list-row.tsx`, unchanged from
  Round 2) — two `memo` layers, each guarding a different prop boundary (adapter guards against
  `CardListItem<TItem>`/builder-function reference churn from the organism's `renderItem`; the inner
  `CardListRow` guards against its own flat-prop boundary) — not redundant, since each memo compares
  a distinct prop shape. No perf regression versus the pre-fix single-`memo` structure; this is at
  least as good (arguably marginally better isolation, since a change in one adapter-level prop that
  doesn't affect the resolved flat props — impossible here since all flat props derive from the
  adapter's own inputs, but structurally sound regardless).
- **End-to-end regression check** — confirmed via `card-list-with-abm-dialog.test.tsx`'s unchanged
  `@s5`–`@s9` tests (only the import lines changed, not the test bodies): pressing item-2's edit
  icon opens the edit dialog scoped to item-2 only (`Edit form for item-2` renders, `Edit form for
  item-1` does not), item-1's remove icon opens/confirms against item-1 only
  (`onRemoveConfirm`/`onEditSubmit` `toHaveBeenCalledWith(items[0]/items[1])`) — the adapter's
  item-bound closures demonstrably still route to the correct per-row item after the refactor, not
  just structurally plausible.

### (c) No new issue introduced by the fix itself — CONFIRMED CLEAN

- **Duplication/double-wrapping** — checked `card-list-row.tsx` (post-fix): no `useCallback`, no
  handler wrapping at all inside the molecule now — `onPress={onEditPress}`/`onPress={onRemovePress}`
  pass the adapter's already-bound handlers straight through to `IconButton`. Exactly one wrapping
  point exists (`CardListRowAdapter`), not two — no wasted allocation, no double-bind.
- **Generic-preserving cast** — `CardListRowAdapter`'s `as <TItem>(props: CardListRowAdapterProps<TItem>)
  => ReactNode` cast is the same accepted idiom reviewed and cleared in Round 2 (memo erases a
  generic function component's type parameter; the cast is a compile-time-only reinstatement, not a
  runtime behavior change) — same reasoning applies verbatim here since the mechanics are identical
  (a `memo`-wrapped generic function component needing its genericity restored for its one call
  site). No new unsoundness: the adapter body only ever touches `item.id`, `item.content`,
  `item.disabled`, `item.showEditButton`, `item.showRemoveButton`, and passes `item` opaquely to
  `onEditPress`/`onRemovePress`/`getEditAccessibilityLabel`/`getRemoveAccessibilityLabel` — never
  branches on the concrete `TItem`, so the cast reflects genuinely generic-safe runtime behavior.
- **`card-list-row.test.tsx`/`.stories.tsx` coverage** — re-read both in full (see diff above): every
  assertion from the pre-fix version has a direct flat-prop equivalent — icon visibility
  (`showEditButton`/`showRemoveButton` true/false/both-omitted), disabled state (opacity 0.38 +
  `accessibilityState.disabled` on both icons), accessible names (now asserted directly against
  literal `editAccessibilityLabel`/`removeAccessibilityLabel` prop values instead of a builder
  function's output — same underlying claim, simpler fixture), press-callback firing with
  cross-checks that the other handler isn't called, row-layout flex assertions (unchanged, still
  present at the tail of the file). The dropped assertion `toHaveBeenCalledWith(baseItem)` on
  `onEditPress`/`onRemovePress` is correctly *not* a coverage loss — that item-bound semantics claim
  now belongs to the adapter/organism layer (and is still exercised there, per (b) above); the
  molecule's own contract is genuinely just "call the zero-arg prop that was handed to it," which
  the new tests assert precisely. `.stories.tsx`'s generic-cast workaround (`ComponentType<CardListRowProps<StoryFlashcard>>`)
  is gone entirely — `CardListRow` is no longer generic, so the story now types directly against
  `typeof CardListRow`, a net simplification, not a degradation.
- **Stale/orphaned imports** — `card-list-with-abm-dialog.test.tsx`'s testID-helper import is now a
  single import block from `'./card-list-with-abm-dialog'` alongside `CARD_LIST_WITH_ABM_DIALOG_LIST_TEST_ID`/
  `CardListWithABMDialog` — no leftover import of the old molecule path found (grepped the file: zero
  remaining references to `'../../molecules/card-list-row/card-list-row'`). No dead export left
  behind in the molecule (`cardListItemCardTestId`/etc. no longer exported from
  `card-list-row.tsx` at all — fully moved, not duplicated). Both barrels (`molecules/index.ts`,
  `organisms/index.ts`) use `export *`/`export type *`, so no barrel edit was needed and none is
  missing — confirmed both wildcard re-exports still resolve correctly post-move (CI green backs
  this, and `grep` shows no explicit named-export list anywhere that would need updating).
- **Security** — grepped `libs/components/src/molecules/card-list-row/` and
  `libs/components/src/organisms/card-list-with-abm-dialog/` for `secret|apikey|api_key|token|
  password|service_role|EXPO_PUBLIC` — no matches. Delta remains pure presentational UI (props/types/
  tests/stories only) — no service/DAO/auth/network/storage/Supabase surface touched. **security:
  N/A** confirmed, consistent with every prior round of this feature.

### Round verdict: RESOLVED

The round-1-of-this-mini-gate `[arch] major` finding (reverse molecule→organism dependency) is
cleanly fixed: `card-list-row.types.ts` is now genuinely flat/portable with zero organism import,
structurally matching `pdf-document-list-item.types.ts`'s precedent (not merely claiming to). The
new `CardListRowAdapter` correctly reproduces 100% of prior testID/accessible-name/press-callback
behavior with no duplication, no double-wrapping, and a sound generic-preserving cast. Test/story
coverage for the molecule is equivalent, not degraded; the organism's own test suite still verifies
item-bound press semantics end-to-end. Zero new findings at any severity introduced by this fix.

---

## Full review — post-rewrite (Context/useReducer split, Add-dialog, real ApiKeySettingsScreen consumer)

**Commit/tree reviewed:** working tree at `feat/card-list-with-abm-dialog` HEAD (branch based cleanly
off `feature-entrega3-HernanLaura`, no divergence), i.e. `git diff feature-entrega3-HernanLaura..HEAD`
plus the uncommitted Mini-gate-3 CI-red fix-round delta (all present in the tree as reviewed).
**CI:** green @ current worktree HEAD, taken as given per protocol (`pnpm lint`/`check-types` clean
repo-wide; `pnpm test` re-run fresh per touched package, all green, `@helsoft/components` repeated
5x/0 flakes; feature e2e re-run serialized, 5/5 passed) — not re-run by this reviewer.
**First real review of:** the architecture split (header atom / list organism / dialog molecule /
row-adapter / Context+`useReducer`), the Add-dialog feature, `errorMessage`/`submitDisabled`, and
the real `ApiKeySettingsScreen` consumer wiring. Prior Round 1/Round 2/mini-gate sections above are
**not** re-litigated.

### Verdict: CHANGES_REQUESTED

Two `[arch] major` findings on the new sub-component decomposition and a fragile, non-deterministic
timing design in the Mini-gate-3 fix (finding (a) below) are enough to withhold approval this round.
No blocker (no exposed secret, no exploitable injection). One item is explicitly **flagged for
human sign-off, not accepted/rejected by this reviewer** — see "(c)" below.

### Findings

1. **[arch] major** — `libs/components/src/atoms/card-list-with-abm-dialog-header/card-list-with-abm-dialog-header.tsx:3,15`,
   `libs/components/src/organisms/card-list-with-abm-dialog-list/card-list-with-abm-dialog-list.tsx:6-9,26`,
   `libs/components/src/molecules/card-list-with-abm-dialog-dialog/card-list-with-abm-dialog-dialog.tsx:7-12,47-48`.
   The three components extracted into this rewrite's shared `atoms/`, `molecules/`, `organisms/`
   top-level folders are not actually decoupled: all three import
   `useCardListWithABMDialogContext` directly from the composition-root organism's *private*
   `organisms/card-list-with-abm-dialog/hooks/` folder, and the List organism additionally imports
   `CardListItem`/`CARD_LIST_WITH_ABM_DIALOG_LIST_TEST_ID` from that organism's `.types.ts` and the
   organism's own private `components/card-list-row-adapter.tsx`. None of the three renders without
   the full `CardListWithABMDialogProvider` tree mounted above it, and none is exported from its
   layer's barrel (`atoms/index.ts`, `molecules/index.ts`, `organisms/index.ts` — contrast with
   `error-banner` and `card-list-row`, the other two extractions from this same rewrite, both of
   which *are* barrel-exported per `global.mdc`'s "each layer exports through its index.ts barrel").
   This is the identical reverse-dependency anti-pattern already caught and fixed once in this same
   feature (`tdd.md`'s "Mini-gate review fix — flatten CardListRowProps (drop organism-type
   import)": "molecule imported `CardListItem<TItem>` from the organism it was extracted out of —
   reverse dependency, didn't match `pdf-document-list-item`'s flat precedent") — the fix was
   applied to `CardListRow` only, not to the header/list/dialog. Concretely: `atomic-design.mdc`
   defines an atom as "no business logic... no awareness of where it sits on a page," but
   `CardListWithABMDialogHeader` is generic over `<TItem>` and cannot render without one specific
   organism's Context — it is not an atom by this repo's own definition, it's a private, organism-
   specific sub-component that happens to live in the shared `atoms/` folder. Either genuinely
   flatten these three (mirror the `CardListRowAdapter` fix: accept plain props, no Context import)
   and barrel-export them, or move them into the organism's own private subfolder (e.g.
   `organisms/card-list-with-abm-dialog/{atoms,molecules}/...`) so their placement stops implying
   independent reusability that doesn't exist.

2. **[arch] major** — `libs/components/tsconfig.json:6-12`. The new `include` array adds 5 explicit
   file paths under `../study-buddy/src/components/api-key-settings-screen/...` to
   `@helsoft/components`'s TypeScript project — backwards dependency direction (a shared UI lib has
   no legitimate reason to type-check a feature app lib's files; no other lib in the repo does
   this — checked every `libs/*/tsconfig.json`). Worse: all 5 paths
   (`api-key-manager.types.ts`, `use-api-key-manager.reducer.ts`/`.test.ts`, `use-api-key-manager.ts`/
   `.test.ts`) are now **stale/nonexistent** — the real files were moved into a `hooks/` subfolder
   during this same rewrite (`libs/study-buddy/src/components/api-key-settings-screen/hooks/use-api-key-manager.ts`
   etc.), and `tsc`'s `include` silently no-ops on a missing path rather than erroring, so this
   passed `check-types` clean while type-checking nothing. Dead, misleading config — remove it (or,
   if there was a real reason for it, fix the paths and explain the reason in a comment; as-is it
   looks like leftover iteration cruft). `libs/study-buddy/tsconfig.json:6-9`'s equivalent addition
   (`../services/src/helpers/ai-providers.helpers.ts`, `../hooks/src/hooks/use-api-key.helpers.ts`)
   points at real, existing files, but neither is actually imported by relative path from anywhere
   in `@helsoft/study-buddy` (grepped — zero hits beyond a code comment mentioning the filename) and
   the same "no other lib does this" observation applies — **[code] minor** on that half, kept
   separate from the `@helsoft/components` half above because it isn't also dead/backwards.

3. **[arch]/[code] major, fragile design — see explicit answer to (a) below** —
   `libs/components/src/organisms/card-list-with-abm-dialog/hooks/use-card-list-with-abm-dialog.ts:30,163-198`.
   `SUBMIT_WITHOUT_ASYNC_SIGNAL_GRACE_MS = 50` wall-clock timer used to disambiguate a caller whose
   `isSubmitting` will genuinely flip true shortly after submit from one that never touches it.
   Not a blocker (analysis below concludes it happens to be safe today), but flagged major because
   the safety is an accident of two libraries' current internal implementation details, not a
   structural guarantee, and nothing in the test suite exercises the real race window (see (a)).

4. **[arch] major — see explicit answer to (b) below** —
   `libs/components/src/organisms/card-list-with-abm-dialog/hooks/use-card-list-with-abm-dialog.ts:97,131-135,153-155`.
   `prevDialogRef`/the `default:` branch of the `dialog` `useMemo`/the effect that populates
   `prevDialogRef.current` are dead code after the Mini-gate-3 reducer change (`submit` no longer
   nulls `dialogType`). Confirmed by reading `use-card-list-with-abm-dialog.reducer.ts:32-47` in
   full: no action other than the initial `cardListWithABMDialogInitialState` ever produces
   `dialogType: null` — `open-add`/`open-edit`/`open-remove` set a real type, `submit`/`close`/
   `default` all spread `...state` (preserving whatever `dialogType` already was). The `switch`'s
   `default` branch (keyed on `state.dialogType`) is therefore only reachable while `dialogType` is
   still `null`, i.e. only before the very first `open-*` dispatch of the component's lifetime — and
   at that exact point `prevDialogRef.current` can only ever be `null` too (nothing populates it
   before the effect's first run, which happens after the first render, by which time `dialogType`
   is already non-null if any dialog was ever opened, and `EMPTY_DIALOG_RESPONSE` otherwise if not).
   `useCardListWithABMDialog.test.ts:42-54` ("starts closed with no dialog type or item") confirms
   this: no test anywhere drives `dialogType` back to `null` after it's first set, because no code
   path can. Simplify: `default: return EMPTY_DIALOG_RESPONSE;`, delete `prevDialogRef` (line 97)
   and the effect that maintains it (lines 153-155). Leaving this in place burdens the upcoming
   mutation-testing gate with unreachable branches that no test can meaningfully kill (guaranteed
   surviving mutants on dead code) and misleads future readers into thinking "keep last content on
   an unknown dialogType" is still a real behavior this component has.

5. **[code] minor** — `libs/components/src/organisms/card-list-with-abm-dialog/hooks/card-list-with-abm-dialog.context.types.tsx`.
   Filename violates `types.mdc`/`component-split.mdc`'s explicit "no JSX → `.ts`, not `.tsx`" rule —
   the file's contents (read in full) contain zero JSX, only `import type { ReactNode }` and plain
   type declarations. Should be `card-list-with-abm-dialog.context.types.ts`.

6. **[code] minor** — `libs/components/src/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.types.ts:36-42`.
   `CARD_LIST_WITH_ABM_DIALOG_LIST_TEST_ID`/`cardListItemCardTestId`/`cardListItemEditTestId`/
   `cardListItemRemoveTestId` are runtime constants/functions living in a `.types.ts` file —
   `types.mdc`: "No runtime logic — types files are type-only; pure transforms go in helpers /
   services." Checked every other `*.types.ts` in `libs/components/src` (grep) — this is the only
   file in the lib that does this; not an established repo pattern being re-litigated. Low severity
   (no behavior risk), but move these to a `.helpers.ts` (or inline in the `.tsx`) alongside the
   type file.

7. **[arch]/[code] major, out-of-scope drive-by change** —
   `libs/components/src/molecules/text-field/text-field.tsx:85,135-158`. `TextField` — a widely
   shared, multi-consumer molecule with no relation to this feature's stated scope
   (`card-list-with-abm-dialog` / `api-key-settings-screen`) — had its focus-state border thickness
   removed as an apparent drive-by: `borderBottomWidth: focus ? 2 : 1` / `borderWidth: focus ? 2 : 1`
   (both `filled` and `outlined` variants) collapsed to an unconditional `1`, while the `focus`
   state itself (and its still-live `accent`/`borderColor` color-swap effect) is untouched. Confirmed
   via `git show feature-entrega3-HernanLaura:...text-field.tsx` that the removed conditional
   existed on the delivery branch. No test in `text-field.test.tsx` asserted this before or covers
   its removal now (the file isn't even part of this diff), and no comment explains the rationale.
   This is the same risk class the repo's own "Atom ban" rule exists to prevent (a shared
   component's behavior silently changed by a story that doesn't own it) even though `TextField`
   technically sits in `molecules/`, not the rule's literal `atoms/**` scope — every other screen in
   the app using `outlined`/`filled` `TextField` silently loses the on-focus border-thickening
   affordance. Revert this hunk (or split it into its own reviewed change with its own rationale/
   test) — it does not belong in this feature's diff.

8. **[security] minor — OWASP A08 (Software/Data Integrity) / unvalidated redirect-adjacent sink** —
   `libs/study-buddy/src/components/api-key-settings-screen/add-api-key.tsx:77-80`. `guidanceUrls[formProvider]`
   (server-supplied `AiProviderCatalogEntry.guidanceUrl`, read via Supabase in
   `use-ai-providers.ts`/`ai-providers.helpers.ts`) is passed straight to `Linking.openURL(url)` with
   no scheme/host validation before opening (only a `.catch(() => {})` on failure). Likelihood is low
   (catalog rows are presumably admin-managed, not end-user input), but there is no defense-in-depth
   check that `url` is `https:`/`http:` before handing it to the platform's link opener — a
   compromised or misconfigured catalog row could carry a non-http(s) scheme. Recommend validating
   the scheme (or reusing an existing safe-URL helper if one exists in the repo) before `Linking.openURL`.

9. **[code] minor** — swallowed error, no signal to the user or logs:
   `add-api-key.tsx:79` (`Linking.openURL(url).catch(() => {})`) silently drops a failed link-open
   with no user-facing feedback and no log — low severity, but worth a `// biome-ignore`-style
   comment or at minimum surfacing to the caller if this is intentional.

### Lenses checked, no (new) findings

- **Code quality/TDD** — every `@s1`–`@s27` maps to ≥1 concrete test per `gherkin-scenarios.md`/
  `tdd.md`'s `@s → test` tables; spot-checked `@s21`–`@s27` directly against
  `card-list-with-abm-dialog.test.tsx` (confirmed present, correctly tagged — no repeat of the
  earlier `@s17`/`@s21` traceability collision `spec.md` documents as already fixed). TDD-by-file-type
  respected: the two non-UI `.ts` files touched by the Mini-gate-3 fix
  (`use-card-list-with-abm-dialog.ts`, `.reducer.ts`) have Red→Green evidence in `tdd.md`'s "Mini-gate
  3 CI-red fix" entry and their added production code (the ref-gated effect, the reducer's `submit`
  change) is directly demanded by the new reducer/hook tests — no scope inflation. UI `.tsx` files
  (implementation-first) each have `.test.tsx`/`.stories.tsx`; interaction `.e2e.js` re-checked for
  `e2e.mdc` compliance — all 5 assertions are genuine interactions (button clicks, scrim taps,
  Escape), no render-only presence checks. No `console.log`/debug leftovers, no bare TODOs (grepped
  the full primary + secondary scope). i18n: no hardcoded user-facing strings in production code
  (`error-banner.tsx`, `card-list-with-abm-dialog-dialog.tsx`, `api-key-settings-screen.tsx` all use
  inline `t('ns.key', ...)`; `en.ts`'s new `general.cancel`/`delete`/`close`/`disabled` keys are a
  flat key dictionary of raw strings, not a `labels`/pre-resolved-`t()` collection — compliant).
- **Architecture/layering (data layer)** — `Component → Hook → Service → DAO` respected for the real
  consumer: `api-key-settings-screen.tsx` only imports `useApiKeySettings`/`useApiKeyManager` (both
  hooks), never a DAO or `@helsoft/supabase-services` directly. `useApiKey()` (`@helsoft/hooks`)
  correctly wraps `ApiKeyService` via `@tanstack/react-query`'s `useMutation`/`useQuery` per
  `tanstack-query.mdc` — no raw `fetch`, no service bypass. `SavedProviderKey`
  (`libs/types/src/api-key.ts`) is compile-time shape-locked to `provider`/`updatedAt` only (a
  dedicated `AssertExactKeys` test asserts this) — no raw key material ever reaches this component
  tree, confirmed by reading `api-key-settings-screen-item.tsx`'s `mapSavedKeysToItems` in full.
  `use-api-key-manager.ts`'s render-phase `dispatch` (a ref-guarded conditional dispatch during
  render, not inside a `useEffect`) is a deliberate, commented React 18-recommended pattern
  ("adjusting state during rendering"), not a `state.mdc`/`hooks-service-dao.mdc` violation.
- **Performance** — `FlatList` still used for the row list (not `.map()`); `CardListRowAdapter` is
  `memo`'d with `useCallback`'d press-handler call-throughs, closing out Round 1's [perf] minor
  finding. Context value (`CardListWithABMDialogValue<TItem>`) is the raw destructured `props`
  object passed straight through from `CardListWithABMDialog` with no extra `useMemo` wrapper —
  acceptable per `state-sharing.mdc`'s "do not add `useMemo` by default" and `global.mdc`; the
  Provider only re-renders its subtree when the caller's own props object identity changes (i.e. on
  the caller's own re-renders), which the caller already controls via `useCallback`'d render-prop
  functions (`renderForm`, `renderRemoveConfirmation` in `api-key-settings-screen.tsx`) and a
  memoized `items` array. No N+1/redundant Supabase round-trips: `useApiKey`/`useAiProviders` are
  each a single cached `useQuery`, mutations `gcTime: 0` reset the sibling mutation on success (no
  extra round-trip, just local cache hygiene). No unbounded lists, no heavy synchronous work.
- **Security** — no secrets/keys/tokens in code or logs (grepped primary + secondary scope for
  `secret|apikey|api_key|token|password|service_role|EXPO_PUBLIC` — no matches beyond the expected
  `AiProvider`/`ApiKey*` type/variable names, never a literal credential). No `supabase/` schema/RLS/
  edge-function changes in this diff (out of scope per spec.md's own non-goal, confirmed no changes
  under `libs/supabase-services` or `supabase/`). Session-scoped queries (`apiKeyStatusQueryKey(sessionUserId)`)
  correctly namespace by user id — no cross-user leak. No PII in any log/analytics payload (no
  logging code paths added anywhere in the diff). No new dependencies added without cause (`pnpm-lock.yaml`'s
  3-line diff is a transitive bump, not a new direct dependency).

### (a) Explicit answer — `SUBMIT_WITHOUT_ASYNC_SIGNAL_GRACE_MS` race-avoidance timer

**Fragile, yes — but demonstrably safe *today* by accident of implementation details, not by
contract.** Traced the real consumer end to end: `api-key-settings-screen.tsx:132` feeds
`isSubmitting={settings.isSubmitting}` straight from `useApiKeySettings` →
`useApiKey()` (`libs/hooks/src/hooks/use-api-key.ts:78`) → raw
`saveMutation.isPending || removeMutation.isPending` from `@tanstack/react-query`'s `useMutation` —
**not** through `use-api-key-manager.ts`'s own `dialogIsSubmitting` sticky flag (that flag is real
and deliberately sticky-through-settle, per its own doc comment, but it's only wired to
`submitDisabled`, a *different* prop, at `api-key-settings-screen.tsx:110-112` — it never reaches the
organism's `isSubmitting` prop at all, so it provides zero protection against this specific race).
The actual call chain on submit: `CardListWithABMDialogDialog`'s `onConfirm` → `use-card-list-with-abm-dialog.ts`'s
`onSubmit` closure → synchronously `dispatch({type:'submit'})` then `onEditSubmit?.()` →
`handleSave()` → `settings.saveApiKey(...)` → `saveMutation.mutate(...)`. Because all of this runs
inside one React event-handler call stack, and TanStack Query v5's `mutate()` synchronously dispatches
its `'pending'` state (before the async `mutationFn` ever runs) which its `useSyncExternalStore`-based
subscription flushes as part of the same React 18 auto-batched update, the very next render after
pressing Save already carries **both** `dialogState === 'submitting'` **and** `isSubmitting === true`
together — so the grace-tick branch (`isSubmitting` false) is never actually entered for this real
consumer's synchronous-dispatch path, and the 50ms timer never fires for a genuine in-flight mutation.
That said: this is an assumption about two independent libraries' *current* internal scheduling
behavior (React 18's auto-batching scope, and `@tanstack/react-query`'s synchronous-pending-dispatch
implementation detail), not a documented contract either library promises to keep. Nothing in the
test suite exercises the actual race window with a real, slow-resolving `Promise` (the hook's own
tests use `jest.useFakeTimers()` + explicit `rerender` with pre-set `isSubmitting` values, and the
organism's own tests never simulate a delayed mutation) — so a future refactor that moves
`saveApiKey`'s call site out of the synchronous submit-handler stack (e.g. into a `.then()`, an
`await` before calling it, a `startTransition`, or a library upgrade that defers the pending dispatch
to a microtask) could silently reintroduce "dialog closes while a real mutation is still in flight,"
and no test in this suite would catch it. A more deterministic design that doesn't depend on
wall-clock racing two independent schedulers: have `onSubmit` (the render-prop return value) be able
to return a `Promise<void> | void` and let the hook `await` it directly to decide when to close,
rather than inferring intent from whether `isSubmitting` ever moves within a fixed window; or require
synchronous/no-op callers to call an exposed `closeDialog()` themselves instead of the hook guessing.
Recommend documenting this as an accepted risk with the trace above, or adopting a deterministic
alternative — not a blocker given the trace shows it's safe today, but should not be considered a
closed question.

### (b) Explicit answer — `prevDialogRef`/`default` branch after `submit` stopped nulling `dialogType`

**Yes, dead/unreachable complexity — confirmed, not merely suspected.** See finding 4 above for the
full trace: `dialogType` can only be `null` in the reducer's `cardListWithABMDialogInitialState`;
every action that runs afterward (`open-add`/`open-edit`/`open-remove` set a concrete type,
`submit`/`close`/the reducer's own `default` all spread `...state`) preserves whatever `dialogType`
already was, so the `dialog` `useMemo`'s `default:` branch is only reachable pre-first-open, at which
point `prevDialogRef.current` is provably always `null` too. This should be simplified to
`default: return EMPTY_DIALOG_RESPONSE;` with `prevDialogRef` and its populating effect deleted.

### (c) Flagged for explicit human sign-off — `@s13` rewrite (not accepted/rejected by this reviewer)

**On pure engineering merit, the rewritten `@s13` text is internally consistent with the current
code, hook/component tests, and `tdd.md`** — verified directly:
`card-list-with-abm-dialog.test.tsx:629-653` ("closes the dialog (does not restore the form) once
isSubmitting returns to false") asserts exactly the new contract (`Edit card`'s `open` prop flips to
`false`, no form/confirmation content, no Save/Cancel buttons) with the dialog genuinely opened first
(not just a text-content check), and `use-card-list-with-abm-dialog.test.ts:227-275`'s two
"exiting the submitting state" tests cover both the synchronous/no-op path (grace-timer close) and
the genuine-async path (immediate close on true→false) that the new `@s13` text explicitly calls out.
`tdd.md`'s own `@s → test` table and "Mini-gate 3" narrative match. One stale reference found:
`dod.md:36` still says "@s13 isSubmitting false restores form" with a now-inaccurate line citation —
but `dod.md` is already explicitly marked `STALE`/`not currently pr_ready` at its own top and is
fully superseded by a future `dod_validator` pass, so this is not a fresh inconsistency introduced by
this rewrite, just an artifact of the DoD doc not yet having been redone. **This reviewer is not
authorized to approve or reject the `@s13` acceptance-criterion change itself** (per protocol, spec
changes require the human, not a reviewer) — surfacing distinctly here so `reviews_lead` escalates it:
the implementer changed a previously human-approved Gherkin scenario unilaterally (self-flagged in
`tdd.md`, not human-approved) to resolve a genuine contradiction between the old text and the
already-shipped, already-tested code/consumer behavior. The new text is technically sound and
consistent with the codebase; the *process* gap (no human sign-off yet) is real and separate from
that technical soundness.

---

## Full review — Round 2 (fix-delta verification, Mini-gate 3)

**Commit reviewed (delta only):** `git diff 8a6a3afab d9cd6f40c` — `implementer`'s single fix commit
`fix(card-list-with-abm-dialog): resolve full-review round 1 findings (9/9)`, on top of the Round-1
HEAD (`8a6a3afab`, the `@s13` human-sign-off ratification commit) reviewed in "Full review — Round 1
(post-CI-fix)" above. Per protocol this is a scoped delta review, not a full re-review — Round 1's
9 findings are the only subject; the bundled, already-reviewed CI-red-round code (grace-timer
mechanism shape, reducer `submit` preserving `dialogType`/`dialogItem`, `onAddPress` wiring) is
checked only for silent regression, not re-litigated on its own merits.

**CI:** green @ `d9cd6f40c`, confirmed independently by `reviews_lead` (lint/check-types/test for
`@helsoft/components` + `@helsoft/study-buddy`, plus this feature's Playwright e2e) — not re-run by
this reviewer.

### Verdict: APPROVED

All 9 Round-1 findings confirmed genuinely resolved. No new finding, any severity, introduced by the
fix delta itself. `@s13` human-sign-off item ((c) above) is out of scope for this round (already
handled by `8a6a3afab`'s ratification commit, which precedes this delta) and is not re-opened here.

### Findings — resolution verification

1. **[arch] major — `resolved`, verified.** `git diff 8a6a3afab d9cd6f40c --stat` shows the header/
   list/dialog components (plus `.stories.tsx`/`.test.tsx`) `rename`'d from the shared
   `atoms/card-list-with-abm-dialog-header/`, `molecules/card-list-with-abm-dialog-dialog/`,
   `organisms/card-list-with-abm-dialog-list/` into
   `organisms/card-list-with-abm-dialog/components/{header,list,dialog}/`. Verified every relative
   import inside the moved files resolves correctly at the new depth (spot-checked
   `components/header/card-list-with-abm-dialog-header.tsx:3-4` → `../../../../atoms/button/button`
   and `../../hooks/card-list-with-abm-dialog.context`; `components/dialog/card-list-with-abm-dialog-dialog.tsx:5-8`
   → `../../../../atoms`, `../../../../molecules/submitting-indicator/submitting-indicator`,
   `../../../dialog/dialog`, `../../card-list-with-abm-dialog.types` — all targets exist on disk).
   Repo-wide grep for the three old paths (`atoms/card-list-with-abm-dialog-header`,
   `molecules/card-list-with-abm-dialog-dialog`, `organisms/card-list-with-abm-dialog-list`) across
   `libs`/`apps`: **zero hits** — no stale importer anywhere. Storybook titles updated correctly:
   `components/header/card-list-with-abm-dialog-header.stories.tsx:47` →
   `'Organisms/CardListWithABMDialog/Header'`, `components/list/...stories.tsx:76` → `.../List`,
   `components/dialog/...stories.tsx:53` → `.../Dialog`. None of the three is barrel-exported before
   or after (`organisms/index.ts` still only exports the composition-root
   `card-list-with-abm-dialog`/`.types`) — consistent with the fix's own stated intent (private
   sub-components, not independently reusable). Old top-level directories confirmed deleted
   (`ls libs/components/src/{atoms,molecules,organisms}/card-list-with-abm-dialog*` → empty for the
   three old names).

2. **[arch] major (+ [code] minor companion) — `resolved`, verified.** `libs/components/tsconfig.json`
   and `libs/study-buddy/tsconfig.json` both now read `"include": ["src"]` — byte-identical in shape
   to every other lib's tsconfig in the repo (checked all 11: `activities`, `components`, `hooks`,
   `js-utils`, `lib-with-storybook`, `localization`, `logging-in-out`, `pdf-upload-extraction`,
   `rn-utils`, `services`, `study-buddy` — all `["src"]`, `lib-with-storybook` the sole justified
   exception with `.storybook` added). The stale/backwards 5-path and 2-path additions are fully
   gone, no partial leftover.

3. **[arch]/[code] major, fragile design — `resolved` via documented fallback, verified.** Traced
   `use-card-list-with-abm-dialog.ts:30-45`'s expanded doc comment on
   `SUBMIT_WITHOUT_ASYNC_SIGNAL_GRACE_MS`: it explicitly states the accepted-risk trace (React 18
   auto-batch + TanStack Query v5 synchronous-pending-dispatch making the timer a no-op for the real
   consumer today, not a contract). Verified the two new tests in
   `use-card-list-with-abm-dialog.test.ts:227-320` genuinely exercise real elapsed time via
   `jest.advanceTimersByTime` (not a synchronous `runOnlyPendingTimers` flush):
   - `'does not close before the grace period genuinely elapses'` (:279-296) — advances 49ms,
     asserts `dialogState === 'submitting'`; advances 1 more ms (total 50), asserts
     `dialogState === 'closed'` — a genuine boundary test, not trivial.
   - `'does not let a genuinely-delayed async submit be mistaken for a synchronous one'`
     (:302-330) — advances 30ms (within the 50ms window), flips `dynamicIsSubmitting` true,
     asserts still `'submitting'`; advances 200 more ms (well past the original window) and asserts
     it is **still** `'submitting'` (proving the stale grace timeout was actually canceled by the
     effect's cleanup, not merely masked); only closes once `isSubmitting` is set back to `false`.
     This is a meaningful race-window test, not a restatement of the trivial case.
   Traced the effect's logic (`use-card-list-with-abm-dialog.ts:176-210`) by hand against both new
   tests plus the two pre-existing ones (immediate-close-on-genuine-async, eventually-closes-on-its-
   own) — the `wasReallySubmittingRef` gate + dependency array (`[state.dialogState, isSubmitting,
   closeDialog]`) correctly re-arms/cancels the timer on every relevant transition; no gap found.

4. **[arch] major — `resolved`, verified.** `use-card-list-with-abm-dialog.ts:144-150`'s `default:`
   branch now reads `return EMPTY_DIALOG_RESPONSE;` with an explanatory comment; `prevDialogRef`
   (former line 97) and its populating effect (former lines 153-155) are both deleted — confirmed
   via the diff hunk (no `React.useRef<DialogResponse>` left, no `prevDialogRef.current =` effect
   left). Repo-wide grep for `prevDialogRef`: only one hit, a comment in
   `use-card-list-with-abm-dialog.reducer.test.ts:68` explaining the *old* behavior for context — not
   live code.

5. **[arch]/[code] major, out-of-scope drive-by regression — `resolved`, verified byte-identical.**
   `git diff feature-entrega3-HernanLaura -- libs/components/src/molecules/text-field/text-field.tsx`
   at `d9cd6f40c` → **empty output**, confirming the file is byte-for-byte identical to the delivery
   branch's version (the conditional `borderBottomWidth: focus ? 2 : 1` / `borderWidth: focus ? 2 :
   1` on both `filled`/`outlined` variants is restored, `focus` correctly re-threaded into
   `styles.field(...)`'s call site at line 84). Full revert, not partial.

6. **[code] minor — `resolved`, verified.** `git diff --stat` shows a pure `rename` (100% similarity)
   from `card-list-with-abm-dialog.context.types.tsx` to `.context.types.ts` — zero content diff, no
   importer needed updating (every importer already omits the extension), `check-types` unaffected.

7. **[code] minor — `resolved`, verified.** New `card-list-with-abm-dialog.helpers.ts` holds all 4
   moved exports (`CARD_LIST_WITH_ABM_DIALOG_LIST_TEST_ID`, `cardListItemCardTestId`,
   `cardListItemEditTestId`, `cardListItemRemoveTestId`); `card-list-with-abm-dialog.types.ts:32-42`
   no longer has them. Every consumer's import switched to `.helpers` (organism test, row-adapter +
   its test, the moved list component + its test) — confirmed via the diff, no straggler still
   importing the constants from `.types`.

8. **[security] minor — OWASP A08-adjacent — `resolved`, verified TDD.**
   `add-api-key.helpers.ts`'s `isSafeExternalUrl()` (scheme-prefix regex `^https?:\/\//i`) is
   test-first in `add-api-key.helpers.test.ts` (7 cases — http/https/uppercase accepted;
   javascript:/data:/protocol-less/empty rejected). Wired into `add-api-key.tsx:79-84` as an
   early-return guard (`if (!url || !isSafeExternalUrl(url)) return;`) strictly before
   `Linking.openURL(url)` — no path where an unsafe scheme reaches the platform link-opener. New
   `add-api-key.test.tsx` case (`'does not open the guidance url when it uses a non-http(s)
   scheme'`) asserts `openURL` is never called for a `javascript:` guidance url — genuine, not a
   tautology (uses a real mocked `Linking.openURL` spy).

9. **[code] minor — `resolved`, verified.** `add-api-key.tsx:80-83` now carries an explanatory
   comment directly above the `.catch(() => {})`, recording the intentional best-effort no-op
   rationale (no actionable recovery surface on this screen, OS surfaces its own error UI). No
   behavior change; existing assertions in `add-api-key.test.tsx` pass unmodified.

### New findings introduced by the fix delta itself

**None, at any severity, across all four lenses.**

- **Code quality/TDD** — no `console.log`/`debugger`/bare `TODO` in any file touched by this delta
  (grepped). The two non-UI `.ts` production changes demanded by this delta
  (`use-card-list-with-abm-dialog.ts`'s exit-effect doc/timer shape, `.reducer.ts`'s comment) are
  directly covered by pre-existing/updated tests — no scope inflation. UI file moves (`.tsx`) kept
  their `.test.tsx`/`.stories.tsx` 1:1, updated only for new import paths.
- **Architecture/layering** — the move (finding 1) is a pure relocation, not a new cross-layer
  leak: the header/list/dialog still only import the organism's own private Context hook/types
  (never a DAO/service), same reverse-dependency shape they had before, just now honestly scoped to
  a private subfolder instead of misleadingly living in the shared `atoms/`/`molecules/`/`organisms/`
  top-level folders. `tsconfig.json` reduction (finding 2) removes a backwards dependency,
  introduces nothing new. Dead-code removal (finding 4) is subtractive only.
- **Performance** — no new render/list/allocation concerns; the exit-effect's added
  `wasReallySubmittingRef` is a single `useRef`, no extra render triggered by it; the effect's
  `setTimeout`/`clearTimeout` pairing is correctly cleaned up on every dependency change (verified
  above under finding 3) — no leaked timers.
- **Security** — `isSafeExternalUrl()` (finding 8) is a pure, side-effect-free regex check — no new
  attack surface. No secrets, no new logging, no new dependency (this delta touches zero
  `package.json`/lockfile).

**`review_round` should increment accordingly in `tasks.md`** — the durable trail above (Round 1's 9
findings) all confirmed `resolved`; this feature's Mini-gate 3 cycle is now clean at the engineering
lens with zero open findings (the `@s13` human-sign-off item remains tracked separately per (c)
above, already handled by the preceding ratification commit `8a6a3afab`, outside this delta's scope).
