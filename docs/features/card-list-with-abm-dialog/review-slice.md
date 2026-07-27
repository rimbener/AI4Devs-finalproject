# Slice review — card-list-with-abm-dialog

Durable trail across slices/rounds. Never emptied; append new entries per slice.

---

## Slice 1 (task-1) — Render titled card list with disabled/show flags and empty state

**Commit range reviewed:** `b06c8a63b..e96edf3df` (branch `feat/card-list-with-abm-dialog`)
**Scope:** `libs/components/src/organisms/card-list-with-abm-dialog/{card-list-with-abm-dialog.tsx,.types.ts,.stories.tsx,.test.tsx}`, `libs/components/tests/e2e/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.e2e.js`, `libs/components/src/organisms/index.ts`. Covers `@s1, @s2, @s3, @s4, @s15, @s16, @s17` only — dialog wiring (`@s5`–`@s14`) is out of scope for this slice per task-1.md/task-2/3, not flagged.

**Round:** 1 (only round)

### Verdict: CHANGES_REQUESTED

### Findings

1. **[a11y] `resolved`** — Fix: each edit/remove `IconButton` now receives `accessibilityLabel={item.accessibleLabel}` as the interim accessible name (card-list-with-abm-dialog.tsx); asserted in a new unit test. task-2/3's `getEditAccessibilityLabel`/`getRemoveAccessibilityLabel` builder props will supersede this single prop, not add a competing one. Per-card edit/remove `IconButton`s render with no `accessibilityLabel`, at `libs/components/src/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.tsx:84` and `:89` (`<IconButton icon="edit" size={layout.touchTarget} disabled={item.disabled} />` / `icon="delete"` — no `accessibilityLabel` prop passed). `IconButton` unconditionally sets `accessibilityRole="button"` on its underlying `Pressable` regardless of whether `onPress`/`accessibilityLabel` are supplied (`libs/components/src/atoms/icon-button/icon-button.tsx`), so this slice exposes a focusable, nameless "button" to assistive tech — a WCAG 4.1.2 (Name, Role, Value) violation, and inconsistent with the sibling row molecule `pdf-document-list-item.tsx:71-77`, which always supplies `accessibilityLabel` on its `IconButton`. This is not the same gap as the deferred *dialog wiring* (`onPress`, `getEditAccessibilityLabel`/`getRemoveAccessibilityLabel` builder props land in task-2/3, correctly out of scope) — the row's `CardListItem<TItem>` already carries an `accessibleLabel` field this slice (`card-list-with-abm-dialog.types.ts:8`), so an interim, non-final accessible name (e.g. derived from `item.accessibleLabel`) is available now and should be wired before this slice closes, even though the per-action builder-function label replaces it in task-2/3.

2. **[a11y] `resolved`** — Fix: added `accessibilityRole="header"` to the title `Text` (card-list-with-abm-dialog.tsx), matching `tabs-header.tsx`/`language-settings.tsx`; asserted via `screen.getByRole('header', { name: ... })` in a new unit test. The list title (`card-list-with-abm-dialog.tsx:46`, `<Text style={styles.title}>{title}</Text>`) has no `accessibilityRole="header"`, so it is not exposed as a navigable heading to screen-reader users (reading/heading-navigation order). Two sibling components in the same lib mark their equivalent section title the same way this component's header row is structured (title + trailing action): `libs/components/src/molecules/tabs-header/tabs-header.tsx:12` and `libs/components/src/organisms/language-settings/language-settings.tsx:21` both use `accessibilityRole="header"` on their title `Text`. This component should match that established pattern.

### Rules/lenses checked, no findings

