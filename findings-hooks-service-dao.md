# Findings: hooks-service-dao.mdc

## Summary
Listed violations already fixed earlier; remaining observation (public DAO barrels) closed via `PdfUploadService` + package indexes exporting services only.

## Fixed
### Types exported from DAO implementation files
- **Was:** `ProfileWithPlanFlags` / `RawProviderRow` on DAO `.ts` files.
- **Now:** co-located `*.types.ts` (see `d20b38423` + profile raw types).

### DAOs return/mapped domain shapes
- **Was:** lessons / lesson-attempt / api-key / profile DAOs mapped to domain.
- **Now:** raw rows from DAOs; mapping/validation in services (`5c44836dd`).

### Package barrels re-exporting DAOs
- **Was:** `@helsoft/supabase-services` / `@helsoft/services` `export * from './dao'`; `PdfExtractionService` imported `PdfUploadDao`.
- **Now:** `PdfUploadService` wraps the DAO; feature lib calls the service; package indexes export services (+ helpers) only — DAOs stay internal.

## Observations (accepted / out of scope here)
- `lesson-generation.persist.ts` still lives under `services/` as Edge Function mirror (duck-typed client); client path is `LessonGenerationDao` → edge only.
- `usePdfExtraction` / `useLocalePreference` live outside `libs/hooks` — named TanStack exemptions.
