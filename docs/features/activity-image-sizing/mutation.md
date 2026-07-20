# Mutation report — activity-image-sizing

## Pre-review pass (re-run)

**Base ref:** `feature-entrega3-HernanLaura`  
**Date:** 2026-07-20  
**Threshold:** 100% killed on changed lines  
**Verdict:** **PASS**

### Scope

| Lib | Changed files |
|-----|---------------|
| `@helsoft/components` | `src/molecules/image-lightbox/image-lightbox.tsx`, `image-lightbox.types.ts` |
| `@helsoft/activities` | `src/organisms/slide-image/slide-image.tsx` |

Skipped: `@helsoft/services`, `@helsoft/supabase-services`, `@helsoft/hooks`, `@helsoft/logging-in-out`, `@helsoft/study-buddy`.

### Scores

| Lib | total | killed | timeout | survived | errors | score |
|-----|------:|-------:|--------:|---------:|-------:|------:|
| `@helsoft/components` | 14 | 13 | 0 | 0 | 1 | 100.00% |
| `@helsoft/activities` | 40 | 39 | 0 | 0 | 1 | 100.00% |

### Surviving mutants

None.

---

## Post-review pass (round 1)

**Base ref:** `481cdf4ece90aca1572d9df22271f4875eeddb6c` (pre-review sha; review-fix delta only)  
**Date:** 2026-07-20  
**Threshold:** 100% killed on changed lines in scope  
**Verdict:** **SURVIVORS** (98.61% aggregate — `@helsoft/activities` below 100%)

### Scope

Changed source vs base (mutation-eligible libs only):

| Lib | Changed files |
|-----|---------------|
| `@helsoft/components` | `src/molecules/image-lightbox/image-lightbox.helpers.ts`, `image-lightbox.tsx`, `image-lightbox.types.ts` |
| `@helsoft/activities` | `src/organisms/slide-image/slide-image.tsx` |

Out of scope (reverted / identical to base): `src/atoms/icon-button/icon-button.tsx`.

Skipped (no changed source): `@helsoft/services`, `@helsoft/supabase-services`, `@helsoft/hooks`, `@helsoft/logging-in-out`, `@helsoft/study-buddy`.

### Scores

| Lib | total | killed | timeout | survived | errors | score |
|-----|------:|-------:|--------:|---------:|-------:|------:|
| `@helsoft/components` | 20 | 19 | 0 | 0 | 1 | 100.00% |
| `@helsoft/activities` | 52 | 50 | 0 | 1 | 1 | 98.04% |

Per-file:

| File | total | killed | survived | errors | score |
|------|------:|-------:|---------:|-------:|------:|
| `image-lightbox.helpers.ts` | 5 | 5 | 0 | 0 | 100.00% |
| `image-lightbox.tsx` | 15 | 14 | 0 | 1 | 100.00% |
| `image-lightbox.types.ts` | 0 | 0 | 0 | 1 | n/a (type-only) |
| `slide-image.tsx` | 52 | 50 | 1 | 1 | 98.04% |

### Errors (not survivors)

| File | note |
|------|------|
| `image-lightbox.types.ts` | Type-only file; mutant caused compile error (no runtime coverage) |
| `image-lightbox.tsx` | 1 compile/runtime error mutant excluded from score |
| `slide-image.tsx` | 1 compile/runtime error mutant excluded from score |

### Surviving mutants (1)

#### `src/organisms/slide-image/slide-image.tsx` (1)

| line | mutation |
|------|----------|
| 61:24 | `StringLiteral` — `dialogLabel={t('player.slideImage.dialog')}` → `dialogLabel={t("")}` |

Root cause: tests assert lightbox open/close and image props but do not assert the localized dialog accessibility label passed through to `ImageLightbox`.

### Notes

- `IconButton` revert removed `icon-button.tsx` from the review delta; prior 19 survivors on that file no longer apply.
- New null-guard test (`ImageLightbox does not focus when the dialog node is not mounted`) killed the prior `image-lightbox.tsx:21` conditional survivor.

---

## Post-review pass (round 2 — cap)

**Base ref:** `481cdf4ece90aca1572d9df22271f4875eeddb6c` (same review-fix delta; re-run after `dialogLabel` test)  
**Date:** 2026-07-20  
**Threshold:** 100% killed on changed lines in scope  
**Verdict:** **PASS**

### Scope

Same as post-review round 1.

### Scores

| Lib | total | killed | timeout | survived | errors | score |
|-----|------:|-------:|--------:|---------:|-------:|------:|
| `@helsoft/components` | 20 | 19 | 0 | 0 | 1 | 100.00% |
| `@helsoft/activities` | 52 | 51 | 0 | 0 | 1 | 100.00% |

Per-file:

| File | total | killed | survived | errors | score |
|------|------:|-------:|---------:|-------:|------:|
| `image-lightbox.helpers.ts` | 5 | 5 | 0 | 0 | 100.00% |
| `image-lightbox.tsx` | 15 | 14 | 0 | 1 | 100.00% |
| `image-lightbox.types.ts` | 0 | 0 | 0 | 1 | n/a (type-only) |
| `slide-image.tsx` | 52 | 51 | 0 | 1 | 100.00% |

### Errors (not survivors)

| File | note |
|------|------|
| `image-lightbox.types.ts` | Type-only file; mutant caused compile error (no runtime coverage) |
| `image-lightbox.tsx` | 1 compile/runtime error mutant excluded from score |
| `slide-image.tsx` | 1 compile/runtime error mutant excluded from score |

### Surviving mutants

None. Round 1 survivor `slide-image.tsx:61:24` killed by `SlideImage passes the localized dialog label to the lightbox`.
