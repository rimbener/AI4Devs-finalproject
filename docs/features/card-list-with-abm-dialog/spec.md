---
feature: card-list-with-abm-dialog
story: user-stories/in-progress/card-list-with-abm-dialog.md   # pending/ → in-progress/ → done/
status: approved
---

# Spec — card-list-with-abm-dialog

## Summary
A reusable `CardListWithABMDialog` organism in `@helsoft/components`: a titled `Card` list with an add button and, per card, optional edit/remove — add/edit/remove all open the **same shared `Dialog`** instance (chrome/body swap by which one is active), so any screen needing add/edit/remove-a-card gets consistent MD3 UI without rebuilding it. The public entry point is still `libs/components/src/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.tsx`, now composed from several extracted sub-components (see Architecture below) rather than one flat file.

## User stories
- As a developer building list-management screens, I want a reusable card-list-with-ABM-dialog organism, so that any screen needing add/edit/remove-a-card-in-a-list gets consistent UI/behavior for free.

## Acceptance criteria
→ **`gherkin-scenarios.md`** — `@s1`–`@s27`. `@s21`–`@s27` were added by this revision to cover the add-dialog flow, cross-dialog mutual exclusivity, the error-banner mode, and `submitDisabled` — all of which exist in code but predate this doc pass (see "Post-hoc documentation pass" below).

## UI states (if UI)
| State | Trigger | Notes |
|---|---|---|
| Populated | `items.length > 0` | one `Card` per item, rendered via `FlatList` (`CardListWithABMDialogList`) |
| Empty (message) | `items.length === 0` + `emptyStateMessage` set | title/add button still render |
| Empty (no message) | `items.length === 0`, no `emptyStateMessage` | nothing renders in place of the list |
| Add dialog open | add button tapped | body = `renderAddForm()`; also fires `onAddPress()` as a separate notification (see Prop surface) |
| Edit dialog open | edit icon tapped | body = `renderEditForm(item)` |
| Remove dialog open | remove icon tapped | body = `renderRemoveConfirmation(item)` |
| Submitting | any dialog's submit pressed | body → `SubmittingIndicator`, actions hidden, dismiss blocked |
| Error | `errorMessage` truthy | the shared dialog forces open (regardless of `dialogType`/`dialogState`) showing `ErrorBanner` + a single "Close" action |

Only one dialog is open at a time — add/edit/remove share **one** `Dialog` instance (not three); opening any one closes whichever other was open (`@s25`).

## Analytics events
None (story explicitly excludes analytics).

## Feature flags
None (story explicitly excludes a flag).

