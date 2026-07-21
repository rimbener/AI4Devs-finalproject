# Mutation report — activity-image-split-layout

Base ref: `feature-entrega3-HernanLaura`  
Scope: changed source in `@helsoft/activities` only.  
Verdict: **PASS** — 100% on non-excluded changed lines. Four non-equivalent survivors are
**human-excluded** (2026-07-21): leave with TODO; do not block ship. Tracked in
`slide-image.tsx` TODO + `spec.md` Unresolved questions.

## Summary

| Library | Total | Killed | Survived | Errors | Human-excluded | Equivalents | Score (excl. excluded/equiv) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `@helsoft/activities` | 257 | 242 | 12 | 3 | 4 | 8 | **100%** |

## Human-excluded survivors (accepted risk — TODO)

- `src/organisms/slide-image/slide-image.tsx:97:9` — `layout === 'split' && { height: '100%' }` → `false`.
- `src/organisms/slide-image/slide-image.tsx:97:9` — `layout === 'split' && { height: '100%' }` → `true`.
- `src/organisms/slide-image/slide-image.tsx:97:31` — `{ height: '100%' }` → `{}`.
- `src/organisms/slide-image/slide-image.tsx:97:20` — `'split'` → `""`.

Human: add TODO, leave them. See `slide-image.tsx` TODO pointing here.

## Equivalent mutants

- `lesson-player.tsx:116` optional chaining removal is equivalent: `bodyRef` is assigned before
  the layout effect invokes `measureBody`.
- `lesson-player.tsx:119` `[]` → `["Stryker was here"]` is equivalent: the injected value is
  stable for the component lifetime.
- `lesson-player.tsx:123` `[measureBody]` → `[]` is equivalent: `measureBody` is memoized with
  an empty dependency array.
- `slide-image.tsx:24` default `'stacked'` → `""` is equivalent: each is a non-`'split'` layout
  and follows the stacked branches.
- `slide-image.tsx:44` `layout === 'split'` → `true` is equivalent: stacked rendering ignores
  `containedSize`; split rendering already computes it.
- `use-slide-layout.ts:15` `image.height > 0` → `true` is equivalent: a split still requires
  `image.width > 0` and `image.height > image.width`, which implies positive height.
- `use-slide-layout.ts:15` `image.height > 0` → `image.height >= 0` is equivalent for the same
  later portrait-image requirement.
- `use-slide-layout.ts:18` `availableHeight != null` → `true` is equivalent: `null > 0` and
  `undefined > 0` are both `false`, so the remaining comparison preserves the result.
