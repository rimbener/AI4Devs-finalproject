---
feature: card-list-with-abm-dialog
phase: in_review # pending|spec_drafted|spec_ready|approved|in_progress|in_review|mutation|pr_ready|done
review_round: 0     # incremented by reviews_lead; cap 2 — reset for this mini-gate's new review cycle (architecture rewrite + Add-dialog)
---

# Tasks — card-list-with-abm-dialog
Index only. **Each `task-N.md` owns its `slice`, `scenarios`, `status`, `paths`** — do **not** duplicate them here. `orchestrator_lead` owns `phase`; `implementer` flips each task's `status`.

- **Slice 1** (list render: title, add button, cards, disabled/show flags, empty state): [task-1](./task-1.md)
- **Slice 2** (edit/remove dialogs: open, content, submit, cancel/scrim/escape): [task-2](./task-2.md)
- **Slice 3** (isSubmitting behavior, per-card a11y labels, full Storybook coverage): [task-3](./task-3.md)
- **Task 4** (post-hoc: human-authored architecture split + Add-dialog feature, documented after the fact — not yet re-reviewed/mutation-tested): [task-4](./task-4.md)
