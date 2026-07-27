# CardListWithABMDialog component

**As a** developer building list-management screens in the Study Buddy app
**I want** a reusable `CardListWithABMDialog` organism in `@helsoft/components` that renders a titled list of cards with optional per-card edit/remove actions, each backed by a confirmation/edit dialog
**so that** any screen needing add/edit/remove-a-card-in-a-list gets consistent MD3 UI and dialog behavior without rebuilding it each time

## Context
- New organism at `libs/components/src/organisms/card-list-with-abm-dialog/`, built from existing `@helsoft/components` primitives: `Card` (atom), `Button` (atom, used inline with `icon="add"` for the add action — no new `AddButton` component), `IconButton` (atom, edit/remove actions), `Dialog` (organism, reused as-is for both the edit and remove-confirmation modals), `SubmittingIndicator` (molecule).
- Explicitly do NOT model this component's code on `libs/components/src/organisms/api-key-form-dialog/` — that component's structure/code quality is not a pattern to follow here. Reuse the generic `Dialog` organism directly instead of writing a bespoke dialog wrapper.
- Card content is fully caller-controlled: each list item supplies its own content (`ReactNode`), not a fixed title/subtitle shape.
- Per-item flags (not list-wide): `disabled?` (renders the card with a grayed-out background), `showEditButton?`, `showRemoveButton?` — so a single list can mix editable, read-only, and disabled cards.
- Edit and remove dialogs both follow the same content-supply pattern: a render-prop called with the clicked item (`renderEditForm(item)` for the edit dialog's form body, `renderRemoveConfirmation(item)` for the remove dialog's confirmation body) so the dialog content can reference/pre-fill from that specific item.
- Dialog chrome (title, submit label, cancel label) is static per dialog type — one set for all edit dialogs, one set for all remove dialogs — not computed per item.
- Submit callbacks receive the item being acted on: `onEditSubmit(item)`, `onRemoveConfirm(item)`.
- `isSubmitting` is a single prop owned by the parent (e.g. mirroring a mutation's pending state). While `true`, whichever dialog is open replaces its body entirely with `SubmittingIndicator` and hides its cancel/submit buttons (no partial-disable state).
- Dialog open/close state for "which item's dialog is open" is tracked internally by `CardListWithABMDialog` (opened by the edit/remove icon click, closed by Cancel/backdrop/Escape via the underlying `Dialog`'s existing behavior) — the component is not a fully-controlled `open`/`onOpenChange` API like the underlying `Dialog` atom.
- Edit/remove icon buttons need per-item accessible names (e.g. "Edit Spanish Verbs", not just "Edit") so screen reader users navigating the list can tell cards apart.
- Empty list: title and Add button still render; an optional `emptyStateMessage` is shown in place of the list when there are no items.
- No `supabase/` schema, RLS, or edge function changes — pure frontend/UI component. Not split into backend/frontend stories.
- No analytics event or feature flag for this story.
- Exact prop names/types below are indicative of the intended shape, not final — precise API design (item type, prop naming, internal state shape) is an open decision for `spec_partner`, same as `activities-library.md`'s precedent for this kind of library-component story.

## Acceptance criteria
- Given a list of items with content, when `CardListWithABMDialog` renders, then it shows the `title` prop, an add button (reusing `Button` with `icon="add"`), and one `Card` per item containing that item's supplied content.
- Given an item with `disabled: true`, when its card renders, then the card shows a grayed-out background (visually distinguishable from enabled cards) and is not interactive for edit/remove even if those flags are also true.
- Given an item with `showEditButton: false` (or `showRemoveButton: false`), then that card does not render the corresponding icon button; the other icon button (if enabled) still renders independently.
- Given a card with edit enabled, when the user taps its edit icon button, then an edit dialog opens showing the content returned by `renderEditForm(item)` for that specific item, with the configured static edit title/submit label/cancel label.
- Given a card with remove enabled, when the user taps its remove icon button, then a remove-confirmation dialog opens showing the content returned by `renderRemoveConfirmation(item)` for that specific item, with the configured static remove title/submit label/cancel label.
- Given the edit dialog is open, when the user taps its submit button, then `onEditSubmit(item)` is called with the item that opened the dialog.
- Given the remove dialog is open, when the user taps its submit button, then `onRemoveConfirm(item)` is called with the item that opened the dialog.
- Given either dialog is open, when the user taps Cancel, taps the scrim, or dismisses via Escape, then the dialog closes without calling `onEditSubmit`/`onRemoveConfirm`.
- Given either dialog is open and `isSubmitting` becomes `true`, then the dialog body is replaced entirely by `SubmittingIndicator` and the cancel/submit buttons are hidden; when `isSubmitting` returns to `false`, the normal form/confirmation content and buttons are shown again.
- Given each card's edit/remove icon buttons, then their accessible names are specific to that card (e.g. include the card's identifying label), not a generic "Edit"/"Remove" reused across every card.
- Given `items` is an empty array, then the title and add button still render, and — if `emptyStateMessage` is provided — that message renders in place of the list; if not provided, nothing renders in place of the list.
- Given the component's Storybook stories, then they cover: populated list, empty list (with and without `emptyStateMessage`), a disabled card, a card with only edit enabled, a card with only remove enabled, edit dialog open, remove dialog open, and `isSubmitting` true for each dialog.

## Notes
- Contract/spec ownership (exact prop/type names, internal state shape for "currently open item") is left to `spec_partner` during the plan-gate step.
- No analytics event or feature flag for this story.
