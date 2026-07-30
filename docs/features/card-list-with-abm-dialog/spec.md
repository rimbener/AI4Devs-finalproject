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
→ **`gherkin-scenarios.md`** — `@s1`–`@s27`. `@s21`–`@s27` cover the add-dialog flow, cross-dialog mutual exclusivity, the error-banner mode, and `submitDisabled`.

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
  atoms/error-banner/                             # inline error message, used by the shared dialog's error state
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
- **`CardListItem.accessibleLabel` and the per-card `getEditAccessibilityLabel(item)`/`getRemoveAccessibilityLabel(item)` builder props are required, not optional** — **why:** `IconButton` unconditionally renders `accessibilityRole="button"`, so an accessible name must never be missing (WCAG 4.1.2); a required type is the guarantee, not a convention every future caller has to remember. (These briefly became optional during the architecture rewrite below; re-tightened to required after being flagged.) Caller fully owns phrasing/localization per item — avoids baking an English "Action Name" word-order/concatenation assumption into the organism.
- **Chrome text is caller-supplied props, with localized fallbacks for cancel/submit/close** — `title`, `addButtonLabel`, `*DialogTitle`, `emptyStateMessage`, etc. are always caller props; `CardListWithABMDialogDialog` additionally falls back to `t('general.cancel')`/`t('general.save')`/`t('general.close')` when the caller omits `cancelLabel`/`submitLabel` (the error state's "Close" button always uses `general.close`, uncustomizable). **why:** the organism stays domain-agnostic (no domain-specific i18n keys baked in — a caller can always override every label), while common, non-domain-specific actions (cancel/save/close) get a sensible default so callers aren't forced to pass boilerplate labels for the common case. (This is an amendment to the original "no internal i18n at all" decision, made during the architecture rewrite below and accepted as-is.)
- **Disabled card = reduced opacity** (`theme.disabledOpacity`) wrapping the whole `Card` — **why:** reuses an existing token, no new color needed.
- **Disabled card's edit/remove icons still render, but disabled** (via `IconButton`'s own `disabled` prop), gated independently by `showEditButton`/`showRemoveButton` as usual.
- **List renders via `FlatList`** (`CardListWithABMDialogList`, now its own organism) — matches `PdfDocumentList`'s precedent.
- **Dismiss (scrim/Escape) is blocked while a dialog is `submitting`** — the shared `Dialog`'s `onClose` is passed `undefined` while `dialogState === 'submitting'` — prevents an accidental dismiss mid-flight.
- **Post-`pr_ready` bug fix (mini-gate): dialog content stays rendered through the close transition** — fixed by decoupling `isOpen` from the last-known dialog item; see `@s19`/`@s20`. This behavior is preserved by the later reducer rewrite (dialog state is never nulled on close, only `dialogState` flips to `'closed'`).
- **Post-`pr_ready` architecture fix (mini-gate): `CardListRow` promoted to its own molecule**, flattened to primitive props with `CardListRowAdapter` bridging the organism's generic `CardListItem<TItem>` down to it (mirrors `PdfDocumentListItem`/`PdfDocumentListRow`).
- **A real Add dialog exists, with full parity to edit/remove**: `renderAddForm: () => ReactNode`, `addDialogTitle`, `addSubmitLabel?`, `addCancelLabel?`, `onAddSubmit?`. This **reverses the original non-goal** ("No add-dialog / add-form content — `onAddPress` is a plain callback"), accepted as a human decision. `onAddPress` is unchanged and still fires on every add-button tap (tested at the e2e level); tapping the button now *also* opens the add dialog — both coexist. **why:** the real consumer, `ApiKeySettingsScreen` (replacing the deleted `ApiKeyManager`), needs an add flow with the same dialog chrome/submitting/error handling as edit/remove.
- **Single shared `Dialog` instance for add/edit/remove** (`CardListWithABMDialogDialog` molecule), not one `<Dialog>` per type — chrome/body swap on `dialogType`/`dialogState`/`errorMessage`. **why:** makes "only one dialog open at a time" structural (there is only one Dialog element) rather than enforced by separately-guarded booleans.
- **Dialog-open state moved from a single `useState` discriminated union to `useReducer`** (`cardListWithABMDialogReducer`, `{ dialogType, dialogItem, dialogState }`, 3 related fields) — **why:** correctly satisfies `state.mdc`'s ≥3-related-fields → `useReducer` threshold, which the original 2-field `useState` did not cross. `dialogState` is a 3-value enum (`'open' | 'closed' | 'submitting'`); `close` never nulls `dialogItem`, only flips `dialogState`, preserving the `@s19`/`@s20` no-flash-on-close guarantee.
- **`CardListWithABMDialogProvider`/`useCardListWithABMDialogContext`** (React Context, `state-sharing.mdc`) shares the full caller-facing value object across the now-multiple sub-components (header atom, list organism, dialog molecule, row adapter) instead of prop-drilling it through each layer.
- **`errorMessage`/`submitDisabled`/`showAddButton`/`onClose` props** on `CardListWithABMDialogProps` (the non-generic half). `errorMessage` forces the shared dialog open regardless of `dialogType`/`dialogState`, replacing its body with `ErrorBanner` (new atom) and its actions with a single "Close" button. `submitDisabled` disables the dialog's confirm button. `showAddButton` toggles the header's add button. **why:** needed by `ApiKeySettingsScreen`'s real save/remove-error and in-flight-save-button-disabled UX. Covered end-to-end by `@s26`/`@s27` (added after `errorMessage`/`submitDisabled` were previously only unit-tested on the `CardListWithABMDialogDialog` molecule in isolation).
- **`CardListItem<TItem>.content` is optional** (a card can be content-less, e.g. relying on `title` alone in a future usage) — no current caller omits it.
- **Mutation score accepted at 97.2–97.5%, not 100%** — 2 documented-equivalent surviving mutants (`ConditionalExpression` `true`-replacement on the dialog-open guards) — see `mutation.md`. **⚠ Predates the architecture rewrite above** — the guard code has since moved into `use-card-list-with-abm-dialog.ts`/the reducer; mutation has not been re-run against the current shape (see "Outstanding" below).

