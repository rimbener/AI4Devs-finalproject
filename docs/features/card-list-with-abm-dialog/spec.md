---
feature: card-list-with-abm-dialog
story: user-stories/in-progress/card-list-with-abm-dialog.md   # pending/ → in-progress/ → done/
status: spec_drafted
---

# Spec — card-list-with-abm-dialog

## Summary
A reusable `CardListWithABMDialog` organism in `@helsoft/components` (`libs/components/src/organisms/card-list-with-abm-dialog/`): a titled `Card` list with optional per-card edit/remove, each backed by the shared `Dialog` organism, so any screen needing add/edit/remove-a-card gets consistent MD3 UI without rebuilding it.

## User stories
- As a developer building list-management screens, I want a reusable card-list-with-ABM-dialog organism, so that any screen needing add/edit/remove-a-card-in-a-list gets consistent UI/behavior for free.

## Acceptance criteria
→ **`gherkin-scenarios.md`** — `@s1`–`@s18`.

## UI states (if UI)
| State | Trigger | Notes |
|---|---|---|
| Populated | `items.length > 0` | one `Card` per item, rendered via `FlatList` |
| Empty (message) | `items.length === 0` + `emptyStateMessage` set | title/add button still render |
| Empty (no message) | `items.length === 0`, no `emptyStateMessage` | nothing renders in place of the list |
| Edit dialog open | edit icon tapped | body = `renderEditForm(item)`; `isSubmitting` swaps to `SubmittingIndicator` |
| Remove dialog open | remove icon tapped | body = `renderRemoveConfirmation(item)`; `isSubmitting` swaps to `SubmittingIndicator` |

## Analytics events
None (story explicitly excludes analytics).

## Feature flags
None (story explicitly excludes a flag).

## Out of scope / non-goals
- No `supabase/` schema/RLS/edge-function changes — pure frontend component.
- No add-dialog / add-form content — `onAddPress` is a plain callback; the caller owns whatever UI follows an add tap.
- Not modeled on `api-key-form-dialog` — reuses the generic `Dialog` organism directly, no bespoke dialog wrapper.

