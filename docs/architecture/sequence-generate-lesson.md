# Sequence Diagram: Generate a Lesson (API Key + PDF Upload)

Audience: engineers, reviewers. End-to-end call flow for the PRD's "upload → generate"
path, including setup the C4 dynamic diagram omits (auth + BYO key). Complements
[c4-dynamic-core-loop.md](./c4-dynamic-core-loop.md) (same loop, C4Dynamic shape) and
[c4-containers.md](./c4-containers.md) (participants).

```mermaid
sequenceDiagram
  actor Learner
  participant App as Study Buddy App
  participant Auth as Supabase Auth
  participant ApiKeyFn as manage-api-key
  participant Vault as Vault
  participant DB as Postgres
  participant Storage as Supabase Storage
  participant ExtractFn as extract-pdf
  participant GenFn as generate-lesson
  participant LLM as AI Provider<br/>(Vercel AI SDK)

  %% --- Setup ---
  Learner->>App: Log in (accounts created in Supabase; in-app sign-up out of scope)
  App->>Auth: Authenticate
  Auth-->>App: Session (JWT)

  Learner->>App: Add AI API key (picks a catalog provider)
  App->>ApiKeyFn: Save key (action: save, provider, apiKey)
  ApiKeyFn->>Vault: Store encrypted key
  ApiKeyFn->>DB: Upsert user_ai_keys<br/>(user_id, provider, secret_id ref)
  ApiKeyFn-->>App: Masked key status (provider, updatedAt)
  App-->>Learner: Setup complete

  %% --- Upload & extract ---
  Learner->>App: Upload PDF
  App->>Storage: Upload to pdf-uploads/{user_id}/{document_id}/source.pdf
  App->>DB: Insert documents row<br/>(status: processing)
  App->>ExtractFn: extract-pdf(documentId)

  ExtractFn->>Storage: Read raw PDF
  ExtractFn->>ExtractFn: Extract text + images
  ExtractFn->>Storage: Write downscaled images<br/>(pdf-images)
  ExtractFn->>DB: Write pages + document_images;<br/>status: extracted (or failed)

  alt Extraction failed
    ExtractFn-->>App: Typed error
    App-->>Learner: Clear error message
  else Extraction OK
    ExtractFn-->>App: Success
    App-->>Learner: PDF ready
  end

  %% --- Generate lesson ---
  Learner->>App: Pick composition<br/>(instructional / activity / both)<br/>and, on BYOK, provider + model
  Learner->>App: Start generate lesson
  App->>GenFn: generate-lesson(documentId, composition, provider?, model?)

  GenFn->>DB: Read profiles.plan_id -> plans.use_platform_key

  alt BYOK plan (use_platform_key = false)
    GenFn->>DB: Validate provider/model against ai_providers catalog
    GenFn->>Vault: Resolve caller's key (get_api_key RPC)
    alt No API key
      GenFn-->>App: missing_key
      App-->>Learner: Guidance to add key
    else Key present
      GenFn->>DB: Load document pages/images (caller JWT, RLS)
      GenFn->>LLM: generateObject (structured deck; vision fallback for unplaced images)
      LLM-->>GenFn: Slide deck
      GenFn->>DB: Insert lessons row<br/>(user_id = auth.uid())
      GenFn-->>App: GeneratedLesson { lessonId, title, slides }
      App-->>Learner: Open lesson player
    end
  else Paid plan (use_platform_key = true)
    GenFn->>DB: acquire_platform_generation_slot (5/min, 50/day)
    alt Slot denied
      GenFn-->>App: rate_limited
      App-->>Learner: Try again later
    else Slot acquired
      Note over GenFn: Uses PLATFORM_GROQ_API_KEY (env),<br/>provider pinned to Groq
      GenFn->>DB: Load document pages/images (caller JWT, RLS)
      GenFn->>LLM: generateObject (structured deck; vision fallback for unplaced images)
      LLM-->>GenFn: Slide deck
      GenFn->>DB: Insert lessons row<br/>(user_id = auth.uid())
      GenFn-->>App: GeneratedLesson { lessonId, title, slides }
      App-->>Learner: Open lesson player
    end
  end
```

## Notes

- **`manage-api-key` is a separate Edge Function** from generation — a key never returns to
  the client after save (responses carry masked status only); `generate-lesson` resolves it
  server-side via Vault + `secret_id`. Keys are per provider: `user_ai_keys` has a composite
  `(user_id, provider)` primary key.
- **Key routing is plan-driven (R10)** and happens entirely server-side: the BYOK branch
  validates the requested provider/model against the `ai_providers`/`ai_provider_models`
  catalog (`invalid_model` / `provider_disabled`); the paid branch is pinned to Groq and gated
  by per-user rate-limit slots released in a `finally`.
- **Upload and extraction are two steps the app owns** — Storage write + `documents` insert,
  then `extract-pdf` invocation (same split as steps 1–8 in the dynamic diagram).
- **Composition choice happens after extraction**, before `generate-lesson` (R2.1).
- Providers are reached **only through the Vercel AI SDK inside `generate-lesson`**: Groq,
  OpenAI, Anthropic, Google, xAI, or DeepSeek for BYOK; Groq for the platform key — matching
  [c4-context.md](./c4-context.md).
