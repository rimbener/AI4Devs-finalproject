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

## Post-review pass

**Base ref:** `481cdf4ece90aca1572d9df22271f4875eeddb6c` (pre-review sha; review-fix delta only)  
**Date:** 2026-07-20  
**Threshold:** 100% killed on changed lines in scope  
**Verdict:** **SURVIVORS** (54.55% — below 100% threshold)

### Scope

Changed source vs base (mutation-eligible libs only):

| Lib | Changed files |
|-----|---------------|
| `@helsoft/components` | `src/atoms/icon-button/icon-button.tsx`, `src/molecules/image-lightbox/image-lightbox.tsx`, `src/molecules/image-lightbox/image-lightbox.types.ts` |

Skipped (no changed source): `@helsoft/services`, `@helsoft/supabase-services`, `@helsoft/hooks`, `@helsoft/activities`, `@helsoft/logging-in-out`, `@helsoft/study-buddy`.

### Scores

| Lib | total | killed | timeout | survived | errors | score |
|-----|------:|-------:|--------:|---------:|-------:|------:|
| `@helsoft/components` | 46 | 24 | 0 | 20 | 2 | 54.55% |

Per-file:

| File | total | killed | survived | errors | score |
|------|------:|-------:|---------:|-------:|------:|
| `icon-button.tsx` | 26 | 7 | 19 | 1 | 26.92% |
| `image-lightbox.tsx` | 18 | 17 | 1 | 1 | 94.44% |
| `image-lightbox.types.ts` | 2 | 0 | 0 | 1 | n/a (type-only) |

### Errors (not survivors)

| File | note |
|------|------|
| `image-lightbox.types.ts` | Type-only file; mutant caused compile error (no runtime coverage) |
| `icon-button.tsx` | 1 compile/runtime error mutant excluded from score |
| `image-lightbox.tsx` | 1 compile/runtime error mutant excluded from score |

### Surviving mutants (20)

#### `src/atoms/icon-button/icon-button.tsx` (19)

| line | mutation |
|------|----------|
| 30:13 | `StringLiteral` — `variant = 'standard'` → `variant = ""` |
| 32:14 | `BooleanLiteral` — `selected = false` → `selected = true` |
| 42:22 | `ObjectLiteral` — `styles.useVariants({ variant })` → `styles.useVariants({})` |
| 45:12 | `ObjectLiteral` — foreground color map → `() => ({})` |
| 51:5 | `ArrayDeclaration` — `[theme]` → `[]` |
| 55:5 | `ArrowFunction` — state-layer opacity callback → `() => undefined` |
| 63:5 | `ArrayDeclaration` — `[disabled, press, hover, theme]` → `[]` |
| 77:42 | `ArithmeticOperator` — `Math.round(size * 0.6)` → `Math.round(size / 0.6)` |
| 86:17 | `StringLiteral` — `alignItems: 'center'` → `alignItems: ""` |
| 87:21 | `StringLiteral` — `justifyContent: 'center'` → `justifyContent: ""` |
| 90:15 | `StringLiteral` — `overflow: 'hidden'` → `overflow: ""` |
| 91:15 | `ObjectLiteral` — entire `variants` block → `variants: {}` |
| 92:16 | `ObjectLiteral` — `variant` variant map → `variant: {}` |
| 93:19 | `ObjectLiteral` — `standard: { backgroundColor: 'transparent' }` → `standard: {}` |
| 93:38 | `StringLiteral` — `backgroundColor: 'transparent'` → `backgroundColor: ""` |
| 94:17 | `ObjectLiteral` — `filled: { backgroundColor: theme.colors.primary }` → `filled: {}` |
| 95:16 | `ObjectLiteral` — `tonal: { backgroundColor: theme.colors.secondaryContainer }` → `tonal: {}` |
| 96:19 | `ObjectLiteral` — `outlined` variant styles → `outlined: {}` |
| 97:28 | `StringLiteral` — `backgroundColor: 'transparent'` → `backgroundColor: ""` |

Root cause: review added `IconButton` usage for 48dp close control; existing delete-control sizing tests exercise `IconButton` indirectly but do not assert variant, layout, icon scale, or theme styling — holes opened on newly touched `icon-button.tsx` lines.

#### `src/molecules/image-lightbox/image-lightbox.tsx` (1)

| line | mutation |
|------|----------|
| 21:9 | `ConditionalExpression` — `if (dialogRef.current)` → `if (true)` |

Root cause: focus-management guard survives because tests do not assert behavior when `dialogRef.current` is null before open.
