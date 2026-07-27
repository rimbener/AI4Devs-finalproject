---
id: task-2
title: Wire edit/remove dialogs via the shared Dialog organism
slice: 2
scenarios: [s5, s6, s7, s8, s9, s10]
status: done
paths: [libs/components/src/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.tsx, libs/components/src/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.types.ts, libs/components/src/organisms/card-list-with-abm-dialog/use-card-list-with-abm-dialog.ts, libs/components/src/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.stories.tsx, libs/components/src/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.test.tsx, libs/components/tests/e2e/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.e2e.js]
---

## Goal
Implementation-first (UI `.tsx`): add the edit-icon/remove-icon tap wiring. `use-card-list-with-abm-dialog.ts` owns the single discriminated-union state `{ type: 'edit' | 'remove'; item: CardListItem<TItem> } | null` (per spec.md's Open decisions) plus its setters/close helper. Tapping an enabled edit icon opens the shared `Dialog` with `headline=editDialogTitle`, `confirmLabel=editSubmitLabel`, `cancelLabel=editCancelLabel`, body = `renderEditForm(item)`; submit calls `onEditSubmit(item)` then closes. Remove follows the same shape with its own `render*`/`*DialogTitle`/`*SubmitLabel`/`*CancelLabel`/`onRemoveConfirm` props. Cancel/scrim/Escape (Dialog's existing `onClose`) closes without calling either submit callback. No `isSubmitting` swap yet (task-3).

## Done criteria
- [x] Scenarios s5, s6, s7, s8, s9, s10 covered by concrete test(s)
- [x] `use-card-list-with-abm-dialog.ts` owns state per `state.mdc`/`component-split.mdc` (handlers stay in the `.tsx`, hook exposes state + setters)
- [x] `card-list-with-abm-dialog.test.tsx` covers open/submit/cancel for both dialogs; a `card-list-with-abm-dialog.e2e.js` interaction test per dialog (open → submit, open → cancel) per `e2e.mdc`
- [x] `pnpm --filter @helsoft/components lint` + `check-types` + `test` green
- [x] No hardcoded strings — dialog chrome comes entirely from props (`editDialogTitle` etc.), never a literal

## Notes
- Reuse the shared `Dialog` organism directly (`libs/components/src/organisms/dialog/dialog.tsx`) — do not model this on `api-key-form-dialog` (explicitly out of scope per spec.md).
- `Dialog`'s `open` prop is `dialogState?.type === 'edit'` / `'remove'`; `children` is the `render*(dialogState.item)` result.
- Only one dialog can be open at a time by construction (discriminated union) — no need to guard against both.
