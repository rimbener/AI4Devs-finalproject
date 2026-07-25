---
id: task-4
title: Migrate usePdfDocuments to useQuery + delete mutation; delete its reducer
slice: 3
scenarios: [s17, s18, s19, s20, s21, s22, s23]
status: todo
paths: [libs/hooks/src/hooks/use-pdf-documents.ts, libs/hooks/src/hooks/use-pdf-documents.reducer.ts, libs/hooks/src/hooks/use-pdf-documents.test.ts, libs/hooks/src/hooks/pdf-documents.integration.test.ts]
---

## Goal
Mirror task-3 for `usePdfDocuments`: `useQuery(['pdf-documents'])` plus a delete `useMutation` that filters the row out of the cached list in `onSuccess` via `setQueryData`. Return the unchanged `{ documents, isLoading, error, refetch, deleteDocument }`. Delete `use-pdf-documents.reducer.ts`.

## Done criteria
- [ ] Scenario(s) s17, s18, s19, s20, s21, s22, s23 covered by concrete tests
- [ ] Key exported as a `const` tuple; `documents` is `data ?? []`
- [ ] `deleteDocument` uses **`mutateAsync`** and still rejects on failure
- [ ] **D4 error merge:** `error = deleteMutation.error ?? query.error`
- [ ] **D4 reset:** the `refetch` wrapper calls `deleteMutation.reset()` before `query.refetch()`, and stays `() => void`
- [ ] A failed delete leaves the cached list unchanged (s22)
- [ ] `use-pdf-documents.reducer.ts` deleted; no `isMounted` or `requestId` ref remains
- [ ] `pdf-documents.integration.test.ts` passes with the same wrapper, otherwise unedited
- [ ] `pnpm lint` + `pnpm check-types` + `pnpm test` green

## Notes
Structurally identical to task-3 — copy the shape that survived slice 2's review rather than inventing a second one. The only differences are the service (`PdfDocumentsService.getDocuments` / `deleteDocument`), the key, and the field name.

No `instanceof Error` normalizer.
