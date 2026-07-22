# Review — native-bottom-tabs (round 1)

**CI red @** `d1112967f` — reviewer_engineering **not** invoked.  
**Unit tests:** green (`pnpm test`).  
**E2e:** `@helsoft/components` 144 passed; `@helsoft/study-buddy` 1 failed / 76 passed.

## Open — CI failures (fix before full review)

### blocker

1. **lint `@helsoft/study-buddy`** — `libs/study-buddy/src/components/new-lesson-dialog/new-lesson-dialog.tsx:19` Biome format (destructure must be one line + wrap). Feature package red.
2. **check-types `@helsoft/hooks`** — blocks dependents (`study-buddy` / app). Pre-existing (no feature diff), still fails full `pnpm check-types`:
   - `libs/hooks/src/hooks/use-api-key.test.ts:107,134,324` — `Expected 1 arguments, but got 0`
   - `libs/hooks/src/hooks/use-auth.test.ts:200,218` — same
   - `libs/hooks/src/hooks/use-pdf-documents.test.ts:322,342` — same
   - `libs/hooks/src/hooks/use-lesson.test.ts:164+` — `renderHook` props/`result.current` typing
3. **lint `@helsoft/pdf-upload-extraction`** — `libs/pdf-upload-extraction/src/services/pdf-extraction.service.test.ts:10` Biome `organizeImports` needs blank line before statement. Pre-existing (no feature diff).
4. **e2e `@helsoft/study-buddy`** — `libs/study-buddy/tests/e2e/components/api-key-settings/api-key-settings.e2e.js:62` — `EntitlementsError` story: timeout waiting for `We couldn't load your plan.` (not in feature diff; re-run/confirm flake vs real).

## Request to implementer

Make full CI green (`pnpm lint`, `pnpm check-types`, `pnpm test`, study-buddy + components playwright). Prefer minimal Biome/format + hooks test typing fixes; do not expand feature scope. Re-run same suites after.

**Verdict:** CHANGES_REQUESTED — CI red; engineering review deferred.
