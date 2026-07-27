# Full engineering review — card-list-with-abm-dialog

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
