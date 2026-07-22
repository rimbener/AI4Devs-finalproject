---
feature: multi-provider-ai-keys
phase: approved # pending|spec_drafted|spec_ready|approved|in_progress|in_review|mutation|pr_ready|done
review_round: 0     # incremented by reviews_lead; cap 2
---

# Tasks — multi-provider-ai-keys
Index only. **Each `task-N.md` owns its `slice`, `scenarios`, `status`, `paths`.**

## Slice 1 — multi-key storage & settings
| Task | Title | Scenarios |
|---|---|---|
| task-1 | Composite-PK migration + provider-scoped RPCs | s4, s5, s9 |
| task-2 | Types: widen AiProvider, AI_MODEL_REGISTRY, ApiKeyStatus reshape | s3, s6, s9 |
| task-3 | Multi-key api-key DAO + Service | s2, s4, s5, s9 |
| task-4 | manage-api-key Edge: widen allow-list + provider-scoped remove | s2, s4, s5, s9 |
| task-5 | useApiKey multi-key hook + derived hasKey | s1, s4, s5, s7, s8 |
| task-6 | ApiKeyManager organism + ApiKeyForm refactor + ApiKeySettings + i18n | s1, s2, s3, s6, s7, s8, s9 |

## Slice 2 — generate pickers, server routing & vision
| Task | Title | Scenarios |
|---|---|---|
| task-7 | New `invalid_model` error code across mirrored contract + i18n | s18 |
| task-8 | GenerateLessonRequest += provider?/model? (client + Deno mirror + service/DAO) | s12 |
| task-9 | Edge provider→createX factory (5 @ai-sdk pkgs) + registry mirror + model select + validation | s12, s17, s18 |
| task-10 | Edge vision auto-selection + null-vision degrade | s13, s14, s15 |
| task-11 | LessonGenerationPanel provider + model RadioGroups (free-BYOK only) + i18n | s10, s11, s16, s19 |
| task-12 | LessonGeneration wiring: saved providers + registry, free-BYOK gating | s10, s11, s16, s19 |

## Slice 3 — remember last-used
| Task | Title | Scenarios |
|---|---|---|
| task-13 | GenerationPreferenceDao + Service (@helsoft/services) | s20, s21 |
| task-14 | LessonGeneration preselect-on-open (validated fallback) + write-on-generate | s20, s21 |