- `global.mdc` — kebab-case paths, functional component, `Props` type (`CardListWithABMDialogProps<TItem>`), no Redux, no exported styles, single component export per file, barrel export added (`organisms/index.ts:11-12`), no hardcoded user-facing strings (all chrome via props per spec.md's documented decision to skip internal `t()` for this domain-agnostic organism).
- `atomic-design.mdc` — correct organism placement (`libs/components/src/organisms/`), composes existing atoms (`Card`, `Button`, `IconButton`) with no ad hoc tokens; `.stories.tsx` present covering this slice's applicable states (Populated / EmptyWithMessage / EmptyWithoutMessage / DisabledCard / EditOnlyCard / RemoveOnlyCard / Interactive).
- `component-split.mdc` — no local state this slice (no dialog yet) so no `use-card-list-with-abm-dialog.ts` is correctly absent; types isolated to `.types.ts`; no pure-logic helpers needed yet.
- `state.mdc` / `state-sharing.mdc` — N/A, no local state or cross-subtree sharing introduced.
- `hooks-service-dao.mdc` / `tanstack-query.mdc` — N/A, pure presentational organism, no data layer touched.
- `types.mdc` — `card-list-with-abm-dialog.types.ts` holds only exported types, no runtime logic.
- `i18n.mdc` — no hardcoded strings; `title`/`addButtonLabel`/`emptyStateMessage` are caller-supplied props per spec.md's explicit, human-approved rationale (domain-agnostic organism, no baked-in `t()` keys).
- `e2e.mdc` — `card-list-with-abm-dialog.e2e.js` drives a real interaction (tapping "Add flashcard" in the `Interactive` story) and asserts the resulting state change (tap counter text), not a render-only presence check.
- `tdd.mdc` — UI `.tsx` built implementation-first, in order impl → stories → e2e → unit tests (per `tdd.md`); all four artifacts present; every owned `@s` (`s1,s2,s3,s4,s15,s16,s17`) maps to a concrete test in `card-list-with-abm-dialog.test.tsx` (see `tdd.md`'s `@s → test` table); no hardcoded colors/dimensions — verified `theme.spacing.*`/`theme.colors.*`/`theme.typography.*`/`theme.disabledOpacity`/`layout.touchTarget` used throughout.
- `pre-slice-checklist.mdc` — barrel exports done; helpers stay pure (none needed this slice); atom-ban respected (`IconButton`/`Card` untouched — no diff under `libs/components/src/atoms/`; testID needs solved via local wrapper `View`s instead of atom edits, per `tdd.md`'s documented decision).
- **[design]** — `Card` default `variant="elevated"` (surface-container-low + elevation-1) matches `.agents/DESIGN.md`'s Cards section; card corner radius via `theme.shape.card` (12px) matches; disabled state reuses `theme.disabledOpacity` (0.38) — no new/ad hoc color or radius introduced; spacing/typography all token-based (`theme.spacing.s1`–`s4`, `theme.typography.titleLarge`/`bodyLarge`).
- **Touch targets** — both `IconButton`s sized `layout.touchTarget` (48dp); `Button`'s built-in `hitSlop` already expands to the 48dp token — WCAG 2.5.5 target-size satisfied.
- **Color-only signaling** — disabled state is conveyed by opacity *and* the icon buttons' own `disabled` (`accessibilityState.disabled`) semantics, not color alone (asserted in `card-list-with-abm-dialog.test.tsx`'s disabled-item test).

### Notes for the fix

- Finding 1: minimal remediation is to pass an interim `accessibilityLabel` on each `IconButton` (e.g. built from `item.accessibleLabel`) rather than leaving it unset; task-2/3's `getEditAccessibilityLabel`/`getRemoveAccessibilityLabel` builder props can then override/replace it without re-litigating this slice.
- Finding 2: add `accessibilityRole="header"` to the title `Text` at `card-list-with-abm-dialog.tsx:46`, matching `tabs-header.tsx`/`language-settings.tsx`.

## Slice 2 (task-2) — Wire edit/remove dialogs via the shared Dialog organism

**Commit range reviewed:** `ee8a74834..30204bf69` (branch `feat/card-list-with-abm-dialog`)
**Scope:** `libs/components/src/organisms/card-list-with-abm-dialog/{card-list-with-abm-dialog.tsx,.types.ts,.stories.tsx,.test.tsx,use-card-list-with-abm-dialog.ts,use-card-list-with-abm-dialog.test.ts}`, `libs/components/tests/e2e/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.e2e.js`. Covers `@s5, @s6, @s7, @s8, @s9, @s10` only — `isSubmitting` swap (`@s11`–`@s13`), per-card `getEdit/RemoveAccessibilityLabel` builder props (`@s14`), and the full Storybook state matrix (`@s18`) are explicitly task-3, not flagged here.

**Round:** 1 (only round)

### Verdict: CHANGES_REQUESTED

### Findings

1. **[global] `resolved`** — Unnecessary `useCallback` around `handleEditConfirm`/`handleRemoveConfirm`, violating `global.mdc`'s "Don't add `useCallback` if it's not necessary." At `libs/components/src/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.tsx:66-79`, both handlers are wrapped in `useCallback` and passed only to `Dialog`'s `onConfirm` prop — `Dialog` (`libs/components/src/organisms/dialog/dialog.tsx`) is a plain, unmemoized function component, so memoizing the handler prevents no re-render and serves no purpose. This isn't a style preference: the sibling organism that does the exact same thing (passes a per-row confirm handler to the same `Dialog.onConfirm` prop) uses a plain inline arrow function with **no** `useCallback` — `libs/components/src/organisms/pdf-document-list/pdf-document-list.tsx:105-111` (`onConfirm={() => { const id = pendingDeleteId; setPendingDeleteId(null); if (id) onDelete(id); }}`). Drop the `useCallback` wrapper on both handlers (plain `const handleEditConfirm = () => {...}` bound at render, same as the precedent) — `keyExtractor`/`renderItem`'s `useCallback` are fine as-is (they keep `FlatList`'s virtualization props referentially stable, matching the same `pdf-document-list.tsx` precedent).
   - **Fix:** `handleEditConfirm`/`handleRemoveConfirm` are now plain arrow functions (no `useCallback`), matching `pdf-document-list.tsx`'s precedent; `keyExtractor`/`renderItem` untouched. Re-ran `pnpm --filter @helsoft/components lint check-types test` — all green (512 tests passed).

### Rules/lenses checked, no findings

- `component-split.mdc` — `use-card-list-with-abm-dialog.ts` owns only the discriminated-union state (`dialogState`) + its three setters (`openEditDialog`/`openRemoveDialog`/`closeDialog`); all `onPress`/`onConfirm`/`onClose` wiring and derived callbacks stay in `card-list-with-abm-dialog.tsx` per the split. `CardListDialogState<TItem>` is correctly unexported/hook-private (`types.mdc`).
- `state.mdc` — one `useState<CardListDialogState<TItem>>`, not ≥3 fields → no reducer needed, matches spec.md's documented rationale (rules out an invalid "both dialogs open" state by construction).
- `state-sharing.mdc` — no cross-subtree prop-drilling introduced; state stays one hop (hook → component → `CardListRow`).
- `hooks-service-dao.mdc` / `tanstack-query.mdc` — N/A; `use-card-list-with-abm-dialog.ts` is UI-local interaction state, not a data-layer hook (no service/DAO involved), correctly not wrapped in `useQuery`/`useMutation`.
- `types.mdc` — `card-list-with-abm-dialog.types.ts` only holds the exported `CardListItem<TItem>`/`CardListWithABMDialogProps<TItem>`; the new `renderEditForm`/`onEditSubmit`/etc. props added cleanly; no runtime logic in the types file.
- `atomic-design.mdc` — reuses the shared `Dialog` organism as-is (no atom/organism edited — atom-ban respected); composition stays organism→atoms/organisms, no ad hoc tokens.
- `i18n.mdc` / `global.mdc` (no hardcoded strings) — all dialog chrome (`editDialogTitle`/`editSubmitLabel`/`editCancelLabel`/`removeDialogTitle`/`removeSubmitLabel`/`removeCancelLabel`) is caller-supplied props, never a literal, consistent with spec.md's documented domain-agnostic-organism rationale; literals in `.test.tsx`/`.stories.tsx` are test/demo prop *values*, not library copy.
- `e2e.mdc` — both new e2e tests drive a real interaction (tap edit icon → submit closes it; tap remove icon → cancel closes it without acting) and assert the resulting state change, not render-only presence; correctly located at `libs/components/tests/e2e/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.e2e.js` (mirrors `src/`, not co-located).
- `tdd.mdc` — UI `.tsx` built implementation-first (impl → stories → e2e → unit tests, per `tdd.md`); the co-located `use-card-list-with-abm-dialog.ts` has its own `use-card-list-with-abm-dialog.test.ts` (Red→Green cycles logged in `tdd.md`); every owned `@s` (`s5`–`s10`) maps to a concrete test in `card-list-with-abm-dialog.test.tsx` per `tdd.md`'s `@s → test` table, plus a mutation-resistance test for the discriminated-union invariant (only one dialog open at a time); no hardcoded colors/dimensions in the diff (no new styles added this slice).
- `pre-slice-checklist.mdc` — no new public symbols needing a barrel export (the hook is a private UI-co-location helper, same convention as `use-pdf-document-list.ts`, itself not barrel-exported); no atom edited (`Dialog`/`IconButton` untouched); Modal-backed `Dialog` dismiss (Cancel/scrim/Escape) all route through the same `onClose` prop, correctly wired to `closeDialog` for both dialogs this slice (no `isSubmitting` gating yet, correctly deferred).
- Regression check vs. slice 1's `resolved` findings — the title's `accessibilityRole="header"` (`card-list-with-abm-dialog.tsx`) and each icon's interim `accessibilityLabel={item.accessibleLabel}` are both still present and unchanged by this slice's edits to the same file; not regressed.
- **[a11y]** — Accessible names: dialog headline/submit/cancel text all sourced from the same static props asserted by `@s5`/`@s6` tests (`screen.getByText('Edit card')`/`'Save'`/`'Cancel'` etc.); each dialog's body swaps correctly per item (`renderEditForm(item)`/`renderRemoveConfirmation(item)`), asserted via role/text queries. Keyboard/Escape dismissal: both `Dialog`s receive `onClose={closeDialog}` unconditionally this slice (no `isSubmitting` block yet, correctly matching task-2's scope) — Escape/hardware-back (`Modal`'s `onRequestClose`) and scrim tap route through the identical `onClose` reference exercised by the `Cancel`-button tests (`@s9`/`@s10`), so the wiring is provably correct even though only one of the three dismiss vectors is directly driven in `.test.tsx`. Dialog focus management (trap/return) is owned by the shared, unedited `Dialog` organism (`accessibilityViewIsModal` already set there) — out of this slice's diff, consistent with every other `Dialog` consumer in the lib (e.g. `pdf-document-list.tsx`), not a new regression.
- **[design]** — no new colors/spacing/radii introduced this slice (no style changes in the diff); reuses the existing `Dialog` surface (28px `theme.shape.dialog`, elevation-3) unmodified.

### Notes for the fix

- Finding 1: remove `useCallback` from `handleEditConfirm`/`handleRemoveConfirm` in `card-list-with-abm-dialog.tsx:66-79`; plain arrow functions bound at render, matching `pdf-document-list.tsx`'s `Dialog.onConfirm` precedent.
