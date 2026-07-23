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