## Out of scope / non-goals
- No `supabase/` schema/RLS/edge-function changes — pure frontend component.
- Not modeled on `api-key-form-dialog` — reuses the generic `Dialog` organism directly, no bespoke dialog wrapper (`api-key-form-dialog.tsx` itself has since been deleted from the lib in this same working tree, superseded by this organism's real usage in `ApiKeySettingsScreen`).

## Architecture (as of this revision)
```
libs/components/src/
  atoms/card-list-with-abm-dialog-header/         # title + add button (own .stories/.test)
  molecules/card-list-row/                        # portable, organism-agnostic row (Card + edit/remove icons)
  molecules/card-list-with-abm-dialog-dialog/      # the ONE shared Dialog wrapper — swaps body/chrome by dialogType/dialogState/errorMessage
  organisms/card-list-with-abm-dialog-list/        # FlatList wrapper, renders CardListRowAdapter per item
  organisms/card-list-with-abm-dialog/
    card-list-with-abm-dialog.tsx                  # composition root: Provider + header + list-or-empty + the one dialog
    card-list-with-abm-dialog.types.ts             # CardListItem<TItem>, CardListWithABMDialogProps, dialog-state types, testID builders
    components/card-list-row-adapter.tsx            # maps CardListItem<TItem> → CardListRow's flat props (mirrors PdfDocumentListRow)
    hooks/
      card-list-with-abm-dialog.context.tsx        # CardListWithABMDialogProvider/useCardListWithABMDialogContext (state-sharing.mdc — avoids prop-drilling the full value object through header/list/dialog)
      card-list-with-abm-dialog.context.types.tsx  # CardListWithABMDialogValue<TItem> — the full caller-facing prop surface (title/items/add-edit-remove wiring/isSubmitting)
      use-card-list-with-abm-dialog.ts             # local dialog-open state: useReducer wiring + open*/close callbacks + per-dialogType chrome resolution
      use-card-list-with-abm-dialog.reducer.ts     # cardListWithABMDialogReducer — { dialogType, dialogItem, dialogState } as one useReducer (state.mdc: 3 related fields)
```
`CardListWithABMDialogProps` (the outer, non-generic props: `style`/`cardStyle`/`cardListStyle`/`cardListContentContainerStyle`/`showAddButton`/`submitDisabled`/`errorMessage`/`onClose`) is separate from `CardListWithABMDialogValue<TItem>` (the generic, caller-facing content/behavior contract — title, items, add/edit/remove render props and callbacks, `isSubmitting`). The component's actual prop type is the intersection of both.

## Open decisions (resolved, with rationale)
- **Item shape is generic `CardListItem<TItem>`** — **why:** callbacks (`onEditSubmit`, `onRemoveConfirm`, `renderEditForm`, `renderRemoveConfirmation`) receive the full typed domain object (`item.data: TItem`) directly with no caller-side id-lookup required. First generic component in `@helsoft/components`; kept to one type param to stay simple.
- **Per-card icon accessible names via builder-function props** `getEditAccessibilityLabel(item) => string` / `getRemoveAccessibilityLabel(item) => string` — **why:** avoids baking an English "Action Name" word-order/concatenation assumption into the organism; caller fully owns phrasing/localization per item. **⚠ Now optional, not required** (see "Issues found by this doc pass" below) — every current caller (stories + the real `ApiKeySettingsScreen` usage) still supplies both, so there is no live bug today, but the type no longer enforces it for future callers.
- **Disabled card = reduced opacity** (`theme.disabledOpacity`) wrapping the whole `Card` — **why:** reuses an existing token, no new color needed.
- **Disabled card's edit/remove icons still render, but disabled** (via `IconButton`'s own `disabled` prop), gated independently by `showEditButton`/`showRemoveButton` as usual.
- **List renders via `FlatList`** (`CardListWithABMDialogList`, now its own organism) — matches `PdfDocumentList`'s precedent.
- **Dismiss (scrim/Escape) is blocked while a dialog is `submitting`** — the shared `Dialog`'s `onClose` is passed `undefined` while `dialogState === 'submitting'` — prevents an accidental dismiss mid-flight.
- **Post-`pr_ready` bug fix (mini-gate): dialog content stays rendered through the close transition** — fixed by decoupling `isOpen` from the last-known dialog item; see `@s19`/`@s20`. This behavior is preserved by the later reducer rewrite (dialog state is never nulled on close, only `dialogState` flips to `'closed'`).
- **Post-`pr_ready` architecture fix (mini-gate): `CardListRow` promoted to its own molecule**, flattened to primitive props with `CardListRowAdapter` bridging the organism's generic `CardListItem<TItem>` down to it (mirrors `PdfDocumentListItem`/`PdfDocumentListRow`).
- **Mutation score accepted at 97.2–97.5%, not 100%** — 2 documented-equivalent surviving mutants (`ConditionalExpression` `true`-replacement on the dialog-open guards) — see `mutation.md`. **⚠ This acceptance predates the architecture rewrite below** — the guard code has since moved into `use-card-list-with-abm-dialog.ts`/the reducer; mutation has not been re-run against the current shape (see "Issues found").

