---
feature: ai-provider-registry-backend
phase: pr_ready # pending|spec_drafted|spec_ready|approved|in_progress|in_review|mutation|pr_ready|done
review_round: 2     # incremented by reviews_lead; cap 2
---

# Tasks — ai-provider-registry-backend
Index only. **Each `task-N.md` owns its `slice`, `scenarios`, `status`, `paths`** — do **not** duplicate them here. `orchestrator_lead` owns `phase`; `implementer` flips each task's `status`.

Logic-only feature: slices split by **risk** (happy path → error/edge → integrity & verification) per `tdd.mdc`, not by the 4 UI states.

- **Slice 1** (schema, seed, catalog read, BYOK happy path): [task-1](./task-1.md) · [task-2](./task-2.md) · [task-3](./task-3.md) · [task-4](./task-4.md) · [task-5](./task-5.md) · [task-6](./task-6.md)
- **Slice 2** (`enabled` enforcement, rejection contracts, fail-closed): [task-7](./task-7.md) · [task-8](./task-8.md) · [task-9](./task-9.md) · [task-10](./task-10.md)
- **Slice 3** (integration + operational verification): [task-11](./task-11.md) · [task-12](./task-12.md)
