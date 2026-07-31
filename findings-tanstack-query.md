# Findings: tanstack-query.mdc

## Summary
Clean. Lessons/PDF domains now throw `toTypedError` codes and hooks expose closed unions via `toLessonsErrorCode` / `toPdfDocumentsErrorCode` (same pattern as auth/api-key).

## Fixed
### `useLessons` / `useLesson` / `usePdfDocuments` raw `Error | null`
- **Was:** mutation+query `error` exposed as `Error | null`; services threw plain `Error`.
- **Now:** `LessonsErrorCode` / `PdfDocumentsErrorCode` (`network_error` | `validation_error`); services use `toTypedError`; hooks normalize via helpers.