### New since the last reviewed round (added by this doc pass — not yet gherkin'd/reviewed/mutation-tested when first written)
- **A real Add dialog now exists**, with full parity to edit/remove: `renderAddForm: () => ReactNode`, `addDialogTitle`, `addSubmitLabel?`, `addCancelLabel?`, `onAddSubmit?`. This **reverses the original non-goal** ("No add-dialog / add-form content — `onAddPress` is a plain callback"). `onAddPress` still exists and still fires on every add-button tap (unchanged, still tested at the e2e level), but tapping the button now *also* opens the add dialog — both behaviors coexist. **why (inferred, not confirmed with the human):** the real consumer, `ApiKeySettingsScreen` (which replaced the deleted `ApiKeyManager`), needs an add flow with the same dialog chrome/submitting/error handling as edit/remove.
- **Single shared `Dialog` instance for add/edit/remove** (`CardListWithABMDialogDialog` molecule), not one `<Dialog>` per type — chrome/body swap on `dialogType`/`dialogState`/`errorMessage`. Simplifies the "only one dialog open at a time" guarantee (now structural — there is only one Dialog element — rather than enforced by two guarded booleans).
- **State moved from a single `useState` discriminated union to `useReducer`** (`cardListWithABMDialogReducer`, `{ dialogType, dialogItem, dialogState }`, 3 related fields) — **why:** this correctly satisfies `state.mdc`'s ≥3-related-fields → `useReducer` threshold, which the original 2-field `useState` did not cross. `dialogState` is now a 3-value enum (`'open' | 'closed' | 'submitting'`) instead of the isOpen-boolean-plus-nullable-item shape from the earlier mini-gate fix — the close-without-flashing-empty-content guarantee (`@s19`/`@s20`) is preserved because `close` never nulls `dialogItem`, only flips `dialogState`.
- **`CardListWithABMDialogProvider`/`useCardListWithABMDialogContext`** (React Context, `state-sharing.mdc`) shares the full caller-facing value object (title/items/all the render-props and callbacks) across the now-multiple sub-components (header atom, list organism, dialog molecule, row adapter) instead of prop-drilling it through each layer.
- **`errorMessage`/`submitDisabled`/`showAddButton`/`onClose` props** added to `CardListWithABMDialogProps` (the non-generic half). `errorMessage` forces the shared dialog open regardless of `dialogType`/`dialogState`, replacing its body with `ErrorBanner` (new atom) and its actions with a single localized "Close" button. `submitDisabled` disables the dialog's confirm button. `showAddButton` toggles the header's add button.
- **Cancel/submit labels and the error banner's close button now fall back to internal `useLocalization()` keys** (`general.cancel`, `general.save`, `general.close`) in `CardListWithABMDialogDialog` when the caller omits `cancelLabel`/`submitLabel` — **this partially reverses** the earlier "all chrome text is caller-supplied props, no internal `t()` keys" decision. Callers can still override every label; only the *fallback* is new.
- **`CardListItem<TItem>.content` is now optional** (was required) and a new, currently-unused **`title?: string`** field was added to the type.
- **File layout split**: see Architecture above.

None of the "New since the last reviewed round" items above were run through `spec_partner`/`spec_reviewer`/the human gate, `reviewer_slice`/`reviews_lead`, or `mutation_tester` before landing — see "Issues found by this doc pass".

