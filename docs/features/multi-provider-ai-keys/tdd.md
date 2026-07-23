# TDD Log — multi-provider-ai-keys

## @s → test map

| @s  | Test file | Description |
|-----|-----------|-------------|
| @s1 | composite-pk-migration.test.ts | composite PK + CHECK constraint + RPC redefinition |
| @s1 | ai-provider.test.ts | AiProvider union + AI_PROVIDERS order + AI_MODEL_REGISTRY coverage |
| @s1 | api-key.dao.test.ts | saveApiKey/getApiKeyStatus/removeApiKey multi-key DAO |
| @s1 | api-key.service.test.ts | provider-scoped service layer + ApiKeyStatus shape |
| @s1 | use-api-key.test.ts | multi-key hook + derived hasKey + saveApiKey(provider,key) |
| @s1 | api-key-form.test.tsx | savedKey prop refactor (Empty/Content/Loading/Error) |
| @s1 | use-api-key-manager.test.ts | derived provider lists + form/confirm state setters |
| @s1 | api-key-manager.test.tsx | empty state, add flow, onSave(provider,key) |
| @s2 | api-key-manager.test.tsx | isSubmitting disables Save + progress label |
| @s3 | api-key-manager.test.tsx | masked row renders for saved provider |
| @s4 | api-key-form.test.tsx | Replace flow + reverts to masked on success |
| @s4 | api-key.integration.test.ts | replace one provider leaves other key unchanged |
| @s4 | api-key-manager.test.tsx | provider-scoped Replace/Remove a11y labels |
| @s5 | api-key-form.test.tsx | Save disabled until non-blank key, guidance link |
| @s6 | api-key-manager.test.tsx | Add section shows only unsaved providers |
| @s7 | api-key-manager.test.tsx | error banner visible |
| @s8 | api-key-manager.test.tsx | Remove confirm dialog → onRemove(provider) |
| @s9 | api-key-manager.test.tsx | error banner with saved row |
| @s1-9 | api-key-settings.test.tsx | ApiKeySettings → ApiKeyManager wiring |
| @s1-9 | api-key.integration.test.ts | hook→service→DAO chain multi-key integration |

## Slice 2 (@s10–@s19)

| @s | Test file | Description |
|----|-----------|-------------|
| @s18 | lesson-generation.test.ts | GenerationErrorCode += invalid_model (11 codes) |
| @s18 | lesson-generation.helpers.test.ts | invalid_model i18n key + none recovery |
| @s18 | lesson-generation.service.test.ts | invalid_model server normalization |
| @s12 | lesson-generation.test.ts | GenerateLessonRequest optional provider/model |
| @s12 | lesson-generation.dao.test.ts | DAO forwards provider/model in invoke body |
| @s12 | lesson-generation.service.test.ts | service delegates provider/model unchanged |
| @s12/@s17/@s18 | lesson-generation.validation.test.ts | BYOK validate + missing_key + invalid_model |
| @s12/@s17/@s18 | lesson-generation.key-routing.integration.test.ts | route BYOK/platform key paths |
| @s13/@s14/@s15 | lesson-generation.vision-model.test.ts | vision auto-select + null degrade |
| @s10/@s11/@s16/@s19 | lesson-generation-panel.test.tsx | pickers free-BYOK-only + controlled |
| @s10/@s11/@s16/@s19 | lesson-generation-panel.e2e.js | Storybook e2e pickers visible/hidden |
| @s10/@s11/@s16/@s19 | lesson-generation.test.tsx | wiring saved providers + platform gate |
| @s16 | lesson-generation.test.tsx | missing-key gate blocks generate + settings path |
| @s16 | use-lesson-generation.test.ts | showMissingKeyGate + null generate request |
| @s10–@s12 | lesson-generation.integration.test.tsx | full stack sends provider/model BYOK |

## Slice-2 review rework (R1)

| Finding | Cycle |
|---------|-------|
| F1 @s16 gate | RED wiring test → GREEN showMissingKeyGate + canGenerate guard + ApiKeyRequiredNotice |
| F2 @s16 tdd | RED use-lesson-generation.test.ts → GREEN buildGenerateRequest null when gated |
| F3 task-11 story | RED e2e FreeByokMissingKey → GREEN story + panel showMissingKeyGate prop |
| F4 component-split | RED hook test file → GREEN useLessonGenerationForm co-located hook |

## Slice-2 cycles (summary)

- **T7** RED invalid_model tests → GREEN types/service/helpers/i18n (422, none recovery)
- **T8** RED optional provider/model tests → GREEN types/DAO/Deno mirror pass-through
- **T9** RED validation tests → GREEN registry mirror + factory + route BYOK resolve
- **T10** RED vision-model tests → GREEN resolveVisionModelForPlacement + index seam
- **T11** RED panel picker tests → GREEN RadioGroups + stories + e2e + i18n
- **T12** RED wiring tests → GREEN useApiKey/useProfile + selection reset + generate body

Manual live-verify (task-9/10): Deno `@ai-sdk/*` factory + vision calls — not run in sandbox.

## Slice-1 review rework (R2)

| Finding | Cycle |
|---------|-------|
| F1 component-split | handlers → api-key-manager.tsx; hook exposes setters + derived only |
| F2 tdd | removed dead ApiKeyFormLabels |
| F3 @s9 | api-key-manager.test.tsx banner + masked row together |
| F4 scope | reverted new-lesson-dialog.tsx |
| F5 scope | reverted localization-provider.tsx |
| F6 design | Error story includes savedKeys + errorMessage |

## Slice-1 review rework (R1)

| Finding | Cycle |
|---------|-------|
| F1 component-split | RED: use-api-key-manager.test.ts → GREEN: hook + slim component |
| F2 i18n | providerNames → providerNameKeys |
| F3 tdd | removed dead ApiKeyFormProps.provider |
| F4 scope | reverted icon-button + slide-progress tests |
| F5 a11y | provider-scoped Replace/Remove accessibilityLabel |
| F6 @s4 | integration test: other provider unchanged on replace |

## Cycles summary

- **T1–T6** see R1 table; slice-1 tasks 1–6 done
