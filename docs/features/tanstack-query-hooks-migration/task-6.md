---
id: task-6
title: Migrate useSlideImageUrl to useQuery with a derived cache window; delete next-request-id
slice: 4
scenarios: [s24, s25, s26, s27, s28, s29]
status: done
paths: [libs/hooks/src/hooks/use-slide-image-url.ts, libs/hooks/src/hooks/next-request-id.ts, libs/hooks/src/hooks/next-request-id.test.ts, libs/hooks/src/hooks/use-slide-image-url.test.ts, libs/hooks/src/hooks/lesson-player.integration.test.ts]
---

## Goal
Replace the `useState` + `requestId` machinery in `useSlideImageUrl` with `useQuery(['lesson-image', storagePath])`, gated by `enabled: Boolean(imageRef?.storagePath)`. Set **both** `staleTime` and `gcTime` from the exported `SIGNED_URL_TTL_SECONDS` (**D6**) so re-viewing a slide serves the cache without a second signing call, while a served hit is always still a valid URL. Return the unchanged `{ url, isLoading }`. Delete `next-request-id.ts` and its test — after this task it has no importers.

## Done criteria
- [x] Scenario(s) s24, s25, s26, s27, s28, s29 covered by concrete tests
- [x] `staleTime` **and** `gcTime` both derived from `SIGNED_URL_TTL_SECONDS` (e.g. `(TTL - 60) * 1000`), both strictly under the TTL — no hard-coded `240_000`
- [x] `url` is `data ?? null`; the hook never throws (s27)
- [x] `isLoading` matches today exactly: `false` when the ref is absent (disabled query), `true` synchronously on the first render when a ref is present
- [x] Stale-response handling comes from the key changing with `storagePath` (s28) — no manual guard
- [x] `next-request-id.ts` and `next-request-id.test.ts` deleted; no importers remain anywhere
- [x] `lesson-player.integration.test.ts` passes with the same wrapper, otherwise unedited
- [x] `pnpm lint` + `pnpm check-types` + `pnpm test` green

## Notes
`gcTime` alone would **not** have delivered the story's stated benefit: `gcTime` governs how long an *unobserved* entry survives, while the default `staleTime: 0` makes every remount refetch. Without `staleTime` the cached URL renders instantly but the service is still called on every re-view. Both are required — this is the substance of D6.

**No retry decision is needed.** `LessonImageService.getSignedImageUrl` catches internally and resolves `null` (it also returns `null` for an invalid path), so the query can never enter an error state and the stock 3× retry never engages. `retry: false` is optional self-documentation, not a requirement.

v5's `isLoading` is `isPending && isFetching`, so a disabled query reports `false` with no manual derivation — unlike `useProfile`/`useApiKey`, which must OR in the session state.

Depends on task-5 for the exported constant.
