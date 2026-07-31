# C4 — Dynamic Diagram: Core Loop (Upload → Generate → Study → Score)

Audience: engineers, technical reviewers. Traces the PRD's headline flow — "upload → generate →
study → score" — across the containers from [c4-containers.md](./c4-containers.md), in call
order. Assumes the learner is already authenticated and either has a BYOK provider key saved or
is on the paid plan (platform key) — see `c4-components-generate-lesson.md` for
`manage-api-key` and key routing, not repeated here.

```mermaid
C4Dynamic
  title Dynamic Diagram - Core Loop

  Person(learner, "Learner")
  Container(app, "Study Buddy App", "Expo")
  Container(extractFn, "extract-pdf", "Edge Function")
  Container(generateFn, "generate-lesson", "Edge Function")
  ContainerDb(storage, "Supabase Storage", "Object storage")
  ContainerDb(postgres, "Postgres", "Supabase + RLS")
  System_Ext(aiProviders, "AI Provider", "LLM inference (routed: BYOK provider or platform Groq)")

  Rel(learner, app, "1. Selects a PDF to upload")
  Rel(app, storage, "2. Uploads raw PDF to pdf-uploads/{user_id}/{document_id}/source.pdf")
  Rel(app, postgres, "3. Inserts a documents row (status: processing)", "PostgREST")
  Rel(app, extractFn, "4. Invokes extract-pdf(documentId)")
  Rel(extractFn, storage, "5. Reads the raw PDF")
  Rel(extractFn, storage, "6. Writes downscaled/recompressed extracted images")
  Rel(extractFn, postgres, "7. Writes pages + document_images; sets status: extracted (or failed + error_code)")
  Rel(app, learner, "8. Shows extraction result / error")

  Rel(learner, app, "9. Picks lesson composition (instructional / activity / both) and, on BYOK, a provider + model from the catalog")
  Rel(app, generateFn, "10. Invokes generate-lesson(documentId, composition, provider?, model?)")
  Rel(generateFn, postgres, "11. Reads plan flags and routes the key source (BYOK key via Vault RPC, or platform key + rate-limit slot); reads document pages/images")
  Rel(generateFn, aiProviders, "12. generateObject - structured slide deck (plus vision fallback for unplaced images)")
  Rel(generateFn, postgres, "13. Inserts the lessons row (user_id = auth.uid())")
  Rel(generateFn, app, "14. Returns the generated lesson or a typed error code")

  Rel(learner, app, "15. Plays the lesson slide by slide; answers activity slides with immediate feedback (answers held in session state)")
  Rel(app, postgres, "16. Inserts a lesson_attempts row with the final score when the results slide is reached (once per session)")
  Rel(app, learner, "17. Shows the results summary (score, or completion state for instructional-only); retake starts a fresh attempt")

  UpdateLayoutConfig($c4ShapeInRow="4")
```

## Notes

- **Steps 1-8 (extraction) and 9-14 (generation) are two independent Edge Function round-trips**,
  not one call — the client owns the state transition between them and can retry a failed
  generation from the pending-PDFs list (`user_documents` view) without re-uploading or
  re-extracting.
- **Step 11 is the plan-based key routing** (R10): `profiles.plan_id → plans.use_platform_key`
  decides between the caller's BYOK key (Vault, `get_api_key`) and the platform Groq key
  (gated by `acquire_platform_generation_slot`, 5/min and 50/day per user).
- **Step 12 is itself two possible LLM calls** (text model, then a conditional vision-model call)
  — see [c4-components-generate-lesson.md](./c4-components-generate-lesson.md) for that detail;
  this diagram keeps generation as one logical step to stay readable end-to-end.
- **Steps 15-17 (player, activities, scoring) do not go through any Edge Function** — the app
  talks to Postgres directly (RLS-scoped) to persist the attempt, matching R7. In-session
  answers live in the player's reducer only; **mid-lesson resume (R9) is not implemented** —
  it remains a pending story (`user-stories/pending/resume-mid-lesson.md`), so closing the app
  mid-lesson restarts it from the first slide.
- Everything after step 1 assumes the learner is authenticated (`Supabase Auth`, per
  [c4-containers.md](./c4-containers.md)) — omitted here to keep the flow scoped to the core loop.
