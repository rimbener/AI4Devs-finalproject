# C4 — Component Diagram: `generate-lesson` Edge Function

Level 3. Audience: developers. Zooms into the `generate-lesson` container from
[c4-containers.md](./c4-containers.md) — chosen because it is the richest container in the
system (key routing, prompt construction, structured-output validation, image placement, and
persistence all live here) and its internal seams matter for anyone changing generation
behavior.

Source: `supabase/functions/generate-lesson/index.ts` + `./_shared/*.ts`. Most pure modules are
hand-mirrored (or Jest-imported) from `libs/supabase-services/src/services/lesson-generation.*`;
edge-only seams include `lesson-generation.route.ts`, `lesson-generation.provider-factory.ts`,
`lesson-generation.validation.ts` (BYOK request validation), and `models.ts`.

```mermaid
C4Component
  title Component Diagram - generate-lesson Edge Function

  Container(app, "Study Buddy App", "Expo", "Triggers generation; receives the full GeneratedLesson on success")
  ContainerDb(postgres, "Postgres", "Supabase", "documents, document_images, lessons, profiles, plans, ai_providers, ai_provider_models, user_ai_keys, platform_generation_limits")
  ContainerDb(storage, "Supabase Storage", "Object storage", "pdf-images bucket")
  System_Ext(aiProviders, "AI Providers", "Groq, OpenAI, Anthropic, Google, xAI, DeepSeek")

  Container_Boundary(generateFn, "generate-lesson") {
    Component(httpHandler, "HTTP Handler", "Deno.serve (index.ts)", "Authenticates the caller's JWT, parses the request, orchestrates the pipeline below, maps outcomes to typed JSON responses; holds two Supabase clients (caller-JWT + service_role)")

    Component(keyRouting, "Key Routing", "lesson-generation.route.ts + lesson-generation.key-source.ts + lesson-generation.validation.ts", "Reads profiles.plan_id -> plans.use_platform_key; BYOK: validates the requested provider/model against the catalog (validation.ts) and resolves the caller's key via get_api_key; platform: uses PLATFORM_GROQ_API_KEY gated by acquire/release_platform_generation_slot RPCs")

    Component(catalog, "Provider Catalog", "../_shared/provider-catalog.ts", "Loads the ai_providers + ai_provider_models rows for the requested provider (enabled flag, model list, vision default) - the data-driven registry")

    Component(providerFactory, "Provider Factory", "lesson-generation.provider-factory.ts", "Maps a catalog provider id to its Vercel AI SDK client (createGroq / createOpenAI / createAnthropic / createGoogleGenerativeAI / createXai / createDeepSeek)")

    Component(promptBuilder, "Prompt Builder", "lesson-generation.prompt.ts", "Builds the deck prompt from extracted page text, the chosen composition (instructional-only / activity-only / both), and the image manifest (metadata only, no bytes)")

    Component(deckSchema, "Deck Schema", "lesson-generation.schema.ts (Zod)", "Structured-output schema the model must satisfy; enforced via generateObject")

    Component(placement, "Image Placement", "lesson-generation.placement.ts + lesson-generation.vision-model.ts", "Attaches extracted images to slides using position/description metadata; images with no metadata go to a vision-model fallback (the provider's catalog vision default)")

    Component(assembly, "Deck Assembly", "lesson-generation.assembly.ts", "Merges the validated deck, placed images, and composition rules into the final GeneratedLesson shape (ordered slides, minted lessonId)")

    Component(persist, "Persistence", "lesson-generation.persist.ts", "Inserts the lessons row under the caller's auth.uid(); marks the source document with a generation-failure code on error")

    Component(errors, "Error Mapping", "lesson-generation.errors.ts", "Maps SDK/timeout/validation/routing failures to the typed GenerationErrorCode contract the client understands")

    Component(models, "Platform Model ID", "models.ts", "Pins PLATFORM_TEXT_MODEL_ID (openai/gpt-oss-20b) for the platform-key path; all other provider/model metadata lives in the ai_providers / ai_provider_models catalog tables")
  }

  Rel(app, httpHandler, "POST (documentId, composition, provider?, model?)", "HTTPS/JSON")

  Rel(httpHandler, keyRouting, "Resolves the key source from the caller's plan")
  Rel(keyRouting, catalog, "Validates provider/model against the catalog")
  Rel(catalog, postgres, "Reads ai_providers + ai_provider_models", "SQL (service_role)")
  Rel(keyRouting, postgres, "Reads profiles+plans; get_api_key / acquire_platform_generation_slot RPCs", "SQL (service_role)")
  Rel(httpHandler, postgres, "Reads document pages + document_images", "SQL (caller JWT, RLS)")
  Rel(httpHandler, promptBuilder, "Builds prompt from pages + composition + image manifest")
  Rel(httpHandler, providerFactory, "Gets the SDK client for the routed provider")
  Rel(httpHandler, aiProviders, "generateObject(text model, prompt, deckSchema)", "Vercel AI SDK")
  Rel(httpHandler, deckSchema, "Validates the model's structured output")
  Rel(httpHandler, placement, "Places images by metadata; flags unresolved images")
  Rel(httpHandler, storage, "Reads image bytes for unresolved images (vision fallback)", "Storage API")
  Rel(httpHandler, aiProviders, "generateObject(vision model) - fallback placement for flagged images", "Vercel AI SDK")
  Rel(httpHandler, assembly, "Assembles final deck (slides + composition + placed images)")
  Rel(httpHandler, persist, "Persists the assembled lesson")
  Rel(persist, postgres, "INSERT lessons (user_id = auth.uid())", "SQL (caller JWT, RLS)")
  Rel(httpHandler, errors, "On any failure, maps to a typed error code")
  Rel(httpHandler, models, "Reads the platform text model id")
  Rel(httpHandler, app, "200 (GeneratedLesson) or a typed error", "HTTPS/JSON")

  UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

## Notes

- **HTTP Handler is thin by design.** `index.ts` is intentionally orchestration-only glue; every
  decision (routing, prompt shape, schema, placement rule, error mapping) lives in a pure,
  unit-testable module — a Deno-testing-gap mitigation (Jest/Stryker can't run against the Deno
  runtime in this sandbox).
- **Two Supabase clients, two trust levels.** Document/lesson reads and the final insert use the
  caller-JWT client (RLS applies); profile/plan, catalog, key, and rate-limit reads use the
  service_role client because those RPCs and tables are deliberately unreachable from clients.
- **Key routing is plan-driven (R10).** BYOK callers must name a catalog provider/model
  (`invalid_model` / `provider_disabled` otherwise) and have a stored key (`missing_key`);
  platform-key callers are pinned to Groq + `PLATFORM_TEXT_MODEL_ID` and rate-limited per user
  via `acquire_platform_generation_slot` (5/min, 50/day → `rate_limited`), with the slot released
  in a `finally`.
- **Vision fallback is conditional, not always-on.** The vision-model call (one call for all
  flagged images, model = the provider's `is_vision_default` catalog row) only happens for
  images `placement` can't resolve from text metadata (R2's placement rule); slides with no
  resolvable image render text-only rather than failing the whole generation.
- **Composition enforcement isn't a separate component** — it's a parameter threaded through
  `promptBuilder` and validated again in `assembly`/`deckSchema`, per R2.1 (`instructional-only`
  / `activity-only` / `both`).
- **The whole pipeline runs under a 120 s timeout** (`timeout` error code) and never persists a
  partial deck — schema failures throw before `persist` runs.
- **`manage-api-key` and `extract-pdf` are simpler** (HTTP handler + a few pure modules each) and
  are not diagrammed separately — their responsibilities are already fully captured at the
  container level in [c4-containers.md](./c4-containers.md).
