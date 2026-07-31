# C4 — Component Diagram: Frontend Layering (Study Buddy App)

Level 3. Audience: developers. Zooms into the `Study Buddy App` container from
[c4-containers.md](./c4-containers.md) to show the layering enforced repo-wide by
`.agents/rules/hooks-service-dao.mdc`:

```
Component → Hook → Service → DAO → Supabase / Edge Function
```

This diagram uses the **lesson generation** vertical slice as the representative example — the
same pattern repeats for every feature (auth, PDF upload, lessons list, lesson attempts, API
key management, provider catalog), each with its own Component/Hook/Service/DAO set.

```mermaid
C4Component
  title Component Diagram - Frontend Layering (lesson-generation slice)

  ContainerDb(postgres, "Postgres", "Supabase", "documents, lessons, user_documents view")
  ContainerDb(storage, "Supabase Storage", "Object storage", "pdf-uploads bucket")
  Container(extractFn, "extract-pdf", "Edge Function", "Extracts text + images from an uploaded PDF")
  Container(generateFn, "generate-lesson", "Edge Function", "See c4-components-generate-lesson.md")

  Container_Boundary(app, "Study Buddy App") {
    Component(screen, "pdf-files.tsx", "Expo Router screen ((app)/(tabs)/)", "Routes to the PDF-files tab; composes ApiKeyGate + PdfDocuments")

    Component(pdfDocuments, "PdfDocuments", "@helsoft/study-buddy component", "Lists the caller's extracted PDFs (user_documents view) with the action each row needs: generate, retry, or open the produced lesson")

    Component(newLessonDialog, "NewLessonDialog", "@helsoft/study-buddy component", "Two-step dialog: upload/extract a PDF, then generate - composition picker (instructional/activity/both), provider+model picker (BYOK), progress state, error display")

    Component(lessonGeneration, "LessonGeneration", "@helsoft/study-buddy component", "Generate-step UI inside NewLessonDialog; owns the generate call + progress/error display")

    Component(useLessonGeneration, "useLessonGeneration", "@helsoft/hooks", "React integration: tracks generation status via a reducer, exposes generate(GenerateLessonRequest)/retry()")

    Component(lessonGenService, "LessonGenerationService", "@helsoft/supabase-services", "Validates composition input, maps DAO errors to typed GenerationErrorCode, no React")

    Component(lessonGenDao, "LessonGenerationDao", "@helsoft/supabase-services", "Raw data access: supabase.functions.invoke('generate-lesson', ...)")

    Component(pdfUploadDao, "PdfUploadDao", "@helsoft/supabase-services", "Raw data access: uploads to Storage, inserts documents, invokes extract-pdf")

    Component(pdfDao, "PdfDocumentsDao", "@helsoft/supabase-services", "Raw data access: reads the user_documents view; deletes a document + its storage objects")
  }

  Rel(screen, pdfDocuments, "Renders (ApiKeyGate wraps; create affordances gated by canCreate)")
  Rel(pdfDocuments, newLessonDialog, "Opens for upload/generate")
  Rel(newLessonDialog, lessonGeneration, "Renders generate step")

  Rel(pdfDocuments, pdfDao, "Reads the pending-PDFs list (via usePdfDocuments -> PdfDocumentsService, omitted for scope)")
  Rel(pdfDao, postgres, "Reads user_documents", "PostgREST")

  Rel(newLessonDialog, pdfUploadDao, "Uploads PDF + invokes extraction (via its own hook/service, omitted for scope)")
  Rel(pdfUploadDao, storage, "Writes raw PDF ({userId}/{documentId}/source.pdf)", "Storage API")
  Rel(pdfUploadDao, extractFn, "functions.invoke('extract-pdf')", "HTTPS/JSON")
  Rel(extractFn, postgres, "Writes pages + document_images", "SQL")

  Rel(lessonGeneration, useLessonGeneration, "Calls generate(GenerateLessonRequest)")
  Rel(useLessonGeneration, lessonGenService, "Delegates validation + orchestration")
  Rel(lessonGenService, lessonGenDao, "Calls generateLesson()")
  Rel(lessonGenDao, generateFn, "functions.invoke('generate-lesson')", "HTTPS/JSON")
  Rel(generateFn, postgres, "Persists the resulting lesson", "SQL")

  Rel(lessonGenService, useLessonGeneration, "Result or typed error")
  Rel(useLessonGeneration, lessonGeneration, "stage: idle, generating, content, or error")

  UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

## Notes

- **DAOs never appear in components.** Rel arrows to DAOs are shorthand — the real chain is
  component → hook → service → DAO (`hooks-service-dao.mdc`). Upload goes through its own
  hook/service (omitted for scope) into `PdfUploadDao`; generate goes
  `LessonGeneration` → `useLessonGeneration` → `LessonGenerationService` →
  `LessonGenerationDao`. `ApiKeyGate` always mounts children and only surfaces a notice when
  `!canCreate`; create/upload affordances gate on `useProfile().profile?.canCreate` inside
  `PdfDocuments`. Reviewers (`reviewer_slice`) check the layering rule on every slice.
- **Two DAO backends behind the same pattern.** `LessonGenerationDao` and `PdfUploadDao`
  invoke Edge Functions; other DAOs in the same lib (e.g. `LessonsDao`, `LessonAttemptDao`,
  `AiProvidersDao`, `PdfDocumentsDao`) talk to Postgres/Storage directly via PostgREST. The
  Hook/Service layers above them don't need to know which — that's the point of the DAO
  boundary.
- **State shape.** Service-backed hooks use TanStack Query (`useQuery`/`useMutation`) as the
  required default (`.agents/rules/tanstack-query.mdc`); `useLessonGeneration` is one of that
  rule's named exemptions and uses a `useReducer` (`use-lesson-generation.reducer.ts`) because
  generation has ≥3 related fields that change together (status, progress step, error, result) —
  per `state.mdc`.
- **Why this slice.** `lesson-generation` was picked as the representative example because it's
  the deepest chain in the app (component → hook → service → DAO → Edge Function → external AI
  call → persistence) and touches every layer described in `AGENTS.md`. Other features
  (lesson player, activities, saved lessons) follow the identical shape with shallower DAOs
  (straight to Postgres, no Edge Function hop). Settings/API keys use the same layering but
  `ApiKeyDao` invokes the `manage-api-key` Edge Function (Vault writes), like generation/upload.
