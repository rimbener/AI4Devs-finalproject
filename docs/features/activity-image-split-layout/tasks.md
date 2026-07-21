---
feature: activity-image-split-layout
phase: approved # pending|spec_drafted|spec_ready|approved|in_progress|in_review|mutation|pr_ready|done
review_round: 0     # incremented by reviews_lead; cap 2
---

# Tasks — activity-image-split-layout

Index of atomic tasks (one `task-N.md` each), grouped by vertical slice. `orchestrator_lead` owns the `phase` above; `implementer` flips each task's `status`. Each `task-N.md` owns its `slice`, `scenarios`, `status`, `paths`.

| Task | Slice | Scenarios | Status | Paths |
|---|---|---|---|---|
| [task-1](./task-1.md) | 1 | @s2,@s14 | todo | libs/activities/src/organisms/slide-image/slide-image.tsx, slide-image.types.ts |
| [task-2](./task-2.md) | 2 | @s4,@s5,@s6,@s8,@s9,@s10,@s11 | todo | libs/activities/src/organisms/slide-view/use-slide-layout.ts |
| [task-3](./task-3.md) | 2 | @s1,@s2,@s3,@s6,@s7,@s12,@s14 | todo | libs/activities/src/organisms/slide-view/slide-view.tsx, slide-view.types.ts |
| [task-4](./task-4.md) | 3 | @s8,@s13 | todo | libs/activities/src/organisms/lesson-player/lesson-player.tsx |
| [task-5](./task-5.md) | 3 | @s1,@s3,@s7,@s10,@s11,@s12 | todo | libs/activities/src/organisms/slide-view/slide-view.stories.tsx, libs/activities/tests/e2e/organisms/slide-view/slide-view.e2e.js |

**Slice 1 — `SlideImage` gains a `layout` variant (`stacked` unchanged; `split` = height-bounded `contain`, no 640 cap).**
**Slice 2 — `use-slide-layout` hook (the split decision) + `SlideView` split row (title full-width + 50/50 + right-pane scroller) with stacked fallback.**
**Slice 3 — `LessonPlayer` height plumbing (measure body scroll frame → `availableHeight`) + all-kinds/a11y Storybook + Playwright e2e.**
