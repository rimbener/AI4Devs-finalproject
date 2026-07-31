# Architecture — C4 Diagrams

C4 model documentation for AI Study Buddy (see `PRD.md` for product context, `AGENTS.md` for
repo/layering conventions). Generated from the codebase as of 2026-07-31.

| Level | Diagram | File |
|---|---|---|
| 1 — Context | Learner ↔ AI Study Buddy ↔ AI providers (BYOK ×6 / platform Groq) | [c4-context.md](./c4-context.md) |
| 2 — Container | App, Auth, 3 Edge Functions, Postgres, Vault, Storage | [c4-containers.md](./c4-containers.md) |
| 3 — Component | `generate-lesson` Edge Function internals (incl. plan-based key routing) | [c4-components-generate-lesson.md](./c4-components-generate-lesson.md) |
| 3 — Component | Frontend Component→Hook→Service→DAO layering | [c4-components-frontend-layering.md](./c4-components-frontend-layering.md) |
| Dynamic | Core loop: upload → extract → generate → study → score | [c4-dynamic-core-loop.md](./c4-dynamic-core-loop.md) |
| Sequence | Generate lesson: auth → API key → PDF upload → extract → generate | [sequence-generate-lesson.md](./sequence-generate-lesson.md) |

No deployment diagram yet — R8 (GitHub Actions web build/deploy CI) isn't implemented in this
repo (no `.github/workflows/`); web deploys are a manual script
(`apps/app-study-buddy/scripts/deploy-web.sh` → `expo export` + `eas deploy` to EAS Hosting) and
backend deploys go through `npx supabase db push` / `functions deploy`. Add `c4-deployment.md`
once CI lands.

Each `.md` carries the diagram as Mermaid (the source of truth); the `.excalidraw` file next to
it is the same diagram as an editable canvas, regenerated 2026-07-31 to match.