## Issues found by this doc pass (not fixed — code was left untouched per instruction)
1. **Accessibility regression risk**: `getEditAccessibilityLabel`/`getRemoveAccessibilityLabel` (on `CardListWithABMDialogValue<TItem>`) and `CardListItem.accessibleLabel` are now all optional. `CardListRowAdapter` passes `getEditAccessibilityLabel?.(item)` straight through to `CardListRow`'s `editAccessibilityLabel?: string`, which reaches `IconButton.accessibilityLabel` — `IconButton` unconditionally renders `accessibilityRole="button"`, so a caller that omits the getter ships a focusable, nameless button (WCAG 4.1.2), the same class of bug fixed earlier in this feature's history. Every current caller (stories, `ApiKeySettingsScreen`) does supply both getters, so there is no live bug today — but nothing in the types enforces it for the next caller.
2. **Undocumented reversal of an approved decision**: the "no internal i18n, all chrome via props" decision (originally grilled and human-approved) was reversed by adding `t('general.cancel')`/`t('general.save')`/`t('general.close')` fallbacks in `CardListWithABMDialogDialog`, without a mini-gate spec/gherkin update or re-review at the time it landed.
3. **New behavior added without a spec/gherkin/review/mutation cycle**: the entire Add-dialog flow (`renderAddForm`/`addDialogTitle`/`addSubmitLabel`/`addCancelLabel`/`onAddSubmit`), the `errorMessage` banner-in-dialog mode, and `submitDisabled` are real, working, and unit-tested at the molecule level (`card-list-with-abm-dialog-dialog.test.tsx`) — but none went through `spec_partner`, `spec_reviewer`, the human gate, `reviewer_slice`/`reviews_lead`, or `mutation_tester`.
4. **Test coverage gap**: `errorMessage` and `submitDisabled` are unit-tested on the `CardListWithABMDialogDialog` molecule in isolation, but there is no test — unit, e2e, or otherwise — that exercises them end-to-end from the top-level `CardListWithABMDialog` (i.e., nothing proves that passing `errorMessage`/`submitDisabled` into the public component actually reaches the dialog in a real render tree).
5. **Traceability drift**: `card-list-with-abm-dialog.test.tsx`'s own code comment mislabels a new test ("opens the add dialog with `renderAddForm()`...") as `@s17` — but `@s17` already has a different, still-true, still-tested meaning ("tapping the add button calls `onAddPress`", verified at the e2e level in `card-list-with-abm-dialog.e2e.js`). This doc pass added new tags (`@s21`) for the add-dialog-opens behavior rather than renumbering the existing one; the test file's inline comment is left as-is (not code this pass is meant to touch) but is now inconsistent with `gherkin-scenarios.md`.
6. **Dead field**: `CardListItem<TItem>.title?: string` is declared but never read anywhere in the current rendering code (`CardListRow` only renders `content`; grepped repo-wide, the only other `.title` usages are the dialog's own `title` prop and an unrelated `lesson-list.tsx`).
7. **Mutation score is stale relative to the current code**: `mutation.md`'s accepted 97.2–97.5% predates this architecture rewrite (Context, reducer, new sub-component files, add-dialog). Mutation has not been re-run against the current shape.
8. **`docs/features/card-list-with-abm-dialog/review.md`, `review-engineering.md`, `mutation.md`, and `dod.md`** all describe a prior, now-superseded state of the code. They have not been rewritten by this pass (see the drift notice added at the top of each) — a real re-review + mutation re-run is needed before this feature can be honestly called `pr_ready` again.

## Prop surface (informative — full types in `card-list-with-abm-dialog.types.ts` / `hooks/card-list-with-abm-dialog.context.types.tsx`)
```
CardListItem<TItem> = {
  id: string
  title?: string            // declared, currently unused/unread anywhere (see Issues found)
  content?: ReactNode
  accessibleLabel?: string   // now optional — see Issues found
  disabled?: boolean
  showEditButton?: boolean
  showRemoveButton?: boolean
  data: TItem
}

// Non-generic half — CardListWithABMDialogProps (card-list-with-abm-dialog.types.ts)
CardListWithABMDialogProps = {
  onClose?: () => void
  errorMessage?: string
  submitDisabled?: boolean
  showAddButton?: boolean
  style?: StyleProp<ViewStyle>
  cardStyle?: StyleProp<ViewStyle>
  cardListStyle?: StyleProp<ViewStyle>
  cardListContentContainerStyle?: StyleProp<ViewStyle>
}

// Generic half — CardListWithABMDialogValue<TItem> (hooks/card-list-with-abm-dialog.context.types.tsx)
CardListWithABMDialogValue<TItem> = {
  title: string
  items: CardListItem<TItem>[]
  addButtonLabel: string
  emptyStateMessage?: string

  renderAddForm: () => ReactNode
  addDialogTitle: string
  addSubmitLabel?: string
  addCancelLabel?: string
  onAddPress?: () => void
  onAddSubmit?: () => void

  renderEditForm: (item: CardListItem<TItem>) => ReactNode
  editDialogTitle: string
  editSubmitLabel?: string
  editCancelLabel?: string
  onEditPress?: (item: CardListItem<TItem>) => void
  onEditSubmit?: () => void

  renderRemoveConfirmation: (item: CardListItem<TItem>) => ReactNode
  removeDialogTitle?: string
  removeSubmitLabel?: string
  removeCancelLabel?: string
  onRemovePress?: (item: CardListItem<TItem>) => void
  onRemoveConfirm?: () => void

  getEditAccessibilityLabel?: (item: CardListItem<TItem>) => string
  getRemoveAccessibilityLabel?: (item: CardListItem<TItem>) => string

  isSubmitting: boolean
  showAddButton?: boolean
}
```
The actual component prop is `CardListWithABMDialogValue<TItem> & CardListWithABMDialogProps`.