## Fixed by a later doc-and-code pass
- **`getEditAccessibilityLabel`/`getRemoveAccessibilityLabel`/`CardListItem.accessibleLabel` re-tightened to required** (briefly optional during the architecture rewrite — see the a11y decision above). `CardListRowAdapter` no longer needs `?.()` on the getters.
- **Removed the dead `CardListItem<TItem>.title?: string` field** — declared but never read/rendered anywhere in this feature's code.
- **Fixed a traceability collision**: a test in `card-list-with-abm-dialog.test.tsx` had mislabeled itself `@s17` in a comment (`@s17` already means, and still means, "tapping the add button calls `onAddPress`" — unchanged, still tested at the e2e level); retagged to the correct `@s21`–`@s25` tags per `gherkin-scenarios.md`.
- **Added `@s26`/`@s27` end-to-end tests** on `CardListWithABMDialog` itself (not just the `CardListWithABMDialogDialog` molecule in isolation) for `errorMessage` and `submitDisabled`.

## Outstanding — pipeline gates not yet re-run
The architecture rewrite (Context/`useReducer`, atom/molecule/organism split) and the Add-dialog/`errorMessage`/`submitDisabled` features above are real, working, and now fully unit-tested — but have **not** been through `spec_partner`/`spec_reviewer`/the human gate (retroactively accepted via chat, not a formal gate), `reviewer_slice`/`reviews_lead`, or a fresh `mutation_tester` run. `docs/features/card-list-with-abm-dialog/review.md`, `review-engineering.md`, `mutation.md`, and `dod.md` are all flagged `STALE` at the top and describe a prior, now-superseded state of the code. This feature is not honestly `pr_ready` again until a real full review + mutation re-run happens against the current tree.

## Prop surface (informative — full types in `card-list-with-abm-dialog.types.ts` / `hooks/card-list-with-abm-dialog.context.types.tsx`)
```
CardListItem<TItem> = {
  id: string
  content?: ReactNode
  accessibleLabel: string
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

  getEditAccessibilityLabel: (item: CardListItem<TItem>) => string
  getRemoveAccessibilityLabel: (item: CardListItem<TItem>) => string

  isSubmitting: boolean
  showAddButton?: boolean
}
```
The actual component prop is `CardListWithABMDialogValue<TItem> & CardListWithABMDialogProps`.
