# Mutation report — activity-image-sizing (pre-review, re-run)

**Base ref:** `feature-entrega3-HernanLaura`  
**Date:** 2026-07-20  
**Threshold:** 100% killed on changed lines  
**Verdict:** **PASS**

## Scope

Changed source vs base (mutation-eligible libs only):

| Lib | Changed files |
|-----|---------------|
| `@helsoft/components` | `src/molecules/image-lightbox/image-lightbox.tsx`, `image-lightbox.types.ts` |
| `@helsoft/activities` | `src/organisms/slide-image/slide-image.tsx` |

Skipped (no changed source): `@helsoft/services`, `@helsoft/supabase-services`, `@helsoft/hooks`, `@helsoft/logging-in-out`, `@helsoft/study-buddy`.

## Scores

| Lib | total | killed | timeout | survived | errors | score |
|-----|------:|-------:|--------:|---------:|-------:|------:|
| `@helsoft/components` | 14 | 13 | 0 | 0 | 1 | 100.00% |
| `@helsoft/activities` | 40 | 39 | 0 | 0 | 1 | 100.00% |

## Errors (not survivors)

| Lib | file | note |
|-----|------|------|
| `@helsoft/components` | `image-lightbox.types.ts` | Type-only file; mutant caused compile error (no runtime coverage) |
| `@helsoft/activities` | `slide-image.tsx` | 1 compile/runtime error mutant excluded from score |

## Surviving mutants

None.
