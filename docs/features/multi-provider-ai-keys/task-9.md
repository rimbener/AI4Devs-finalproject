---
id: task-9
title: Edge provider→createX factory (5 @ai-sdk pkgs) + registry mirror + model select + validation
slice: 2
scenarios: [s12, s17, s18]
status: done
paths: [supabase/functions/generate-lesson/index.ts, supabase/functions/generate-lesson/_shared/models.ts, supabase/functions/generate-lesson/deno.json]
---

## Goal
Add the five official `@ai-sdk/*` packages (`openai`, `anthropic`, `google`, `xai`, `deepseek`; groq already present) as `npm:` imports. Replace the hardcoded `createGroq` with a `provider → createX(apiKey)` factory map behind the existing `runGeneration`/`runVisionPlacement` seams. Hand-mirror `AI_MODEL_REGISTRY` + `AI_PROVIDERS` into `_shared/models.ts`. On a free-BYOK request: read the **requested provider's** stored key (`get_api_key(user, provider)`), select the requested `model`, and validate: provider/model must be in the registry → else `invalid_model`; provider must have a stored key → else `missing_key`. Platform path ignores provider/model (unchanged Groq).

## Done criteria
- [ ] Scenario(s) s12, s17, s18 covered by concrete Deno unit test(s) for the pure decision modules
- [ ] Factory map covers all six providers behind the seam; registry mirrored (parity note)
- [ ] `invalid_model` for unknown provider/model; `missing_key` for named provider without a key
- [ ] Chosen model used for the text call; key never returned/logged
- [ ] Manual live-verify note recorded (Deno outside Jest/Stryker; live keys unavailable in sandbox)

## Notes
Keep `get_api_key` provider-scoped (task-1). Extend the read path in `handleLessonGenerationRoute`/index to pass the requested provider. This is the riskiest task (live provider surface) — see risks.md.
