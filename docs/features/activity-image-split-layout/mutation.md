# Mutation report — activity-image-split-layout

Base ref: `feature-entrega3-HernanLaura`  
Scope: seven changed source files in `@helsoft/activities`.  
Verdict: **ACCEPTED SURVIVORS** — human accepted leaving four non-equivalent survivors with a
TODO in `slide-image.tsx`; the 100% threshold remains unmet.

## Summary

| Library | Total | Killed | Survived | Errors | Score |
| --- | ---: | ---: | ---: | ---: | ---: |
| `@helsoft/activities` | 257 | 242 | 12 | 3 | 95.28% |

## Non-equivalent survivors

- `src/organisms/slide-image/slide-image.tsx:97:9` — conditional style spread
  `layout === 'split' && { height: '100%' }` → `false`.
- `src/organisms/slide-image/slide-image.tsx:97:9` — conditional style spread
  `layout === 'split' && { height: '100%' }` → `true`.
- `src/organisms/slide-image/slide-image.tsx:97:31` — style object
  `{ height: '100%' }` → `{}`.
- `src/organisms/slide-image/slide-image.tsx:97:20` — split literal `'split'` → `""`.

These all change the container height contract: split images must fill their pane, while stacked
images must remain content-sized.

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
