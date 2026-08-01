# History (append-only)

**Exactly one terse line per feature** (note ≤ 20 words). Newest at the bottom. This file is read into agent context — keep it small; no paragraphs.

<!-- format: YYYY-MM-DD | <name> | pr_ready|done | docs/features/<name>/ | note ≤20 words -->

2026-07-25 | tanstack-query-hooks-migration | pr_ready | docs/features/tanstack-query-hooks-migration/ | 7 hooks migrated to tanstack-query, 2 providers deleted, full review + mutation clean.

2026-07-09 | localization-i18n | pr_ready | docs/features/localization-i18n/ | @helsoft/localization (i18next+react-i18next; en/es/pt/de); 12 tasks, 6 reviewers APPROVED, 100% mutation on changed lines (6 equivalents), DoD PASS. On branch feature-entrega2-HernanLaura.
2026-07-10 | localization-i18n | pr_ready | docs/features/localization-i18n/ | Post-pr_ready: fixed 6 review minors (commit 7084e5f); re-review (3 rounds) surfaced FO2 (native selector group-role, Level A, pre-existing/systemic). Human risk-ACCEPTED FO1+FO2. All 6 reviewers APPROVED. Confirmed pr_ready. FO2 closure deferred to design-system follow-up.
2026-07-10 | login-and-logout | pr_ready | docs/features/login-and-logout/ | Supabase Auth (email/password); 5 tasks (Slice 1: happy path + loading); spec + Gherkin approved (4 Open Decisions confirmed). TDD: 40 tests, all green. Reviews: 3-round loop (6 major+2 minor → all fixed, Round 3 ESCALATE_MINORS: 1 accepted test-timing flake). Mutation: 100% on changed lines (28 survivors killed via test strengthening). DoD PASS. On branch feature-entrega2-HernanLaura.
2026-07-10 | login-and-logout (cont'd Slices 2–3) | pr_ready | docs/features/login-and-logout/ | Continued Slices 2–3: error handling (task-6/7, error contract + empty/error UI states) + i18n + a11y + Playwright e2e (task-8/9). Per-slice review (Slice 2): 3 rounds, APPROVED. Full review (all 6 reviewers): 3 rounds, 8 findings fixed (6 in Round 1 mutation survivors + 1 new major in Round 2), Round 3 clean APPROVED. Mutation: PASS 100% on feature-touched lines (Round 3, final). DoD: 8/8 categories PASS. Total: 204 unit + 27 e2e tests, all green. Branch: feature-entrega2-HernanLaura → main.
2026-07-10 | activity-multiple-choice | pr_ready | docs/features/activity-multiple-choice/ | Slide discriminated union (libs/types) + pure grader (libs/study-buddy) + MultipleChoice organism/MultipleChoiceActivity wiring (libs/components + libs/study-buddy), reusing AnswerOption molecule. 7 tasks across 3 slices (happy path → empty/error → i18n/a11y+e2e), each slice's light review clean (1-3 rounds). Full review: 3-round loop (1 blocker + 1 major + 5 minor fixed across rounds; Round 3 ESCALATE_MINORS: 1 human-accepted risk — Android TalkBack live-region first-mount timing unverified on-device, iOS/web fully verified). Mutation: 100% on changed feature logic (54/54). DoD: PASS, 8/8 categories. Worktree: .worktrees/activity-multiple-choice, branch feat/activity-multiple-choice, from feature-entrega2-HernanLaura.
2026-07-10 | study-buddy-storybook (ad hoc, no story) | n/a | — | Direct engineering request, outside the ticket-orchestrator pipeline (no spec/gherkin/reviews, no docs/features/ folder). Added Storybook + Playwright e2e tooling to @helsoft/study-buddy for its 4 feature-wiring components (sign-in-form, sign-out, language-settings, multiple-choice-activity): a story-configurable fake useAuth and a no-op useRouter, aliased in via Vite (the real hooks need a live Supabase client / Expo Router tree neither exist in Storybook); the real LocalizationProvider is used as-is for genuine translated copy. 21 e2e tests, all passing (commit 670dd46). Then moved LanguageSettings into libs/components/src/organisms/ (atomic design: a complete section built from the LanguageSelector molecule, not feature wiring) — components gained @helsoft/localization + @helsoft/types as dependencies, its Storybook preview gained a LocalizationProvider decorator, and the one consumer (apps/app-study-buddy's settings screen) was repointed (commit 2789ff7). sign-in-form and sign-out moves are still pending. Worktree: .worktrees/activity-multiple-choice, branch feat/activity-multiple-choice.
2026-07-10 | pdf-upload-extraction | pr_ready | docs/features/pdf-upload-extraction/ | PDF extraction Edge Fn (mupdf-wasm) + schema/RLS + upload UI; 6-reviewer review APPROVED; mutation PASS (3 human-accepted categories); DoD PASS.

2026-07-11 | activity-matching | pr_ready | docs/features/activity-matching/ | MatchingSlide types + gradeMatching + Matching organism (@helsoft/activities) + MatchingActivity wiring. 9 tasks / 3 slices (happy path → empty/error → i18n/a11y/stories/e2e). Per-slice reviews clean. Full review: 2 rounds (B1 contrast + M1 pending/paired a11y fixed). Mutation pre+post PASS (0 survivors). DoD PASS 8/8. Worktree: .worktrees/activity-matching, branch feat/activity-matching, from feature-entrega2-HernanLaura.
2026-07-11 | score-results-summary | pr_ready | docs/features/score-results-summary/ | scoreLesson scorer + lesson_attempts migration/DAO/service + use-lesson-attempt hook + ResultsSummary organism/LessonResults wiring, against an injected GradedAnswer[] contract pending R4/R9. 12 tasks / 3 slices, each slice's light review clean (1-2 rounds). Full review: 2 rounds (1 major overlapping-save guard + 1 minor dedupe, both fixed). Mutation pre+post PASS (91.16%/90.23%, all survivors independently-verified equivalent). DoD PASS 8/8. Human pre-authorized the spec+Gherkin gate (no interactive sign-off). Worktree: .worktrees/score-results-summary, branch feat/score-results-summary, from feature-entrega2-HernanLaura.
2026-07-11 | activity-fill-in-the-blank | pr_ready | docs/features/activity-fill-in-the-blank/ | FillInTheBlankSlide + gradeFillInTheBlank + organism (@helsoft/activities) + FillInTheBlankActivity. 9 tasks / 3 slices. Pre+post mutation PASS (100% logic). Full review APPROVED R2 (a11y B1/M1/M2/m1 fixed). DoD PASS. Worktree: .worktrees/activity-fill-in-the-blank, branch feat/activity-fill-in-the-blank. Model: grok-4.5-fast-xhigh.
2026-07-11 | activities-consolidate (ad hoc) | n/a | — | Direct eng request. Component-split MCQ/FITB/matching; move graders + LessonResults into @helsoft/activities; thin study-buddy wrappers; drop duplicate tests; add missing stories; update activity user stories + i18n coverage paths (commit 9a6dce5). Branch: feature-entrega2-HernanLaura.
2026-07-11 | activity-open-ended | pr_ready | docs/features/activity-open-ended/ | Open-ended organism; Grok pipeline; PR manual
2026-07-11 | activity-open-ended | done | docs/features/activity-open-ended/ | merged into feature-entrega2-HernanLaura

2026-07-11 | ai-key-management | pr_ready | docs/features/ai-key-management/ | Bring-your-own AI key (PRD R6): Supabase Vault-encrypted storage, first Edge Function (`manage-api-key`, validate-then-store via OpenAI probe) + first migration/RLS in the repo. Spec+Gherkin: 3 pre-gate spec_reviewer rounds (7 findings fixed) before human gate; gate confirmed Vault + OpenAI defaults, flagged hosted-project Vault/Edge Functions availability as unconfirmed. 14 tasks / 3 slices, TDD throughout, per-slice reviews clean. Full review: 3 rounds (15 findings, then 2 findings incl. reverting an out-of-process misattributed ApiKeyGate change, then zero). Mutation: 100% on changed lines (services/components) + 100% of non-equivalent mutants (hooks, 3 documented equivalents). DoD PASS. Notable: reviewer agents twice encountered and correctly rejected injected/fabricated tool-output content during the review; verified via git fsck/reflog as having no real effect, documented transparently and flagged to the human. On branch feature-entrega2-HernanLaura (worktree `.worktrees/ai-key-management`, branch `feat/ai-key-management`).
2026-07-11 | ai-key-management | done | docs/features/ai-key-management/ | merged into feature-entrega2-HernanLaura
2026-07-11 | activity-flashcard-recall | pr_ready | docs/features/activity-flashcard-recall/ | Self-marked Flashcard organism (@helsoft/activities) + FlashcardActivity wiring; FlashcardSlide/FlashcardAnswer union extension, excluded from R7 (already scorer-aware). 9 tasks/3 slices; slice 1 fixed 1 major (a11y-neutral mark color). Mutation pre-review 22→0 survivors (100%); full review 1 major (a11y announce content) fixed round 2; post-review mutation 100%. DoD PASS. Docs compacted. Worktree .worktrees/activity-flashcard-recall, branch feat/activity-flashcard-recall, from feature-entrega2-HernanLaura.
2026-07-13 | pdf-upload-extraction (ad hoc, no story) | n/a | — | Extracted DAO/service/adapters/hook/types into new @helsoft/pdf-upload-extraction lib; all workspaces green.
2026-07-13 | pdf-upload-extraction | done | docs/features/pdf-upload-extraction/ | merged into feature-entrega2-HernanLaura (upload screen: PdfUpload inside ApiKeyGate)
2026-07-13 | ai-key-management (ad hoc, no story) | n/a | — | Removed OpenAI key validation: manage-api-key stores keys directly; invalid_key error path stripped client-side. Branch feature-entrega2-HernanLaura.
2026-07-13 | ui-tweaks (ad hoc, no story) | n/a | — | SignOut moved to settings headerRight (style prop + WithStyle story); home screen spacing. Branch feature-entrega2-HernanLaura.
2026-07-13 | component-split (ad hoc, no story) | n/a | — | Repo-wide component-split: *.types.ts + co-located hooks/helpers across 6 libs; 831 tests green. Branch feature-entrega2-HernanLaura.
2026-07-13 | supabase-services-split (ad hoc, no story) | n/a | — | Split @helsoft/supabase-services out of @helsoft/services (Supabase client/DAOs/services); consumers + agent docs repointed; all suites green. Branch feature-entrega2-HernanLaura.
2026-07-13 | logging-in-out (ad hoc, no story) | n/a | — | Extracted LoginForm/SignInForm/SignOut into @helsoft/logging-in-out; thin study-buddy wrappers; mutation skill wired. Branch feature-entrega2-HernanLaura.
2026-07-13 | biome-adoption (ad hoc, no story) | n/a | — | Adopted Biome 2.5.3 repo-wide (lint+format, per-workspace turbo, ESLint dropped); format sweep; all workspaces green. Branch feature-entrega2-HernanLaura.
2026-07-13 | ai-lesson-generation | pr_ready | docs/features/ai-lesson-generation/ | PDF->Groq deck generation (Edge Fn, DAO/service/hook, panel+progress UI). 15 tasks/3 slices, per-slice reviews clean. Full review APPROVED r2 (7 fixed). Mutation 97.92%/98.18% (equivalents only). DoD PASS. Worktree .worktrees/ai-lesson-generation, branch feat/ai-lesson-generation, from main.
2026-07-13 | signup-and-lesson-persistence | pr_ready | docs/features/signup-and-lesson-persistence/ | R5 persist+delete; signup carved out
2026-07-14 | i18n-inline-and-stories-backfill (ad hoc, no story) | n/a | — | Dropped labels props for inline t() (components/activities/study-buddy); backfilled missing stories/e2e; new i18n.mdc/state.mdc rules. 8 commits, branch feature-entrega2-HernanLaura.
2026-07-14 | hooks-usereducer (ad hoc, no story) | n/a | — | Converted useApiKey/useLessonGeneration/useLessons/usePdfExtraction from multi-useState to useReducer per state.mdc (commit 8794ff5). Documented the *.reducer.ts naming convention in state.mdc (commit 995c871). Branch feature-entrega2-HernanLaura.
2026-07-14 | activity-multiple-choice (ad hoc, no story) | n/a | — | MCQ now requires explicit Submit (new 'selected' option state, disabled-until-picked Submit button) instead of grading on tap; new activity.mcq.submit i18n key (commits 539ca0c, c876fd9). Branch feature-entrega2-HernanLaura.
2026-07-14 | pending-pdfs-generate | pr_ready | docs/features/pending-pdfs-generate/ | PDF list on upload; generate/retry/open; DoD PASS
2026-07-14 | generate-lesson (ad hoc) | n/a | — | Groq json_schema break: gpt-oss-20b + nullable schema; generation_failed fixed.
2026-07-14 | pending-pdfs-generate (rules align) | n/a | — | DAO types + molecule-owned i18n + spinner tokens (07b665d).
2026-07-14 | lesson-player | pr_ready | docs/features/lesson-player/ | DoD PASS; results=last slide; save-once

2026-07-15 | api-key-form i18n inline (ad hoc) | n/a | — | Dropped ApiKeyForm labels prop; inline useLocalization; keySavedStatusLabel only. Branch feature-entrega2-HernanLaura.

2026-07-15 | lesson-player (ad hoc) | n/a | docs/features/lesson-player/ | Moved LessonPlayer/SlideView/SlideImage into @helsoft/activities; thin study-buddy re-exports.
2026-07-15 | navigation-menus | pr_ready | docs/features/navigation-menus/ | DoD PASS; ready for PR

2026-07-16 | new-lesson-dialog (ad hoc) | n/a | — | Upload+generate in Dialog; extraction reset; upload screen wired.

2026-07-16 | implementer-rename + pdf-upload tests (ad hoc) | n/a | — | Renamed implementator→implementer; fixed pdf-upload storage/RN mocks + continue assert.

2026-07-16 | lesson-player (ad hoc) | n/a | docs/features/lesson-player/ | Top arrow IconButtons beside progress via LessonPlayerNavigator (ae7e77e).

2026-07-16 | lesson-player open route (ad hoc) | n/a | — | Open lesson → /lesson/[id]/player; PRD R4 struck; orchestrator diagram fix loops.
2026-07-16 | plan-entitlements-key-routing | pr_ready | docs/features/plan-entitlements-key-routing/ | profiles plan + key routing; DoD PASS
2026-07-16 | supabase-restart-script (ad hoc, no story) | n/a | — | Added supabase/restart.sh (stop --no-backup + start) wired as pnpm supabase:restart (720a22f).

2026-07-16 | plan-entitlements-key-routing (amend) | pr_ready | docs/features/plan-entitlements-key-routing/ | Profile* rename; drop can_create_without_key; canCreate from use_platform_key; contact-support empty create; docs synced.

2026-07-16 | lesson-generation min slides (ad hoc) | n/a | — | Enforce MIN_LESSON_SLIDES=5 in schema+prompt (all compositions); Edge mirror + deploy.

2026-07-16 | plan-entitlements-key-routing | done | docs/features/plan-entitlements-key-routing/ | Merged PR #9 into feature-entrega2-HernanLaura; worktree removed.

2026-07-17 | web-deploy-cors (ad hoc) | n/a | — | CORS for edge fns; EAS web deploy; mutation three-dot sync.

2026-07-17 | grill-me-spec-partner (ad hoc) | n/a | — | Wire grill-me/grilling into spec_partner; escalate big structural changes.
2026-07-20 | activity-image-sizing | pr_ready | docs/features/activity-image-sizing/ | DoD PASS; human opens PR

2026-07-21 | js-utils-rn-utils (ad hoc) | n/a | — | Scaffold @helsoft/js-utils + @helsoft/rn-utils; lightbox uses sendAccessibilityEvent.
2026-07-21 | supabase-seed (ad hoc) | n/a | — | Seed free/paid plans to match hosted; drop unused test@mail.com auth user.

2026-07-21 | create-user-story-grilling (ad hoc) | n/a | — | Wire grilling into create-user-story clarifying flow (996895b).

2026-07-21 | orchestrator-pipeline (ad hoc) | n/a | — | Drop pre-review mutation; fold reviewer_standards into slice+engineering (a2268afe).
2026-07-21 | activity-image-split-layout | pending | user-stories/pending/ | Pending story: portrait image beside body on wide viewports (b5d4550).

2026-07-21 | activity-image-split-layout | pr_ready | docs/features/activity-image-split-layout/ | Portrait split layout; 4 mutants TODO-accepted.

2026-07-21 | activity-image-split-layout | pr_ready | docs/features/activity-image-split-layout/ | Split any valid image on landscape viewports.

2026-07-21 | activity-image-split-layout | done | docs/features/activity-image-split-layout/ | Merged into feature-entrega3; worktree removed.

2026-07-21 | login-enter-submit (ad hoc) | n/a | — | LoginForm submits on Enter via onSubmitEditing (9bf62b543).

2026-07-22 | android-dev-client (ad hoc) | n/a | — | pnpm android switched to expo run:android (dev client, not Expo Go); Android Supabase URL rewritten 127.0.0.1→10.0.2.2 (3cc14dad8).
2026-07-22 | android-dev-client (ad hoc) | n/a | — | iOS bundle identifier set (prebuild for expo run:ios) alongside earlier Android dev-client fix (ef7483c1b).

2026-07-22 | rules-compliance-fixes (ad hoc) | n/a | — | Complete supabase-services dao/index.ts barrel exports.
2026-07-22 | rules-compliance-fixes (ad hoc) | n/a | — | useSession via AuthService/AuthDao; added unit tests.
2026-07-22 | rules-compliance-fixes (ad hoc) | n/a | — | Move PdfUploadDao to supabase-services; add pdf-upload-extraction barrels.
2026-07-22 | rules-compliance-fixes (ad hoc) | n/a | — | new-lesson-dialog handlers in component; stories/tests + player-loading story.
2026-07-22 | rules-compliance-fixes (ad hoc) | n/a | — | Drop activity labels={t()} bags; inline t() + hook localization.
2026-07-22 | rules-compliance-fixes (ad hoc) | n/a | — | api-key-form local state → useReducer + *.reducer.ts.
2026-07-22 | rules-compliance-fixes (ad hoc) | n/a | — | Shared component types moved into *.types.ts per types.mdc.
2026-07-22 | rules-compliance-fixes (ad hoc) | n/a | — | Finish i18n: app-chrome keys, provider.groq t(), generation panel inline.
2026-07-22 | rules-compliance-fixes (ad hoc) | n/a | — | Format sweep after activity i18n cleanup.
2026-07-22 | rules-compliance-fixes (ad hoc) | n/a | — | Split SlideImage into use-slide-image + helpers.
2026-07-22 | rules-compliance-fixes (ad hoc) | n/a | — | Hooks tests → @testing-library/react-native + jest-expo.
2026-07-22 | rules-compliance-fixes (ad hoc) | n/a | — | Tokenize hardcoded spacing in components + home screen.
2026-07-22 | rules-compliance-fixes (ad hoc) | n/a | — | LocalizationProvider → useLocalePreference → LocalePreferenceService.
2026-07-22 | rules-compliance-fixes (ad hoc) | n/a | — | Co-located Jest for previously uncovered components atoms/molecules.
2026-07-22 | rules-compliance-fixes (ad hoc) | n/a | — | Jest for OpenEndedBody + LessonPlayerNavigator.
2026-07-22 | rules-compliance-fixes (ad hoc) | n/a | — | Rules audit fixes (excl. screen-container). Worktree .worktrees/rules-compliance-fixes, branch feat/rules-compliance-fixes.
2026-07-22 | rules-compliance-fixes (ad hoc) | done | — | Merged into feature-entrega3-HernanLaura; worktree removed.
2026-07-22 | native-bottom-tabs | in_review | docs/features/native-bottom-tabs/ | CI: SF Symbol sf: glyphs excluded from i18n dotted-key scanner.
2026-07-22 | native-bottom-tabs | pr_ready | docs/features/native-bottom-tabs/ | NativeTabs 2-tab shell; New Lesson CTA; MobileBar removed

2026-07-23 | native-bottom-tabs | pr_ready | docs/features/native-bottom-tabs/ | Post-DoD: WebBottomTabs in @helsoft/components for narrow web; docs aligned.

2026-07-23 | native-bottom-tabs | pr_ready | docs/features/native-bottom-tabs/ | 3 tabs + DesktopBar PDF; retire /upload→/pdf-files; PdfDocuments prop-less; docs synced.

2026-07-23 | orchestrator-improvements (ad hoc) | n/a | — | Applied ORCHESTRATOR_IMPROVEMENTS.md backlog: hardened run-mutation.sh + JSON report parser, baked inPlace into all stryker configs, escalate-only mutation gate, durable review history, ops scripts, orchestrator-run-retro skill (e4210362a).
2026-07-23 | activities (ad hoc) | n/a | — | Added storybook/start scripts to libs/activities/package.json (7629d2c96).
2026-07-23 | user-stories (ad hoc) | n/a | — | Retired locale-save-failure-notice; added multi-provider-ai-keys pending story (1915e1cdb).

2026-07-23 | native-bottom-tabs | done | docs/features/native-bottom-tabs/ | Merged into feature-entrega3-HernanLaura; worktree removed.

2026-07-24 | agents-rules (ad hoc, no story) | n/a | — | Plan-mode gate, 1-round reviews, e2e/state-sharing rules, DESIGN.md.

2026-07-24 | agents-docs-sync (ad hoc) | n/a | — | Sync AGENTS/ORCHESTRATOR/.md agents to plan-mode + state-sharing.

2026-07-23 | multi-provider-ai-keys | in-progress | docs/features/multi-provider-ai-keys/ | Settings nested api-keys UI; save_api_key ambiguity+SELECT grant; deepseek@3 pin; docs synced.

2026-07-24 | multi-provider-ai-keys | in-progress | docs/features/multi-provider-ai-keys/ | Decompose settings UI; shared provider consts; error.network; format scripts.

2026-07-24 | multi-provider-ai-keys | in-progress | docs/features/multi-provider-ai-keys/ | Private StyleSheets; drop style snapshot tests; modal close tweak.

2026-07-24 | multi-provider-ai-keys | in-progress | docs/features/multi-provider-ai-keys/ | Split lesson-generation-panel (states/selectors + RadioGroupSection).

2026-07-24 | multi-provider-ai-keys | in-progress | docs/features/multi-provider-ai-keys/ | Docs re-synced to final settings decomposition (spec/task-2/6/tasks).

2026-07-24 | multi-provider-ai-keys | done | docs/features/multi-provider-ai-keys/ | Merged into feature-entrega3-HernanLaura; worktree removed.

2026-07-23 | lesson-route-header | pr_ready | docs/features/lesson-route-header/ | Native header (back+title) on lesson index/player/results via bare Stack; lesson-stack-screens.ts factory. 1 slice, reviews+mutation 100%, DoD PASS.

2026-07-24 | lesson-route-header | pr_ready | docs/features/lesson-route-header/ | Synced with feature-entrega3-HernanLaura (multi-provider-ai-keys merge); no conflicts in feature code.

2026-07-24 | safe-area-insets (ad hoc, no story) | n/a | — | SafeAreaProvider at app root; ScreenContainer takes an `edges` prop (SafeAreaView) instead of fixed padding; 4 headered screens exclude top. Built directly on feat/lesson-route-header (worktree).

2026-07-24 | lesson-route-header (ad hoc) | n/a | — | Fixed (app)/_layout.tsx back-button label reading literal "(tabs)" (missing title on the tabs Stack.Screen); back label now "My lessons".

2026-07-24 | tabs-header (ad hoc, no story) | n/a | — | Added @helsoft/components TabsHeader molecule (title + trailing action); wired into SavedLessons and PdfDocuments, replacing per-screen inline heading rows; en/es/pt/de "saved lessons" copy renamed to "my lessons". Built on feat/lesson-route-header (worktree).

2026-07-24 | lesson-route-header | done | docs/features/lesson-route-header/ | Merged into feature-entrega3-HernanLaura (incl. ad hoc safe-area-insets + tabs-header work); worktree removed.

2026-07-24 | comment-cleanup (ad hoc, no story) | n/a | — | Repo-wide why-not-what comment audit (830 files); trimmed 15 files' restating/obvious comments (cc1ba8747).

2026-07-25 | unistyles-configure-order (ad hoc, no story) | n/a | — | metro.config.js prepends @helsoft/components/theme via getModulesRunBeforeMainModule; fixes dev-server 500 from configure-before-create race (347160f65).

2026-07-25 | root-gating (ad hoc, no story) | n/a | — | ErrorMessageWithRetry+ErrorScreen (components); root _layout gates on font/profile load with full-screen error, guard now profile-based not session-based; ApiKeyGate loses its own loading/error UI; entitlements copy→profile+fonts keys; playwright baseURLs synced to reassigned ports (9c771cf70..de4d79ad6).

2026-07-25 | tanstack-query-auth (ad hoc, no story) | n/a | — | useAuth/useSession moved to tanstack-query (useMutation/useQuery); new useSignOut hook + QueryProvider; SignOut gains loading/error/retry UI (19812439d..8c89fa11b).

2026-07-25 | agents-rules (ad hoc, no story) | n/a | — | New .agents/rules/tanstack-query.mdc (one QueryClient/QueryProvider, expose mutation primitives, setQueryData bridge, typed error guard, waitFor tests); wired into rules.md, ORCHESTRATOR.md, reviewer_slice (+ missing state-sharing entry), reviewer_engineering, implementer, global.mdc, hooks-service-dao.mdc, ORCHESTRATOR_PLAN.md; prompts.md annex (8894e54a1, 150b0090b).
2026-07-26 | agents-rules (ad hoc, no story) | n/a | — | TDD split by file type: strict TDD stays for non-UI .ts, UI .tsx goes impl-first (tdd.mdc, implementer, reviewer_slice/engineering, ORCHESTRATOR*); tanstack-query.mdc gains useCallback anti-pattern example; create-user-story splits backend/frontend stories on supabase/ schema impact; added tanstack-query-hooks-migration user story (7d8556a96..0f5b8f44a).

2026-07-26 | tanstack-query-hooks-migration | pr_ready | docs/features/tanstack-query-hooks-migration/ | Post-migration: split api-key mutations + sticky submit UX (4412da382, bae079f74).
2026-07-26 | tanstack-query-hooks-migration | pr_ready | docs/features/tanstack-query-hooks-migration/ | Code review fixes: symmetric api-key error clearing, delete-error-before-refetch for lessons/pdf-documents, general.save/saving locale reuse, dropped unreachable logged-out isLoading AC (3382ec692, 767619672, f0491a704, 38600fc51).
2026-07-26 | tanstack-query-hooks-migration | done | docs/features/tanstack-query-hooks-migration/ | Merged into feature-entrega3-HernanLaura; worktree removed.
2026-07-26 | design-system-palette-sync (ad hoc, no story) | n/a | — | Synced libs/components theme to Claude Design's "Study Buddy" palette (Royal Blue/Azure Cyan/Orange, replaces old Slate & Rust); fixed source design system's mislabeled tertiary/orange ramp (wrong hue+lightness), onTertiaryContainer role mismatch, press state-layer opacity (2d6c9981f).
2026-07-26 | ai-provider-registry-backend | pr_ready | docs/features/ai-provider-registry-backend/ | ai_providers/ai_provider_models tables+RLS+FK on user_ai_keys; shared provider-catalog.ts; enabled enforced in both Edge Fns. 3 slices, reviews+full review 1 fix rd each. Mutation PASS but vacuous (Stryker can't reach supabase/functions/, R10). DoD PASS. Amended paired frontend story mid-grill (D1/D10/D13/D14). Worktree .worktrees/ai-provider-registry-backend, branch feat/ai-provider-registry-backend, from feature-entrega3-HernanLaura.
2026-07-26 | ai-provider-registry-frontend | pr_ready | docs/features/ai-provider-registry-frontend/ | useAiProviders hook + ai-providers.dao/service replace hardcoded AI_PROVIDERS/AI_MODEL_REGISTRY/PROVIDER_NAME_KEYS/guidance-URLs; disabled-provider visibility split; ApiKeyErrorCode+GenerationErrorCode widened w/ provider_disabled. 3 slices (1 fix rd in slice 2), full review 1 fix rd, mutation 3 rounds (144→75→0 survivors, 100% killed). DoD PASS. Shared worktree/branch with ai-provider-registry-backend (built on its not-yet-merged schema/edge-fn contract).
2026-07-27 | ai-provider-registry-backend + frontend | done | docs/features/ai-provider-registry-backend/, docs/features/ai-provider-registry-frontend/ | Merged into feature-entrega3-HernanLaura via PR #13 (c06ecabea); worktree removed. Post-merge fix folded in: useApiKey().isLoading now uses deriveIsLoading (disabled-query isPending v5 gotcha left the app on a blank white page for logged-out visitors), cherry-picked from 38bdcf3c2.
2026-07-27 | orchestrator-gate (ad hoc, no story) | n/a | — | Human gate moved to post-spec_reviewer: approve written spec + Gherkin once; no plan-mode up-front approval (d02d25260).
2026-07-27 | splash-screen-logomark (story only) | n/a | — | Pending user story: native splash logomark on Royal Blue until auth/profile resolves (67c19af6c). Assets PNGs left untracked.
2026-07-27 | orchestrator-mutation-rereview (ad hoc, no story) | n/a | — | Mutation fix that changes production source re-triggers bounded full review; test-only kill skips it (01ce5eb56).
2026-07-27 | splash-screen-logomark (assets) | n/a | — | Tracked logo-full.png + logomark.png under apps/app-study-buddy/assets (e8a9133a2).
2026-07-27 | card-list-with-abm-dialog | pr_ready | docs/features/card-list-with-abm-dialog/ | New generic CardListWithABMDialog organism; mutation 97.2% human-accepted (2 equivalent mutants).
2026-07-27 | card-list-with-abm-dialog | pr_ready | docs/features/card-list-with-abm-dialog/ | Mini-gate bug fix: decoupled isOpen from dialogState, stops empty-dialog flash on close (@s19/@s20, 8aa12b28e).
2026-07-27 | card-list-with-abm-dialog | pr_ready | docs/features/card-list-with-abm-dialog/ | Mini-gate closed: full review APPROVED, mutation re-run 97.44% (same 2 equivalents), DoD re-PASS.
2026-07-27 | card-list-with-abm-dialog | pr_ready | docs/features/card-list-with-abm-dialog/ | 2nd mini-gate: CardListRow promoted to molecule; fixed reverse molecule-organism import finding; mutation 97.50%, DoD re-PASS.
2026-07-28 | review-fixes + agent-skills (ad hoc) | n/a | — | Keep manual provider pick across keys refresh; parallelize manage-api-key; image-lightbox helpers tests; add-storybook-story + add-unit-test skills.
2026-07-28 | card-list-with-abm-dialog (ad hoc) | pr_ready | docs/features/card-list-with-abm-dialog/ | Split organism into header/edit/remove/list sub-components + context hook (cd17d1ee0); code-review findings human-accepted as intentional. Also added add-storybook-story skill (885942c2e).
2026-07-29 | e2e-interaction-only-cleanup (ad hoc, no story) | n/a | — | Removed render-only Playwright e2e per e2e.mdc: 46 files deleted, 20 trimmed to genuine interaction tests only (f9bef5009).
2026-07-29 | e2e-testing-app-study-buddy (plan only) | n/a | docs/plans/ | Two-phase plan: Playwright web golden path (testID instrumentation) then Maestro Android/iOS; Detox rejected (974ad5a09).
2026-07-30 | e2e-testing-app-study-buddy (ad hoc) | n/a | docs/plans/ | Phase 1 web: per-lib testID convention (@helsoft/{lib}/test-ids) across components/activities/logging-in-out/study-buddy; Playwright e2e suite (login, PDF upload+generate, lesson player) driving live app-study-buddy web; fixed new-lesson dialog not closing on player open; app-e2e.mdc rule + app-e2e-tests skill (837a1ab04..835e95879).
2026-07-30 | card-list-with-abm-dialog | pr_ready | docs/features/card-list-with-abm-dialog/ | Migrate api-key settings onto CardListWithABMDialog; drop ApiKeyManager; fix-unit-tests skill (312d2ccf4).
2026-07-31 | card-list-with-abm-dialog | pr_ready | docs/features/card-list-with-abm-dialog/ | Mini-gate 3: full review (9 findings fixed), mutation 77.3%->99.84% (1 equivalent), @s13 human sign-off, DoD Round 4 PASS.
2026-07-31 | rule-compliance fixes (ad hoc) | n/a | — | i18n dialog/error defaults; COMPOSITION_LABEL_KEYS→helpers; OpenEndedBody→molecules; study-buddy stories/tests (4 commits).
2026-07-31 | global.mdc ports+comments (ad hoc) | n/a | — | Storybook ports aligned; shrunk long-file comments (matching/player/card-list).
2026-07-31 | atomic-design Card padding (ad hoc) | n/a | — | Card default padding → theme.spacing.s4.
2026-07-31 | hooks-service-dao mapping (ad hoc) | n/a | — | DAO raw rows + service mapping for lessons/attempt/api-key/profile.
2026-07-31 | unit-test coverage (ad hoc) | n/a | — | Fill unit coverage gaps across hooks/components/study-buddy/rn-utils/supabase-services; wire Jest for rn-utils; RTL fallback rule (548061aad).
2026-07-31 | expo-tests + e2e cleanup (ad hoc) | n/a | — | Layout tests out of app/; post-e2e db reset; dialog chooseFile; prompts/findings cleanup.
2026-07-31 | settings/player polish (ad hoc) | n/a | — | ApiKeySettingsSection + i18n title/cannotCreate; lesson player maxWidth; dialog test.

2026-07-31 | prompts.md | n/a | — | Unified prompt log style; filled course sections 1–7.
2026-07-31 | golden-path e2e picker (ad hoc) | n/a | — | E2E clicks panel Choose PDF after dialog open (no auto chooser).

2026-07-31 | entrega-final docs (ad hoc) | n/a | — | Filled readme/prompts; synced C4 Mermaid+Excalidraw to BYOK/plans; OpenAPI review fixes.

2026-08-01 | review-findings (ad hoc) | n/a | — | Empty plans guard; error-code helper; TextField focus; e2e .env backup/restore; RNTL docs; migration contract tests.

2026-08-01 | types.mdc + activity exploration (ad hoc) | n/a | — | types.mdc cross-file-only + inference; activity-types exploration notes.
