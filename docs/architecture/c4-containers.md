# C4 — Container Diagram: AI Study Buddy

Level 2. Audience: engineers, technical reviewers. Zooms into the `AI Study Buddy` system
boundary from [c4-context.md](./c4-context.md).

```mermaid
C4Container
  title Container Diagram - AI Study Buddy

  Person(learner, "Learner", "Studies PDFs turned into AI-generated lessons")

  System_Ext(aiProviders, "AI Providers", "Groq, OpenAI, Anthropic, Google, xAI, DeepSeek - hosted LLM inference, via Vercel AI SDK")

  System_Boundary(studyBuddy, "AI Study Buddy") {
    Container(app, "Study Buddy App", "Expo (React Native + react-native-web), Expo Router", "Universal app: upload, lesson generation, player, activities, results, settings - ships web/iOS/Android from one codebase")

    Container(authFn, "Supabase Auth", "GoTrue (Supabase-managed)", "Login / logout; issues the JWT every downstream call and RLS policy is scoped to (in-app sign-up out of scope — stub /sign-up only; accounts created in Supabase)")

    Container(extractFn, "extract-pdf", "Supabase Edge Function (Deno)", "Extracts selectable text + embedded images from an uploaded PDF; downscales/recompresses images; detects scanned/unsupported PDFs")

    Container(generateFn, "generate-lesson", "Supabase Edge Function (Deno) + Vercel AI SDK", "Routes the key source from the caller's plan (BYOK via Vault, or platform Groq key with per-user rate limits), builds the prompt from extracted text/images, calls the provider for a structured slide deck, places images, persists the lesson")

    Container(apiKeyFn, "manage-api-key", "Supabase Edge Function (Deno)", "Saves/removes the caller's per-provider AI keys server-side; returns masked status only - a key is never returned to the client after save")

    ContainerDb(postgres, "Postgres Database", "Supabase Postgres + RLS", "documents, document_images, lessons, lesson_attempts, user_ai_keys, plans, profiles, platform_generation_limits, ai_providers, ai_provider_models, user_documents view - every user-facing table scoped to auth.uid() via row-level security")

    ContainerDb(vault, "Vault (secrets)", "Supabase Vault", "Encrypted storage for the caller's AI provider API keys; referenced by user_ai_keys.secret_id, never exposed to the client")

    Container(storage, "Supabase Storage", "Object storage", "pdf-uploads bucket (raw PDFs at {user_id}/{document_id}/source.pdf) and pdf-images bucket (downscaled extracted images), keyed by user_id/document_id")
  }

  Rel(learner, app, "Uses", "HTTPS")

  Rel(app, authFn, "Logs in / logs out", "HTTPS")
  Rel(app, postgres, "Reads/deletes lessons; reads/writes attempts + document metadata; reads provider/model catalog and own profile+plan flags (PostgREST, RLS-scoped)", "HTTPS/JSON")
  Rel(app, storage, "Uploads raw PDF; fetches signed image URLs", "HTTPS")
  Rel(app, extractFn, "Invokes to extract an uploaded PDF", "HTTPS/JSON")
  Rel(app, generateFn, "Invokes to generate a lesson deck (documentId, composition, provider?, model?)", "HTTPS/JSON")
  Rel(app, apiKeyFn, "Invokes to save/remove an AI provider key", "HTTPS/JSON")

  Rel(extractFn, storage, "Reads the raw PDF; writes downscaled images", "Storage API")
  Rel(extractFn, postgres, "Writes extracted pages + document_images rows; marks failures with a typed error code", "SQL")

  Rel(generateFn, postgres, "Reads document pages/images (caller JWT); reads profile+plan, provider catalog, caller's key and rate-limit slots via service_role RPCs; persists the generated lesson", "SQL")
  Rel(generateFn, vault, "Resolves the encrypted BYOK key by secret_id (get_api_key RPC)", "SQL")
  Rel(generateFn, storage, "Reads extracted images for vision-model placement", "Storage API")
  Rel(generateFn, aiProviders, "Generates the structured slide deck (text model); falls back to the provider's vision model for unplaced images", "HTTPS / Vercel AI SDK")

  Rel(apiKeyFn, postgres, "Calls save_api_key / remove_api_key (SECURITY DEFINER RPCs, service_role only)", "SQL")
  Rel(apiKeyFn, vault, "Stores/removes the encrypted key", "SQL")

  UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

## Notes

- **Auth as a container, not glue.** `Supabase Auth` is drawn as its own container because
  every other container's data access is scoped by the JWT it issues (`auth.uid()` in RLS
  policies); it isn't an implementation detail of the app.
- **The client talks to Postgres directly for most CRUD.** Lesson attempts, document metadata,
  the provider/model catalog, and the caller's own profile+plan flags are read/written straight
  from the app via `@helsoft/supabase-services` DAOs (PostgREST under RLS). Lessons are
  **read/deleted** by the client; **inserts** come from `generate-lesson` under the caller JWT.
  Edge Functions are used only where server-side logic is required: extraction (parsing, image
  processing), generation (holding the AI key, calling the LLM), and API-key management (writing
  to Vault). This matches the "Component → Hook → Service → DAO" layering in `AGENTS.md`, just
  with two possible DAO backends (Postgres directly, or an Edge Function invocation) behind the
  same Service layer.
- **Entitlements are enforced server-side.** `generate-lesson` reads the caller's live
  `profiles.plan_id → plans.use_platform_key` flag with its service_role client and routes the
  key source accordingly: BYOK (per-provider key from Vault; missing → `missing_key`) or the
  platform Groq key gated by `acquire_platform_generation_slot` (5/min, 50/day per user →
  `rate_limited`). Clients cannot mutate `plan_id` (no UPDATE policy on `profiles`) and cannot
  call any of the key/slot RPCs (EXECUTE is service_role-only).
- **The provider catalog is data, not code.** `ai_providers`/`ai_provider_models` (read-only to
  authenticated users) drive the provider/model pickers in the app and are re-validated inside
  `generate-lesson` (unknown model → `invalid_model`, disabled provider → `provider_disabled`).
- **Three Edge Functions, three distinct responsibilities** — see
  [c4-components-generate-lesson.md](./c4-components-generate-lesson.md) for `generate-lesson`'s
  internals, the most complex of the three.
- **Vault is modeled as a separate container** from Postgres because it is a distinct trust
  boundary: `user_ai_keys` stores only a `secret_id` reference, and the actual key material never
  leaves Vault except inside the `generate-lesson` function's own process memory for the
  duration of one request.
- **No deployment/CI container yet.** R8 (GitHub Actions build + deploy for web) is not
  implemented (no `.github/workflows/`); web ships via a manual `expo export` + `eas deploy`
  script — this diagram reflects the system as built, not the target state.