## Open decisions (resolved, with rationale)
- **Item shape is generic `CardListItem<TItem>`** (not a concrete non-generic type like `PdfDocumentListItemData`) — **why:** callbacks (`onEditSubmit`, `onRemoveConfirm`, `renderEditForm`, `renderRemoveConfirmation`) receive the full typed domain object (`item.data: TItem`) directly with no caller-side id-lookup required. First generic component in `@helsoft/components`; kept to one type param to stay simple.
- **All chrome text is caller-supplied props** (`title`, `addButtonLabel`, `editDialogTitle`/`editSubmitLabel`/`editCancelLabel`, `removeDialogTitle`/`removeSubmitLabel`/`removeCancelLabel`, `emptyStateMessage`) — no internal `useLocalization()`/`t()` keys in this organism — **why:** unlike `PdfDocumentList`/`ApiKeyManager` (each tied to one screen's domain), this organism is explicitly domain-agnostic ("any screen"); baking in generic i18n keys (e.g. `cardList.add`) would force identical literal text across every caller.
- **Per-card icon accessible names via builder-function props** `getEditAccessibilityLabel(item) => string` / `getRemoveAccessibilityLabel(item) => string` — **why:** avoids baking an English "Action Name" word-order/concatenation assumption into the organism; caller fully owns phrasing/localization per item.
- **Disabled card = reduced opacity** (`theme.disabledOpacity`, the existing 0.38 token already used by `Button`/`IconButton` disabled states) wrapping the whole `Card` — **why:** reuses an existing token, no new color needed, consistent with the rest of the disabled-state visual language.
- **Disabled card's edit/remove icons still render, but disabled** (via `IconButton`'s own `disabled` prop — grayed, no-op on press), gated independently by `showEditButton`/`showRemoveButton` as usual — **why:** explicit human decision during grilling (keeps layout consistent across cards rather than icons appearing/disappearing based on `disabled`).
- **List renders via `FlatList`** (matching `PdfDocumentList`'s existing precedent), not a plain `View`+`.map()` — **why:** explicit human decision during grilling, consistent with the one other list organism in this lib.
- **Open-dialog state is a single discriminated union** `useState<{ type: 'edit' | 'remove'; item: CardListItem<TItem> } | null>` — **why:** one state variable, not `useReducer` (not ≥3 independently-changing fields per `state.mdc`); rules out an invalid "both dialogs open" state by construction.
- **Dismiss (scrim/Escape) is blocked while `isSubmitting` is true** — the underlying `Dialog`'s `onClose` is passed `undefined` while submitting — **why:** explicit human decision; prevents an accidental dismiss mid-flight when the buttons are already hidden (signals "no user action available").
- **`onAddPress: () => void`** is the Add button's only wiring — no add-dialog/render-prop in this component — **why:** explicit human decision; the story has no AC/content contract for an add dialog, unlike edit/remove which both have `render*`+`on*Submit` pairs.
- **Post-`pr_ready` bug fix (mini-gate): dialog content stays rendered through the close transition** — the underlying `Dialog`'s `Modal` fades out over its own animation duration, but `closeDialog()` previously nulled the discriminated-union state synchronously, so `renderDialogBody` returned `null` mid-fade, flashing an empty dialog. Fix: the hook now tracks `isOpen` separately from the last-known `{type, item}` state — closing only flips `isOpen` to `false` (gates `Dialog`'s `open` prop) without clearing the item data, so the dialog's last content keeps rendering for the remainder of the close animation. New scenarios `@s19`/`@s20`. **why:** minimal, local fix (no `Dialog` organism edit) — the stale item data is simply never visible again once `isOpen` is false and the next open replaces it.
- **Post-`pr_ready` architecture fix (mini-gate): `CardListRow` promoted to its own molecule** — it was an unexported inline component in `card-list-with-abm-dialog.tsx` with no `.stories.tsx` of its own, which is both an architecture-layering gap (it's a composed unit — `Card` + two `IconButton`s — not organism-specific chrome) and a direct `atomic-design.mdc` violation ("every component ships a co-located `.stories.tsx` — no exceptions"). **why:** explicit human decision after `pr_ready`; matches this lib's own precedent, `PdfDocumentList`'s row extracted to `molecules/pdf-document-list-item/` with its own `.types.ts`/`.stories.tsx`/`.test.tsx`. Moved to `libs/components/src/molecules/card-list-row/` (kept the name `CardListRow` — not `CardListItem`, which is already the data-shape type name); the organism now imports it instead of defining it inline. No prop/behavior change, no new `@s` scenarios needed (pure structural move).
- **Mutation score accepted at 97.2%, not 100%** — `ACCEPTED — mutation 2-round cap, 2026-07-27`: 2 surviving mutants (`card-list-with-abm-dialog.tsx:98,106`, `ConditionalExpression` `true`-replacement) are documented-equivalent (see `mutation.md`) and provably non-suppressible without either hiding an already-killed sibling mutant on the same line or a larger `Dialog` mount-strategy change out of this feature's scope. Two real restructuring attempts were implemented and Stryker-verified in round 2; both failed to separate the pairing. Human explicitly accepted this after reviewing the evidence — **why:** the alternative (changing `Dialog`'s shared mount lifecycle) risks every other consumer of that organism for a cosmetic score gain with no behavioral test gap.

## Prop surface (informative — full types in `card-list-with-abm-dialog.types.ts`)
```
CardListItem<TItem> = {
  id: string
  content: ReactNode
  accessibleLabel: string   // consumed by getEdit/RemoveAccessibilityLabel, not rendered directly
  disabled?: boolean
  showEditButton?: boolean
  showRemoveButton?: boolean
  data: TItem
}

CardListWithABMDialogProps<TItem> = {
  title: string
  items: CardListItem<TItem>[]
  addButtonLabel: string
  onAddPress: () => void
  emptyStateMessage?: string

  renderEditForm: (item: CardListItem<TItem>) => ReactNode
  editDialogTitle: string
  editSubmitLabel: string
  editCancelLabel: string
  onEditSubmit: (item: CardListItem<TItem>) => void

  renderRemoveConfirmation: (item: CardListItem<TItem>) => ReactNode
  removeDialogTitle: string
  removeSubmitLabel: string
  removeCancelLabel: string
  onRemoveConfirm: (item: CardListItem<TItem>) => void

  getEditAccessibilityLabel: (item: CardListItem<TItem>) => string
  getRemoveAccessibilityLabel: (item: CardListItem<TItem>) => string

  isSubmitting: boolean
}
```
