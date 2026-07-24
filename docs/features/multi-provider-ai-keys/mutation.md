# Mutation testing — multi-provider-ai-keys (StrykerJS)

Post R3 fix run. Base ref: `5aaa7ae98`. Scoped to changed source only.

## Verdict: **SURVIVORS** (threshold 100% not met)

| Lib | total | killed | timeout | survived | no cov | score |
|---|---:|---:|---:|---:|---:|---:|
| @helsoft/services | 13 | 12 | 0 | 1 | 0 | **92.31%** |
| @helsoft/supabase-services | 81 | 80 | 0 | 1 | 0 | **98.77%** |
| @helsoft/hooks | 83 | 48 | 28 | 7 | 0 | **91.57%** |
| @helsoft/components | 296 | 280 | 0 | 15 | 1 | **94.59%** |
| @helsoft/activities | 41 | 40 | 0 | 1 | 0 | **97.56%** |
| @helsoft/study-buddy | 290 | 246 | 28 | 16 | 0 | **94.48%** |
| **Overall (6 libs)** | **804** | **706** | **56** | **41** | **1** | **94.78%** |

R2 final: 804 total / 63 survived / 48 timeout / 86.07%. R3: −22 survivors, +8 timeouts, +8.71 pts score.

Out of scope (no Stryker config): `libs/types`, `libs/localization`, `supabase/functions`.

---

## Equivalent mutants (excluded from kill requirement)

| file:line | mutation | justification |
|---|---|---|
| `src/services/generation-preference.service.ts:8:7` | `ConditionalExpression` — `typeof parsed === 'object' &&` → `true &&` | Redundant guard: subsequent checks (`parsed !== null`, `'provider' in parsed`, `'model' in parsed`, string type checks) reject all inputs where `typeof !== 'object'`; same null/false outcome for every `JSON.parse` input the tests exercise (see `tdd.md` R3). |
| `src/dao/api-key.dao.ts:6:3` | `ConditionalExpression` — `typeof value === 'object' &&` → `true &&` | Same pattern: `value !== null`, `'keys' in value`, `Array.isArray(value.keys)` already reject non-objects; equivalent for all invoke payloads under test (see `tdd.md` R3). |

**Adjusted actionable survivors:** 39 (41 − 2 equivalent). Threshold still fails: 39 survivors + 56 timeouts + 1 no-cov.

---

## Surviving mutants

### @helsoft/services (0 actionable — 1 equivalent)

See equivalent table above.

### @helsoft/supabase-services (0 actionable — 1 equivalent)

See equivalent table above.

### @helsoft/hooks (7)

| file:line | mutation |
|---|---|
| `src/hooks/use-api-key.ts:70:6` | `ArrayDeclaration` — `}, []);` → `}, ["Stryker was here"]);` |
| `src/hooks/use-api-key.ts:75:5` | `ArrayDeclaration` — `[runMutation],` → `[],` |
| `src/hooks/use-api-key.ts:79:5` | `ArrayDeclaration` — `[runMutation],` → `[],` |
| `src/hooks/use-profile.ts:30:9` | `ConditionalExpression` — `if (skip) return;` → `if (false) return;` |
| `src/hooks/use-profile.ts:31:16` | `UpdateOperator` — `++requestId.current` → `--requestId.current` |
| `src/hooks/use-profile.ts:45:6` | `ArrayDeclaration` — `}, [skip]);` → `}, []);` |
| `src/hooks/use-profile.ts:48:9` | `ConditionalExpression` — `if (skip) return;` → `if (false) return;` |

### @helsoft/components (15)

