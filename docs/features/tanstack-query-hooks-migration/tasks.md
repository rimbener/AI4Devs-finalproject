---
feature: tanstack-query-hooks-migration
phase: pr_ready # pending|spec_drafted|spec_ready|approved|in_progress|in_review|mutation|pr_ready|done
review_round: 2     # incremented by reviews_lead; cap 2
---

# Tasks — tanstack-query-hooks-migration
Index only. **Each `task-N.md` owns its `slice`, `scenarios`, `status`, `paths`.**

Nine slices, each independently shippable. Every task leaves the repo green on its own — provider deletions are merged with their app-wiring removal for that reason. Slices 6 and 7 are the only ones touching `apps/app-study-buddy`; slice 4 is the only one touching `@helsoft/supabase-services`.

## Slice 0 — auth-change cache reset (D2)
| Task | Title | Scenarios |
|---|---|---|
| task-1 | Evict non-auth cache entries on user-id change in useSession | s1, s2, s3, s4 |

## Slice 1 — use-lesson
| Task | Title | Scenarios |
|---|---|---|
| task-2 | Migrate useLesson to useQuery; delete its reducer | s5, s6, s7, s8, s9 |

## Slice 2 — use-lessons
| Task | Title | Scenarios |
|---|---|---|
| task-3 | Migrate useLessons to useQuery + delete mutation; delete its reducer | s10, s11, s12, s13, s14, s15, s16 |

## Slice 3 — use-pdf-documents
| Task | Title | Scenarios |
|---|---|---|
| task-4 | Migrate usePdfDocuments to useQuery + delete mutation; delete its reducer | s17, s18, s19, s20, s21, s22, s23 |

## Slice 4 — use-slide-image-url
| Task | Title | Scenarios |
|---|---|---|
| task-5 | Export SIGNED_URL_TTL_SECONDS from @helsoft/supabase-services | — |
| task-6 | Migrate useSlideImageUrl to useQuery with a derived cache window; delete next-request-id | s24, s25, s26, s27, s28, s29 |

## Slice 5 — use-lesson-attempt
| Task | Title | Scenarios |
|---|---|---|
| task-7 | Migrate useLessonAttempt to useMutation, keeping the isSaving entry gate | s30, s31, s32, s33, s34, s35, s36 |

## Slice 6 — use-api-key + ApiKeyProvider deletion
| Task | Title | Scenarios |
|---|---|---|
| task-8 | Migrate useApiKey to a scoped query + one tagged-union mutation; delete ApiKeyProvider | s37, s38, s39, s40, s41, s42, s43, s44, s45, s46, s47, s48, s49, s50 |

## Slice 7 — use-profile + ProfileProvider deletion
| Task | Title | Scenarios |
|---|---|---|
| task-9 | Migrate useProfile to a scoped query; delete ProfileProvider | s51, s52, s53, s54, s55, s56, s57, s58 |

## Slice 8 — docs and rules
| Task | Title | Scenarios |
|---|---|---|
| task-10 | tanstack-query.mdc: Exemptions section + D2/D3/D5/D6 patterns | — |
| task-11 | Sweep stale "tanstack-query not installed" comments (11 files) | — |
| task-12 | AGENTS.md: tanstack-query is installed and required | — |

Scenario-free tasks (task-5, task-10, task-11, task-12) are deliberate, not oversights: task-5 is a pure prerequisite for task-6, and slice 8 is documentation. All 58 `@s` scenarios are owned by exactly one task.
