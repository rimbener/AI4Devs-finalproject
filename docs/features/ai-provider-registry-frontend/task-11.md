---
id: task-11
title: Delete the dead hardcoded provider/model constants and their locale keys
slice: 3
scenarios: [s23]
status: done
paths:
  - libs/types/src/ai-provider.ts
  - libs/types/src/ai-provider.test.ts
  - libs/types/src/api-key-settings.ts
  - libs/types/src/api-key-settings.test.ts
  - libs/types/src/index.ts
  - libs/localization/src/resources/en.ts
  - libs/localization/src/resources/es.ts
  - libs/localization/src/resources/pt.ts
  - libs/localization/src/resources/de.ts
  - libs/localization/src/coverage/migration-coverage.test.ts
---

## Goal
Now that every consumer (tasks 1–9) reads the live catalog instead, delete the hardcoded
`AI_PROVIDERS`, `AI_MODEL_REGISTRY`, `PROVIDER_NAME_KEYS`, `API_KEY_SETTINGS_GUIDANCE_URLS`
constants and the `aiModel.*`/`settings.apiKey.provider.*` locale keys they only existed to feed —
the backend story's D15 deliberately left this cleanup to this story.

## Done criteria
- [ ] Scenario s23 covered: a repo-wide search for `AI_PROVIDERS`, `AI_MODEL_REGISTRY`,
      `PROVIDER_NAME_KEYS`, `API_KEY_SETTINGS_GUIDANCE_URLS`, `aiModel.`, and
      `settings.apiKey.provider.` returns zero matches outside this task's own diff/history
- [ ] `libs/types/src/ai-provider.ts` keeps only the `AiProvider` union (Decision 3) — `AiModelEntry`,
      `AiProviderModels`, `AI_MODEL_REGISTRY`, `AI_PROVIDERS` and their `visionDefault`/model-list
      shapes are removed
- [ ] `libs/types/src/api-key-settings.ts` (only ever held `PROVIDER_NAME_KEYS`/
      `API_KEY_SETTINGS_GUIDANCE_URLS`) is deleted outright; its barrel export line removed from
      `libs/types/src/index.ts`
- [ ] `aiModel.*` and `settings.apiKey.provider.*` keys removed from all four locale bundles;
      `migration-coverage.test.ts`'s key-parity guard updated/still green
- [ ] No remaining test imports either deleted export (fix any that still do, per this task's own
      scope — not a cross-task leak)
- [ ] `pnpm lint` + `pnpm check-types` + `pnpm test` green for `@helsoft/types` and
      `@helsoft/localization`

## Notes
- Decision 3. Run this task **last** in the slice, after tasks 6–10 have removed every runtime
  reference — deleting these constants before every consumer has migrated would break the build,
  which is exactly why `tasks.md` orders cleanup after behavior.
- Double-check `libs/study-buddy/.storybook/mocks/hooks.ts` and every `*.stories.tsx` under
  `libs/components/src/organisms/{api-key-manager,api-key-form,api-key-form-dialog,
  lesson-generation-panel}` and `libs/study-buddy/src/components/{api-key-settings-screen,
  lesson-generation}` for a lingering import — Storybook files are easy to miss since they aren't
  covered by `pnpm test`.