| file:line | mutation |
|---|---|
| `src/organisms/api-key-form/api-key-form.tsx:95:22` | `StringLiteral` — `label={t('settings.apiKey.inputLabel')}` → `label={t("")}` |
| `src/organisms/api-key-manager/api-key-manager.tsx:57:9` | `ConditionalExpression` — `if (formProvider) {` → `if (true) {` |
| `src/organisms/api-key-manager/api-key-manager.tsx:84:8` | `MethodExpression` — `AI_PROVIDERS.filter((p) => savedProviders.has(p)).map` → `AI_PROVIDERS.map` |
| `src/organisms/api-key-manager/api-key-manager.tsx:86:13` | `ConditionalExpression` — `if (!key) return null;` → `if (false) return null;` |
| `src/organisms/api-key-manager/api-key-manager.tsx:117:22` | `StringLiteral` — `label={t('settings.apiKey.inputLabel')}` → `label={t("")}` |
| `src/organisms/api-key-manager/api-key-manager.tsx:131:21` | `ConditionalExpression` — `if (url) void Linking.openURL(url)...` → `if (true) void Linking.openURL(url)...` |
| `src/organisms/api-key-manager/api-key-manager.tsx:179:15` | `ConditionalExpression` — `if (p) onRemove(p);` → `if (true) onRemove(p);` |
| `src/organisms/lesson-generation-panel/lesson-generation-panel.tsx:47:17` | `BooleanLiteral` — `showPickers = false` → `showPickers = true` |
| `src/organisms/lesson-generation-panel/lesson-generation-panel.tsx:48:24` | `BooleanLiteral` — `showMissingKeyGate = false` → `showMissingKeyGate = true` |
| `src/organisms/lesson-generation-panel/lesson-generation-panel.tsx:50:20` | `ArrayDeclaration` — `savedProviders = []` → `savedProviders = ["Stryker was here"]` |
| `src/organisms/lesson-generation-panel/lesson-generation-panel.tsx:51:18` | `ArrayDeclaration` — `modelOptions = []` → `modelOptions = ["Stryker was here"]` |
| `src/organisms/lesson-generation-panel/lesson-generation-panel.tsx:89:39` | `StringLiteral` — `accessibilityLabel={t('generation.provider.heading')}` → `accessibilityLabel={t("")}` |
| `src/organisms/lesson-generation-panel/lesson-generation-panel.tsx:100:43` | `OptionalChaining` — `modelOptions[0]?.id` → `modelOptions[0].id` |
| `src/organisms/lesson-generation-panel/lesson-generation-panel.tsx:103:41` | `StringLiteral` — `accessibilityLabel={t('generation.model.heading')}` → `accessibilityLabel={t("")}` |
| `src/organisms/lesson-generation-panel/lesson-generation-panel.tsx:111:43` | `StringLiteral` — `{t('generation.composition.heading')}` → `{t("")}` |

### @helsoft/activities (1)

| file:line | mutation |
|---|---|
| `src/organisms/slide-image/use-slide-image.ts:14:49` | `StringLiteral` — `layout = 'stacked'` → `layout = ""` |

### @helsoft/study-buddy (16)

