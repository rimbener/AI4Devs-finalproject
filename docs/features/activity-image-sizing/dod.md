# Definition of Done — activity-image-sizing

**Verdict:** PASS
_Validated by `dod_validator` on 2026-07-20 after biome format debt fix. Each item re-checked against the code, not trusted from prior reports._

## Accepted minors (documented risk-accepted, if any)
- _none_

## Functionality
- [x] All acceptance criteria met (the `@s` scenarios in `gherkin-scenarios.md`) — `@s1–@s12` mapped: `slide-image.test.tsx` (s1–s6,s10–s11), `image-lightbox.test.tsx` (s6–s9,s11), `player-locale-parity.test.ts` (s12)
- [x] 4 UI states implemented (if UI) — Content (`WithImage` story + signed URL), Empty (`NoImage`/s4), Loading (silent degrade `!url → null`, s5), Lightbox (`ImageLightbox` Open + expand flow)
- [x] Robust error handling; no undefined/crash states — unresolved URL / missing ref → `return null`; `useSlideImageUrl` never throws (hook test)

## Code quality
- [x] `pnpm lint` clean — exit 0, 12/12 tasks (2026-07-20 re-run)
- [x] `pnpm check-types` clean — exit 0, 12/12 tasks (2026-07-20 re-run)
- [x] `pnpm test` (unit + integration) green — `pnpm turbo run test --concurrency=2` exit 0, 12/12 tasks
- [x] `test:e2e` green where relevant — `@helsoft/components` image-lightbox e2e 2/2 pass; `@helsoft/activities` slide-image e2e 1/1 pass (full activities suite 3 unrelated failures in lesson-player/multiple-choice — not feature scope)
- [x] No TODOs without an issue; Conventional Commits — no TODO/FIXME in `slide-image/` or `image-lightbox/`; branch commits follow `feat|fix|test|chore(scope): …`

## Architecture
- [x] `Component→Hook→Service→DAO` respected; no cross-layer imports — `SlideImage` → `useSlideImageUrl` hook → `LessonImageService`; composes `ImageLightbox` molecule; no DAO in components
- [x] DTOs not leaked out of data/DAO; barrels updated — `ImageLightbox` exported via `libs/components/src/molecules/index.ts`; `SlideImageProps` uses `@helsoft/types` `SlideImageRef`
- [x] No unapproved dependencies — UI-only delta; no new package deps

## Design system
- [x] Tokens/existing components reused; correct atomic-design placement — `layout.contentReading`, `layout.touchTarget`, `IconButton`; molecule `ImageLightbox`, organism `SlideImage`
- [x] Storybook story per shared component (4 states) — `ImageLightbox` Open/Hidden; `SlideImage` WithImage/NoImage/UnresolvableImage cover feature states
- [x] Every component has a Jest unit test (`<name>.test.tsx`) — `image-lightbox.test.tsx` (10 tests), `slide-image.test.tsx` (14 tests)

## Security (OWASP)
- [x] No secrets/keys in code or logs; inputs validated — UI-only; signed URLs from existing service; `review.md` security N/A
- [x] Supabase RLS/auth respected; no PII in logs; TLS for external calls — no new data paths; existing `LessonImageService` unchanged

## Accessibility (WCAG 2.2 AA)
- [x] Labels/roles; contrast ≥ 4.5:1; touch targets ≥ 44/48; focus order; dynamic type — `review.md` APPROVED r2; tests assert 48dp filled controls, `role="dialog"`, focus restore, localized `accessibilityLabel`s

## Testing rigor
- [x] Every `@s` scenario covered — see Functionality mapping above
- [x] Mutation score threshold met on changed source (`.tsx` included) — `mutation.md` post-review round 2 **PASS** 100% (components 20/19 killed excl. type error; activities 52/51)

## Observability & i18n
- [x] Analytics events per spec; feature flag wrapping (if applicable) — none per `spec.md` locked decisions
- [x] No hardcoded strings — `SlideImage` uses `t('player.slideImage.{expand,close,dialog}')`; keys in en/es/pt/de + `player-locale-parity.test.ts`

---
**If PASS → `pr_ready`.** Opening & merging the PR is a manual human step → `done`.

**Lead ref:** re-validated after `0a4ae0401` biome format debt fix; `pnpm bootstrap` exit 0.
