# TDD Log — multi-provider-ai-keys

## @s → test map (mutation R3 highlights)

| Cluster | Test file | @s / mutant target |
|---------|-----------|-------------------|
| profile session guards | use-profile.test.ts | isSessionLoading + session without user |
| api-key callback deps | use-api-key.test.ts | save/remove after rerender |
| picker persist guards | use-lesson-generation.test.ts | buildGenerateRequest w/o model |
| handleGenerate persist | lesson-generation.test.tsx | mocked form, no model → no setStoredPreference |
| step routing | new-lesson-dialog.test.tsx | upload vs generate step isolation |
| i18n/style survivors | api-key-manager.test.tsx | t() keys, typography spreads, row filter |
| panel defaults/i18n | lesson-generation-panel.test.tsx | default props, provider fallback, typography |
| slide-image default | use-slide-image.test.ts | layout stacked vs split |
| equivalent (documented) | — | typeof===object guards (services + dao) |

## Mutation rework (R3 — 63 survivors + 48 timeout)

| Cluster | Cycle |
|---------|-------|
| hooks perf | RED configure asyncUtilTimeout 2s + jest 8s → hooks jest-setup-after.ts |
| profile guards | RED session loading w/ user id + session w/o user → GREEN use-profile.test.ts |
| api-key deps | RED save then remove after rerender → GREEN use-api-key.test.ts |
| buildGenerateRequest | RED clear model omits provider/model → GREEN use-lesson-generation.test.ts |
| handleGenerate | RED mock form selectedModel undefined → GREEN lesson-generation.test.tsx |
| dialog routing | RED generate hides upload / upload hides generation → GREEN new-lesson-dialog.test.tsx |
| manager i18n/style | RED typography toMatchObject + row count + provider label binding + radio checked → GREEN api-key-manager.test.tsx |
| panel i18n/style | RED heading/summary colors + provider default + stray providers → GREEN lesson-generation-panel.test.tsx |
| slide layout | RED explicit split vs stacked containedSize → GREEN use-slide-image.test.ts |
| equivalent mutants | `generation-preference.service.ts:8` + `api-key.dao.ts:6` — typeof check redundant given null/string/`in`/`Array.isArray` guards; same null/false for all JSON.parse inputs |

## Prior rounds (abbrev)

R1: services/supabase guards, hooks reducer/session, components i18n/styles, study-buddy wiring, activities use-slide-image.

R2: hooks TS fixes, boolean JSON guards, Linking/guidance, StyleSheet spacing, panel defaults, platform persist guards.

Slice 1–2 @s map: api-key dao/service/hook/manager/form; lesson-generation panel/pickers/platform gate (see git history / prior tdd if needed).