| file:line | mutation |
|---|---|
| `src/components/lesson-generation/lesson-generation.tsx:73:9` | `ConditionalExpression` — `if (showPickers && selectedProvider && selectedModel)` → `if (true && selectedModel)` |
| `src/components/lesson-generation/lesson-generation.tsx:73:9` | `LogicalOperator` — `if (showPickers && selectedProvider && selectedModel)` → `if (showPickers \|\| selectedProvider && selectedModel)` |
| `src/components/lesson-generation/lesson-generation.tsx:98:6` | `ArrayDeclaration` — `}, []);` → `}, ["Stryker was here"]);` |
| `src/components/lesson-generation/lesson-generation.tsx:104:5` | `ArrayDeclaration` — `[selectProvider],` → `[],` |
| `src/components/lesson-generation/lesson-generation.tsx:111:5` | `ArrayDeclaration` — `[setSelectedModel],` → `[],` |
| `src/components/lesson-generation/use-lesson-generation.ts:41:25` | `ConditionalExpression` — `if (!showPickers \|\| savedProviders.length === 0) return;` → `if (!showPickers \|\| false) return;` |
| `src/components/lesson-generation/use-lesson-generation.ts:47:11` | `ConditionalExpression` — `if (cancelled) return;` → `if (false) return;` |
| `src/components/lesson-generation/use-lesson-generation.ts:54:18` | `BlockStatement` — cleanup `return () => { cancelled = true; };` → `return () => {};` |
| `src/components/lesson-generation/use-lesson-generation.ts:55:19` | `BooleanLiteral` — `cancelled = true;` → `cancelled = false;` |
| `src/components/lesson-generation/use-lesson-generation.ts:64:9` | `ConditionalExpression` — `if (showPickers && selectedProvider && selectedModel)` → `if (true && selectedModel)` |
| `src/components/lesson-generation/use-lesson-generation.ts:64:9` | `LogicalOperator` — `if (showPickers && selectedProvider && selectedModel)` → `if (showPickers \|\| selectedProvider && selectedModel)` |
| `src/components/lesson-generation/use-lesson-generation.ts:73:22` | `OptionalChaining` — `AI_MODEL_REGISTRY[provider].models[0]?.id` → `AI_MODEL_REGISTRY[provider].models[0].id` |
| `src/components/new-lesson-dialog/new-lesson-dialog.tsx:52:10` | `ConditionalExpression` — `{step === 'upload' ? ...}` → `{true ? ...}` |
| `src/components/new-lesson-dialog/new-lesson-dialog.tsx:52:10` | `ConditionalExpression` — `{step === 'upload' ? ...}` → `{false ? ...}` |
| `src/components/new-lesson-dialog/new-lesson-dialog.tsx:52:10` | `EqualityOperator` — `{step === 'upload' ? ...}` → `{step !== 'upload' ? ...}` |
| `src/components/new-lesson-dialog/new-lesson-dialog.tsx:52:19` | `StringLiteral` — `{step === 'upload' ? ...}` → `{step === "" ? ...}` |

## No-coverage mutants (also block 100%)

### @helsoft/components (1)

| file:line | mutation |
|---|---|
| `src/organisms/lesson-generation-panel/lesson-generation-panel.tsx:100:66` | `StringLiteral` — `?? ''` → `?? "Stryker was here!"` |

## Timeouts (also block 100%)

### @helsoft/hooks (28)

| file | killed | timeout | survived |
|---|---:|---:|---:|
| `use-api-key.reducer.ts` | 8 | 2 | 0 |
| `use-api-key.ts` | 20 | 11 | 3 |
| `use-profile.ts` | 20 | 15 | 4 |

### @helsoft/study-buddy (28)

| file | killed | timeout | survived |
|---|---:|---:|---:|
| `lesson-generation.helpers.ts` | 70 | 8 | 0 |
| `lesson-generation.tsx` | 73 | 3 | 5 |
| `use-lesson-generation.ts` | 39 | 17 | 7 |
| `new-lesson-dialog.tsx` | 16 | 0 | 4 |

---

## Route

Hand to `implementer`:

1. **use-profile stale-request guards** — skip early returns, requestId increment, `[skip]` deps (`use-profile.ts:30–31,45,48`).
2. **use-api-key callback deps** — `useCallback` dependency arrays for save/remove/runMutation (`use-api-key.ts:70,75,79`).
3. **Preference-load cancellation** — `use-lesson-generation.ts` cancelled flag + cleanup + empty savedProviders guard.
4. **Picker persistence guards** — `showPickers && selectedProvider && selectedModel` in lesson-generation + panel default-prop mutants.
5. **Step routing** — `new-lesson-dialog.tsx:52` upload-step conditional (4 survivors).
6. **UI/i18n literals** — StringLiteral survivors on labels/headings need content/key assertions (api-key-form, api-key-manager, lesson-generation-panel).
7. **api-key-manager logic** — formProvider guard, saved-row filter, null-key guard, Linking URL guard, remove provider guard.
8. **slide-image default** — explicit `layout='stacked'` vs empty-string default (`use-slide-image.ts:14`).
9. **No-coverage** — exercise fallback when `modelOptions[0]?.id` is undefined (`lesson-generation-panel.tsx:100:66`).
10. **Timeouts** — isolate/speed tests for hooks + use-lesson-generation (56 total, up from 48).

Re-run mutation after fixes; 100% required on changed lines (equivalents excluded) before DoD.
