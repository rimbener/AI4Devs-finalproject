> Detalla en esta sección los prompts principales utilizados durante la creación del proyecto, que justifiquen el uso de asistentes de código en todas las fases del ciclo de vida del desarrollo. Esperamos un máximo de 3 por sección, principalmente los de creación inicial o  los de corrección o adición de funcionalidades que consideres más relevantes.
> Puedes añadir adicionalmente la conversación completa como link o archivo adjunto si así lo consideras

## Índice

1. [Descripción general del producto](#1-descripción-general-del-producto)
2. [Arquitectura del sistema](#2-arquitectura-del-sistema)
3. [Modelo de datos](#3-modelo-de-datos)
4. [Especificación de la API](#4-especificación-de-la-api)
5. [Historias de usuario](#5-historias-de-usuario)
6. [Tickets de trabajo](#6-tickets-de-trabajo)
7. [Pull requests](#7-pull-requests)

---

## 1. Descripción general del producto

**Prompt 1:** *(initial idea — invoked via the `/write-spec` skill)*

> I want to build an app that will parse a pdf and will create slides to teach the content of the pdf to the user. Each slide could be instructional or an activity

**Prompt 2:** *(broaden the problem to students who want to self-assess)*

> Lets modify the problem statement so it also includes students that wants to assess if they have learned what they are studying, so they could receive a pdf from their school, university, etc.; they will study it, and they want to assess themselves. Modify both the PRD and the readme

**Prompt 3:** *(completely rewrite the objective so it isn't framed around self-learners)*

> I don´t like this statement: "Self-learners constantly accumulate PDFs they want to actually learn", the objective still looks like being for self-learners, and that's not what I want, this should be for anyone needing to learn or assess themselves. please  completely re-write the objective

---

## 2. Arquitectura del sistema

### 2.1. Diagrama de arquitectura

**Prompt 1:** *(stack and high-level architecture — the constraints were written verbatim in the intake form)*

> I'll use react-native with expo for android, ios and web using react-native-web. The authentication and backend should use supabase, github actions for the pipeline (but at start it will only build and deploy web) and the user should add their own api key for the ai usage

### 2.2. Descripción de componentes principales

**Prompt 1:** *(AI key handling, server-side extraction, and scope of matching)*

> * Where the AI key lives: proxied through a Supabase Edge Function
> * PDF extraction: this is the highest technical risk, it should be done on the BE and it should be one of the first tasks to achieve.
> * Open-ended + matching/drag-drop: leave drag-drop out of the current scope

**Prompt 2:** *(extract and use images from the PDF)*

> the pdf can also contain images, not only text, modify the PRD so it reflects that images should also be extracted from the pdf and used in the slides

**Prompt 3:** *(answers to the open questions — AI provider, extraction library, image placement, image/PDF caps, learning-gain measurement, scanned-PDF detection)*

> Here are responses to the Open Questions:
>
> [Eng] Which AI provider/model is assumed for the bring-your-own key (OpenAI, Anthropic, multiple)? Determines the generation prompt/response contract. Blocking for R2.
> use vercel https://ai-sdk.dev/ so different providers can be used easily
> [Eng] Which server-side PDF extraction library runs in the Edge Function runtime (Deno), and can it extract both text and embedded images (with page/position info)? What's the fallback if it can't handle a given PDF? Blocking for R1.
> this point needs research to be made, a possible solution is https://github.com/run-llama/liteparse or some other pdf-parser library
> [Eng/product] How does generation decide which extracted image belongs on which slide — does the AI receive image descriptions/positions, the images themselves (vision model), or a simple page-proximity heuristic? Affects the R2 contract and provider choice. Blocking for R2 image placement.
> if the image has description or position, it can be used to decide which slide to put it on, but if it is just a vision model, it will need to be decided by the AI.
> [Product] Cap on number/size of images stored per PDF, given storage cost and slide clutter? Non-blocking; set a sensible cap.
> images should be reduced in size and quality to reduce storage cost and clutter.
> [Data] Without a pre-quiz in v1, is "retake improvement" a credible proxy for learning gain, or should the P1 pre/post quiz be pulled into v1? Non-blocking, revisit after first tests.
> remove any reference to pre-quiz as it is not in the scope of the project.
> [Product] Max PDF size / page count for v1, given generation cost and latency? Non-blocking; set a sensible cap.
> this will need to be tested and decided by the team.
> [Eng] How are scanned/image PDFs detected so R1's error path triggers reliably? Non-blocking.
> test what https://github.com/run-llama/liteparse can do and if it can detect scanned/image PDFs.

### 2.3. Descripción de alto nivel del proyecto y estructura de ficheros

**Prompt 1:**

**Prompt 2:**

**Prompt 3:**

### 2.4. Infraestructura y despliegue

**Prompt 1:**

**Prompt 2:**

**Prompt 3:**

### 2.5. Seguridad

**Prompt 1:**

**Prompt 2:**

**Prompt 3:**

### 2.6. Tests

**Prompt 1:**

**Prompt 2:**

**Prompt 3:**

---

## 3. Modelo de datos

**Prompt 1:** *(store slides as JSON instead of tables; images as URLs)*

> The slides should be a json containing all the needed data instead of tables (the images should be a url)

**Prompt 2:** *(promote resume mid-lesson into v1 — drove `current_slide_index` in `lesson_attempts`)*

> Make the following part of v1, not nice-to-have
>
> * Resume mid-lesson at the exact slide left off.

---

## 4. Especificación de la API

**Prompt 1:** *(lesson composition choice — added the `composition` parameter to generation)*

> change the prd so the user can select if he wants only instructional slides, only activity slides, or both

**Prompt 2:** *(generate the README, which produced the API spec along with the data model, user stories, tickets and PRs)*

> please fill in the readmd.md, do it in english

---

## 5. Historias de usuario

**Prompt 1:** *(add an authentication user story)*

> add a user story for authentication

**Prompt 2:** *(prioritize it as the first story)*

> make it the first story to be done

---

## 6. Tickets de trabajo

**Prompt 1:** *(make authentication the first ticket)*

> also make authentication as the first ticket

---

## 7. Pull requests

**Prompt 1:** *(draft a short PR description for the docs commit)*

> give me a short description for a PR that commits the prd, readme and prompts files

---

## Prompts de la sesión 1 — Iteración y revisión de PRD / readme

> Note: prompts reproduced verbatim, in chronological order. This session covered refinement, reconciliation and review across the documents rather than a single deliverable section.

**Prompt 1:** *(refine R1 to cover the whole PDF, not just text-based)*

> R1 still talks about a text-based pdf, check on the entire pdf

**Prompt 2:** *(re-read after manual edits)*

> I've edited the .md file, re-read it

**Prompt 3:** *(reconcile the matching/drag-drop inconsistency across sections)*

> yes, reconcile it

**Prompt 4:** *(final cross-document review)*

> Do a final review of both PRD.md and readme.md, check that both files are correct by themselves, and also that their are consistent between them

**Prompt 5:** *(generate this prompts log)*

> ok, now fill the file prompts.md using the current session, be extremely precise saving the exact promps I've wrote

---

## Prompts de la sesión 2 — Inicialización del monorepo (Turborepo + Expo + Supabase + Storybook)

> Note: prompts reproduced verbatim, in chronological order. This session covered the project scaffolding: Turborepo + yarn workspaces, the universal Expo app (web/iOS/Android), the shared `@helsoft/` libs, Storybook, creation of the hosted Supabase project, agent-rules consistency, and repo tooling.

**Prompt 1:** *(initialize the monorepo — created apps/, libs/, turbo.json, Supabase wiring)*

> I want to initialize a turbo repo on this repository, the repo will have  react-native web & mobile applications for the FE, and it will use Supabase for the BE

**Prompt 2:** *(scaffold the Storybook template library and verify it)*

> do the scaffold for @helsoft/lib-with-storybook, install storybook and test it works

**Prompt 3:** *(create the hosted Supabase project via CLI)*

> I need to create the supabase project now, help me doing it

**Prompt 4:** *(confirming `npx supabase login` was completed)*

> done

*(Region selected via the question UI: sa-east-1 — São Paulo.)*

**Prompt 5:** *(add Storybook to the shared components library)*

> now add storybook into the components library

**Prompt 6:** *(consistency review of the agent instruction files)*

> now finally do a review of @AGENTS.md, @CLAUDE.md and the files inside @.agents/ to ensure they're consistent for this monorepo

**Prompt 7:** *(add a clean script to the root package.json)*

> add a script "clean" in the main @package.json that will delete all the node_modules and caches inside any apps/ and libs/ subfolders

**Prompt 8:** *(extend clean to the root node_modules and caches)*

> yes, include root too

**Prompt 9:** *(document both DAO approaches — Supabase vs external endpoints)*

> going back to the previous prompt, I want to leave on @.agents/rules/hooks-service-dao.mdc the approach for calling endponts that are not on supabase, so depending on the user prompt, one or the other approach is used

**Prompt 10:** *(re-sync after manually moving the monorepo spec to .agents/rules/global.mdc)*

> now re-read AGENTS.md and @.agents/rules/global.mdc

**Prompt 11:** *(generate this session's prompts log)*

> write all the prompts of this session into @prompts.md

---

## Prompts de la sesión 3 — Migración del gestor de paquetes de yarn a pnpm

> Note: prompts reproduced verbatim, in chronological order. This session covered researching yarn vs npm vs pnpm for this monorepo (Turborepo + Expo SDK 57), migrating to pnpm 11 (`pnpm-workspace.yaml`, `workspace:*` protocol for the `@helsoft/*` libs, lockfile converted with `pnpm import`, `allowBuilds` approvals), verifying with `check-types`/`lint`/`build`, and updating the docs (`AGENTS.md`, `PRD.md`, `.agents/rules/global.mdc`, `readme.md`).

**Prompt 1:** *(research and compare package managers before deciding)*

> I'm thinking in migrating from yarn into npm or pnpm, can you research the advantages/disavantages of doing it, I want to compare them

**Prompt 2:** *(execute the migration)*

> migrate to pnpm

**Prompt 3:** *(document the isolated-dependencies escape hatch in the readme)*

> add this comment into the readme file: "If a future React Native library ever breaks with isolated dependencies, the one-line escape hatch is nodeLinker: hoisted in pnpm-workspace.yaml."

**Prompt 4:** *(keep the course readme in a single language)*

> translate the text so the entire readme is in spanish

---

## Prompts de la sesión 4 — Rutas de la app (Expo Router) y limpieza del boilerplate

> Note: prompts reproduced verbatim, in chronological order. This session reviewed `PRD.md` and proposed the app's route map, stripped the create-expo-app template boilerplate (demo screens, components, assets, scripts and demo-only deps — committed separately), and scaffolded the routes: `(auth)/{login,sign-up}` and `(app)/{index,upload,settings,lesson/[id]/{index,player,results}}` guarded with SDK 57 `Stack.Protected`, extending `useSession()` with `isLoading` for the splash-gated session check.

**Prompt 1:** *(review the PRD and design the route structure)*

> review the PRD and propose routes for the app

**Prompt 2:** *(clean the Expo template first, commit it, then scaffold routes uncommitted)*

> yes, but first clean-up all the expo boilerplate, including assets, etc. Do a commit for the expo clean-up and then leave the new routes uncommited

---

## Prompts de la sesión 5 — Regla de split de componentes (types / hook / helpers)

> Note: prompts reproduced verbatim, in chronological order. This session reviewed the matching organism file split and added `.agents/rules/component-split.mdc` (types / co-located hook / pure helpers / presentational component), wiring it into `global.mdc`, `AGENTS.md`, and `ORCHESTRATOR.md`.

**Prompt 1:** *(review matching split + add component-split rule)*

> review my current changes and add a short rule in @.agents/rules.md similar to @.agents/rules/hooks-service-dao.mdc where it explains that components should be splited like this:
> - component-name.types.ts for types
> - use-component-name.ts for logic (but not event handlers like onClick)
> - component-name.helpers.ts for pure functions that can be outside of the component and hook
> add whatever you think it's important, mantain the file short

**Prompt 2:** *(log this session's prompt)*

> add this prompt into @prompts.md

---

## Prompts de la sesión 6 — Construcción del orquestador agéntico (`.agents/`)

> Note: prompts reproduced verbatim, in chronological order. This session designed and implemented the feature harness/orchestrator under `.agents/` (agents, rules, skills, `/ticket-orchestrator` command, plan in `ORCHESTRATOR_PLAN.md`).

**Prompt 1:** *(implement agentic harness mixing two repos — plan first)*

> I want to implement an agentic harness workflow mixing this 2 repos:
> 1. https://github.com/betta-tech/harness-sdd/tree/uncle-bob-harness
> 2. https://github.com/LIDR-academy/mobile-facephi
> The goal is to have an agentic harness workflow that can be used in the current project. But the workflow is different from both, this is the expected flow:
> 1. spec_partner/spec: take a user story/ticket from the command line; read, ask questions and debate with the user until specs are clear; generate spec.md, risks.md, tasks.md.
> 2. gherkin_author: generate features/<name>.feature BDD specs; wait for human approval.
> 3. TDD Craftsman (follow TDD): UI components → component file (use tokens/other components; use figma/screenshot if provided), storybook file, e2e/unit tests file; logic/business rules → unit tests file, logic file; always → integration tests file.
> 4. Reviewer (several steps; each: review → back to TDD Craftsman → re-review): code reviewer, architecture reviewer, design reviewer, security reviewer (OWASP), accessibility reviewer (WCAG). Order: code, design, architecture, security, accessibility. Check how it's done in the repos.
> 5. Mutation testing: follow harness-sdd steps but TypeScript instead of Python.
> 6. PR guardian: prepare the PR with full Definition of Done validation.
> Make a plan for this and save it on an .md file.

**Prompt 2:** *(add vertical slices)*

> I like the vertical slice idea, let's add it too.

**Prompt 3:** *(add mermaid diagram of the flow)*

> add a mermaid diagram of the flow.

**Prompt 4:** *(human gate between spec_partner and gherkin_author)*

> lets add a human gate between the spec_partner and the gherkin_author.

**Prompt 5:** *(convert pipeline overview to mermaid)*

> the "4. Pipeline overview" is hard to read, convert it into mermaid diagram.

**Prompt 6:** *(rename pr_guardian → dod_validator; DoD only, no auto-PR)*

> lets change the pr_guardian, it should auto-create the pr, it should just do the Definition of Done, let's rename it to dod_validator.

**Prompt 7:** *(replace feature_list.json with per-task folder layout)*

> replace the feature_list.json file with a folder <name>/task-1.md, <name>/task-2.md, etc. and also move any file that uses <name> into that folder.

**Prompt 8:** *(UI components also get unit tests for TDD + mutation)*

> lets modify the testing part, UI components should also have unit tests so TDD and the mutation testing can be done on UI components too.

**Prompt 9:** *(open-questions responses)*

> Ticket source: the user story is an .md file in root/user-stories/. Figma: not needed, no Figma in this repo — fall back to a pasted screenshot or nothing. Mutation cost: yes, scope mutate: tightly to changed files and use coverageAnalysis: 'perTest'. Jest + Expo/RN 0.86 / React 19: already configured. e2e vs mutation: Stryker's Jest runner won't cover Playwright .e2e.js; mutation thresholds apply to Jest-testable logic; document the split in mutation-testing.md. Reviewer loop termination: cap re-review cycles to 3 before escalating.

**Prompt 10:** *(implement the plan)*

> ok, the plan looks good, now help me to implement it.

**Prompt 11:** *(rename harness → orchestrator; command ticket-orchestrator)*

> lets rename from harness into orchestator, and the command should be named ticket-orchestator.

**Prompt 12:** *(move .agents/AGENTS.md content elsewhere)*

> can we move the content of .agents/AGENTS.md into another file?

**Prompt 13:** *(rename tdd_craftsman → implementator)*

> rename tdd_crafstman to implementator.

**Prompt 14:** *(implementator: Playwright without auto-opening HTML report)*

> There was an issue running "pnpm test:e2e" (Playwright's HTML reporter auto-opens the report and blocks/hangs the process). Change the implementator so it runs without auto-opening the browser.

**Prompt 15:** *(per-role model selection; only spec_partner on Opus)*

> is it possible to use different models to run the orchestator_lead, implementator, reviewers, mutation_tester and dod_validator. Basically the only one that should run with Opus is the spec_partner.

**Prompt 16:** *(enforce all review findings fixed; max 3 loops)*

> I want to enforce on the orchestator_lead that any finding on the reviews should be addressed by the implementator, even if it's a minor finding, and after fixing it, should go through the review and mutation process again. The loop can occur 3 times at most, and at the very end the review.md file should contain only the findings that weren't fixed.

**Prompt 17:** *(allow shipping with documented minors after 3 rounds)*

> I do want to allow shipping with documented minors after 3 rounds.

**Prompt 18:** *(per-slice: only code + design; full reviewers after all slices)*

> I want to do a change for the review, only reviewer_code and reviewer_design should run for each slice. When all the slices are completed then all the reviewers should run.

**Prompt 19:** *(orchestrator creates a worktree)*

> ok, the orchestrator should create a worktree for the work.

**Prompt 20:** *(spec review phase before human approval)*

> add a review phase after creating the specs and the gherkin specs, before human approval, so we ensure the spec, risks, tasks, etc. are correct.

**Prompt 21:** *(cap at 2 rounds for spec review and code review)*

> lets do only 2 reviews of the spec and 2 reviews of code.

**Prompt 22:** *(mutation twice: before and after full review)*

> the mutation testing should be run twice: once before the full review and once after it — and it should be fixed both times.

**Prompt 23:** *(shrink .md files; reduce token usage)*

> I want to reduce the size of the .md files, for example once the gherkin is created remove AC from the spec.md and just add a link to the gherkin file; research other duplications like this to reduce the final size of the .md files. And tell me if you know another way of reducing token usage.

**Prompt 24:** *(add compact-docs skill)*

> add the "compact this feature's docs".

**Prompt 25:** *(clean existing feature docs)*

> clean the existing ones.

**Prompt 26:** *(log this session's prompts)*

> write the prompts of this session into prompts.md.

---

## Prompts de la sesión 7 — Optimización de consumo de tokens del orquestador

> Note: prompts reproduced verbatim, in chronological order. This session researched and applied token-reduction for the `.agents/` pipeline (embedded rubrics per reviewer, combined `reviewer_slice` per slice, CI once per round, re-review only lenses with findings, conditional post-review mutation, lens skipping, quiet runners, docs dedupe, and `reviewer_accessibility` on Haiku).

**Prompt 1:** *(research ways to use fewer tokens)*

> I have and @.agents/ORCHESTRATOR.md on this repo for developing features, but the entire process consumes too much tokens, research ways of using less tokens

**Prompt 2:** *(accept recommendations 1–10; accessibility on Haiku only)*

> Go with 1, 2, 3, 4, 5 (and review-standards should be deleted and each agent should have the standards), 6, 7, 8, 9 (only accesibillity on haiku), 10

*(aceptando las 10 recomendaciones propuestas: 1 — round 2 re-ejecuta solo reviewers con findings abiertos; 2 — CI una vez por ronda de review, los reviewers no re-ejecutan suites; 3 — review por slice colapsada en un solo agente `reviewer_slice`; 4 — segunda pasada de mutación condicional y acotada al sha pre-review; 5 — borrar `review-standards.md` y embeber cada rúbrica en su agente + sacar las reglas de la inyección global; 6 — lens skipping según el diff; 7 — test runs silenciosos y acotados por workspace/archivo; 8 — dedupe `ORCHESTRATOR.md`/`orchestrator_lead.md` y compactar `hooks-service-dao.mdc`; 9 — solo `reviewer_accessibility` a Haiku; 10 — presupuesto de `tdd.md` verificado en cada slice gate.)*

**Prompt 3:** *(log this session's prompts)*

> write the prompts of this session in prompts.md

---

## Prompts de la sesión 8 — Refinamientos del orquestador (kanban, shrink de spec, risks en tmp, fusión de reviewers, stories e i18n)

> Note: prompts reproduced verbatim, in chronological order. This session refined the `.agents/` orchestrator: move stories through `pending → in-progress → done`, shrink `spec.md` after tasks + gherkin, run compact-docs as script only (no agent), write `risks.md` under `tmp/` out of context (land in `docs/` at PR time), merge full-review agents into 2 (`reviewer_engineering` = code · architecture · performance; `reviewer_standards` = security · accessibility, dropping design), and add conventions (required stories in Storybook libs; user text via inline `t('ns.key')` unless a key dictionary).

**Prompt 1:** *(kanban: pending → in-progress → done)*

> modify the orchestrator so it moves the .md file from user-stories/pending into user-stories/in-progress when it starts to work on it,  and into user-stories/done when finished

**Prompt 2:** *(shrink spec.md after tasks)*

> after creating the spec.md and all the tasks files, review spec.md and shrink it

**Prompt 3:** *(compact docs: script only, no agent)*

> The `Compact docs (pre-PR cleanup).` should only run the script, but dont fead them into a agent/subagent, basically, only run the script

**Prompt 4:** *(risks.md in tmp/; move to docs at PR)*

> ok, and the risks.md file should be created in an tmp folder, and never added to the context, just move it to the docs folder when creating the PR

**Prompt 5:** *(merge full review into 2 agents)*

> now I want to merge the full review agents into only 2 (instead of 6):
> 1. code, performance and architecture
> 2. desing, security and accessibility

**Prompt 6:** *(remove design from reviewer_standards)*

> actually, remove design review from the reviewer_standards

**Prompt 7:** *(required stories + no labels object for i18n)*

> add 2 things:
> 1. always add stories for components in a library with storybook
> 2. don't add a labels variable, use `t('some.label)'` directly, unless is a dictionary, for example like `GENERATION_ERROR_KEYS`

**Prompt 8:** *(log prompts from kanban change onward)*

> add the prompts from "modify the orchestrator so it moves the .md file from user-stories/pending into user-stories/in-progress when it starts to work on it,  and into user-stories/done when finished" until the last one into prompts.md

---

## Prompts de la sesión 9 — `reviewer_slice` valida contra todas las reglas de `.agents/rules/`

> Note: prompts reproduced verbatim, in chronological order. This session expanded `reviewer_slice` to review each slice diff against **all** rules in `.agents/rules/` (directory glob, authoritative — picks up new rules like `state.mdc` automatically), leaving non-rule lenses (security/OWASP, accessibility/WCAG, performance) for the full review; cross-references updated ("code + design lenses" → "all rules + design").

**Prompt 1:** *(reviewer_slice checks all .agents/rules)*

> modify @reviewer_slice.md so it reviews the code against all the rules in the .agents/rules directory

**Prompt 2:** *(log prompts since last write)*

> write to prompts.md the prompts since your last write

---

## Prompts de la sesión 10 — Renombrado de `implementator` → `implementer`

> Note: prompts reproduced verbatim, in chronological order. This session renamed the agent `implementator` to `implementer` across operational harness files (agent `.agents/agents/implementer.md` + frontmatter `name`, `.agents/**`, `ORCHESTRATOR_PLAN.md`, `AGENTS.md`, `docs/features/**` artifacts, excalidraw diagram), leaving the verbatim log in `prompts.md` and `.worktrees/` copies intact.

**Prompt 1:** *(rename implementator → implementer everywhere)*

> rename everywhere from implementator into implementer

**Prompt 2:** *(log this prompt)*

> write this prompt into prompts.md

---

## Prompts de la sesión 11 — `spec_partner` usa `grill-me` y siempre pregunta ante cambios grandes

> Note: prompts reproduced verbatim, in chronological order. This session wired the `grill-me` skill (relentless one-question-at-a-time interview via `/grilling`) into `spec_partner`'s debate step, and added the rule that `spec_partner` must always ask the human when defining a new library, new architecture, or any large/structural change (never decide silently).

**Prompt 1:** *(wire grill-me into spec_partner; always ask on big changes)*

> I've added a grill-me skill into the project, I want it to be used by the spec_partner to define the spec. Also, I want the spec_partner to always ask me when there is a definition about a new library, a new architecture or any big change

**Prompt 2:** *(log this prompt)*

> add this into prompts.md

---

## Prompts de la sesión 12 — Quitar mutación pre-review y reorganizar reviewers

> Note: prompts reproduced verbatim, in chronological order. This session removed the pre-review mutation pass (single mutation after full review), updated `orchestrator-diagram.excalidraw`, and reorganized reviewers: Accessibility from `reviewer_standards` → `reviewer_slice`, Security from `reviewer_standards` → `reviewer_engineering`, then delete `reviewer_standards` (leaving `reviewer_engineering` as the sole full-review reviewer).

**Prompt 1:** *(remove mutation_tester pre-review step)*

> let's remove the mutation_tester pre-review step

**Prompt 2:** *(update orchestrator-diagram.excalidraw)*

> please also modify the orchestrator-diagram.excalidraw

**Prompt 3:** *(move a11y → slice, security → engineering; remove reviewer_standards)*

> now I want to modify the reviewers again:
> move the Accessibility review from @reviewer_standards to @reviewer_slice
> move the Security review from @reviewer_standards to @reviewer_engineering
> finally remove @reviewer_standards

---

## Prompts de la sesión 13 — Analizar últimas 3 ejecuciones de `/ticket-orchestrator`

> Note: prompts reproduced verbatim, in chronological order. This session analyzed the last 3 `/ticket-orchestrator` runs and surfaced repeated patterns, commands, prompts, and improvement opportunities.

**Prompt 1:** *(analyze last 3 runs; find improvements; log prompts)*

> Analyze the last 3 /ticket-orchestrator runs and find repeated patterns, commands, prompts, etc.
> What I want is to try to find possible improvements, for example:
> - I've saw that once run-mutation.sh failed because it was saying something like "failed to run in TTY, running with CI"
> - I've also saw python code that was created on the fly to parse the mutation results
>
> So, I want you to research the entire run, not just mutation, and find possible improvements, for example:
> - settings clear run instructions for an agent
> - adding scripts
> - modifying the implementer prompt with repeated review findings
> - etc.
>
> write the prompts of this session into prompts.md.

**Prompt 2:** *(write findings into an .md file)*

> Write everything into a .md file

---

## Prompts de la sesión 14 — Crear una skill para el orquestador

> Note: prompts reproduced verbatim, in chronological order. This session created a skill for the orchestrator via `/skill-creator`.

**Prompt 1:** *(convert initial prompt into a skill)*

> /skill-creator convert my initial prompt into a skill, add anything you think it could improve the skill

---

## Prompts de la sesión 15 — Aplicar backlog de mejoras del orquestador + checklist a regla

> Note: prompts reproduced verbatim, in chronological order. This session analyzed `.agents/ORCHESTRATOR_IMPROVEMENTS.md` and applied the P0–P4 backlog (harden `run-mutation.sh` + JSON report `parse-mutation-report.mjs`, non-TTY reporters + `inPlace` in stryker configs, `bootstrap-worktree.sh`/`set-feature-phase.sh`, mutation escalate-only, atom mutate ban, keep review history forever, implementer recurring-findings checklist, mini-gate post-`pr_ready`, etc.), then moved the pre-slice checklist into `.agents/rules/pre-slice-checklist.mdc`.

**Prompt 1:** *(apply ORCHESTRATOR_IMPROVEMENTS.md backlog)*

> Analyze the file ORCHESTRATOR_IMPROVEMENTS.md and apply the improvements

**Prompt 2:** *(move pre-slice checklist into .agents/rules)*

> move the pre-slice checklist into a file in .agents/rules

**Prompt 3:** *(log these prompts)*

> write these prompts into history.md

---

## Prompts de la sesión 16 — spec_partner en plan mode, 1 ronda de review, e2e + state-sharing rules

> Note: prompts reproduced verbatim, in chronological order. This session put `spec_partner` in **plan mode** (read-only grill → present plan → human gate approves plan ahead → then write the bundle; `spec_reviewer` post-approval), reduced spec_review and slice_review to **1 round** (no re-review; unresolvable items escalate), added `.agents/rules/e2e.mdc` (interaction-only e2e) and `.agents/rules/state-sharing.mdc` (Context against deep/large prop-drilling), and synced orchestrator `.md` files.

**Prompt 1:** *(spec_partner in plan mode)*

> I want the spec_partner to run in plan mode

**Prompt 2:** *(1 round of spec_review and 1 round of slice_review)*

> I want to change the flow so there is only 1 round of spec_review and only 1 round of slice_review

**Prompt 3:** *(add e2e.mdc — interaction-only e2e)*

> I want to add a rule .agents/rules/e2e.mdc to specify that only e2e tests with real interaction are created, so never create e2e tests that only render a storybook story and asserts that the elements are there, unit tests are already covering that, so only e2e tests with interactions

**Prompt 4:** *(add state-sharing.mdc — Context vs prop-drilling)*

> I want to add a .agents/rules/state-sharing.mdc file where it says that Context should be used to avoid large prop-drilling or many levels of prop-drilling

---

## Prompts de la sesión 17 — Conectar reglas hooks-service-dao y tanstack-query al orquestador

> Note: prompts reproduced verbatim, in chronological order. This session wired the new `.agents/rules/tanstack-query.mdc` (and updated `hooks-service-dao.mdc`, which now points to it) into orchestrator indexes: `rules.md`, `ORCHESTRATOR.md`, `reviewer_slice` enumerated list, `reviewer_engineering`/`implementer` rule lists, plan rules tree + layering bullet, and `@helsoft/hooks` pointer in `global.mdc` (also completed `state-sharing.mdc` so `reviewer_slice`'s list == the rules directory).

**Prompt 1:** *(wire hooks-service-dao + tanstack-query into orchestrator)*

> add the new rules of hooks-service-dao.mdc and tanstack-query.mdc into the orchestrator

**Prompt 2:** *(log this prompt)*

> add the prompt into prompts.md

---

## Prompts de la sesión 18 — TDD solo para código no-UI; UI implementation-first

> Note: prompts reproduced verbatim, in chronological order. This session changed build discipline by file type: **strict TDD only for non-UI `.ts`** (services/DAOs/hooks/helpers/reducers); for UI `.tsx` **implementation first, then stories, then interaction e2e, then unit tests** (never test-first). Updated `tdd.mdc`, `implementer.md`, `reviewer_slice`/`reviewer_engineering` rubrics, `ORCHESTRATOR.md`, the command, and `ORCHESTRATOR_PLAN.md`.

**Prompt 1:** *(TDD for non-UI .ts only; UI implementation-first)*

> I want to change the orchestrator so it only uses TDD for non-UI code. So it will use it for Backend code, for hooks/services/daos/helpers or any .ts file, but never for UI  .tsx files. For UI files it should work on the implementation first, then on the stories, the e2e tests that probe interaction, and finally on the unit tests

**Prompt 2:** *(re-read final changes and sync .md files)*

> re-read the final changes and update .md files

---

## Prompts de la sesión 19 — Una sola aprobación humana (spec + Gherkin)

> Note: prompts reproduced verbatim, in chronological order. This session collapsed Phase 1 to **one human approval**: `spec_partner` grills, writes spec + Gherkin, `spec_reviewer` reviews (1 round, automatic), human approves **once** the spec + Gherkin — dropped the separate advance plan approval. Updated `spec_partner.md`, `orchestrator_lead.md`, `spec_reviewer.md`, the command, and `ORCHESTRATOR.md`/`ORCHESTRATOR_PLAN.md`.

**Prompt 1:** *(single approval for spec + Gherkin; no separate plan approval)*

> Now I need to approve the plan, and then approve the spec and the Gherkin and everything. I don't want that. I just want the plan mode to ask me questions, create the spec, create the Gherkin, and I will approve only one thing.

---

## Prompts de la sesión 20 — Re-review condicional tras arreglar mutantes

> Note: prompts reproduced verbatim, in chronological order. This session added conditional re-review: when `mutation_tester` finds survivors and `implementer` kills them, the lead inspects the fix diff — if production code changed (non-test `.ts`/`.tsx` under `libs/*/src`), re-run full review on that delta; if fix was unit tests only, skip re-review. Updated `orchestrator_lead.md`, `mutation_tester.md`, `reviews_lead.md`, `implementer.md`, the command, and `ORCHESTRATOR.md`/`ORCHESTRATOR_PLAN.md` (+ mermaid).

**Prompt 1:** *(full re-review only if mutation fix changed production code)*

> I want another change: if the mutation_tester finds issues and the implementer fixed that issues. Check if there are code changes in that fix. If there are code changes, it should do a full review again. But if the changes are only on unit test, then the review is not needed.

---

## Prompts de la sesión 21 — Plan de E2E testing para app-study-buddy (web, Android, iOS)

> Note: prompts reproduced verbatim, in chronological order. This session researched React Native E2E options for 2026 and designed, in **plan mode**, a two-phase plan for `apps/app-study-buddy`: Phase 1 (Playwright, web — `testID` instrumentation, full golden path, local Supabase, docs) and Phase 2 (Maestro, Android + iOS — reuse Phase 1 instrumentation). Chose Playwright+Maestro (not Detox), `testID` selectors, local-only (no CI), golden path only (no sign-up). Plans saved in `docs/plans/e2e-testing-phase1-web.md` and `docs/plans/e2e-testing-phase2-mobile.md`.

**Prompt 1:** *(research RN E2E options for web + Android + iOS)*

> I want to implement e2e testing for app-study-buddy, the e2e should be done on web, android and ios. research the options for e2e testing in react-native at 2026

**Prompt 2:** *(clarification answers via option selection)*

> estrategia de herramientas → "Playwright (web) + Maestro (iOS/Android)"; alcance de CI → "Local only for now"; convención de selectores → "testID-based"; alcance de flujos → "Golden path only".

**Prompt 3:** *(split plan into 2 phase files)*

> ok, I want to split the plan in 2 phases: first the web full implementation and golden path, basically these points of the Order: 1,2,5,6. and a second independent phase for android & ios. so split the plan into 2 files

**Prompt 4:** *(move plans into docs/plans)*

> move both files into @docs/plans

---

## Prompts de la sesión 22 — Auditoría de reglas `.agents/rules/` y fixes por findings

> Note: prompts reproduced verbatim, in chronological order. Source transcript: `4f290287-fb7e-4e57-8578-a5c4c4731fad`. This session launched one subagent per rule file under `.agents/rules/`, wrote `findings-<rule>.md` reports, then fixed and committed findings file by file.

**Prompt 1:** *(launch one subagent per rule file; write findings-*.md)*

> For the entire repository: launch one subagent for each file on the @.agents/rules/ and check if the rules in there are being followed. Create .md files for any finding naming it like this: `findings-<rule-file-name>.md`

**Prompt 2:** *(fix findings-app-e2e.md)*

> fix @findings-app-e2e.md

**Prompt 3:** *(fix E2E_TESTS.md prerequisites not enforced by Playwright)*

> can you fix this one too: Rule prerequisites (supabase start / db reset) live in E2E_TESTS.md, not enforced by Playwright config/scripts.

**Prompt 4:** *(re-read and fix findings-component-split.md)*

> re-read @findings-component-split.md and fix it

**Prompt 5:** *(commit each fix in a different commit going forward)*

> commit each fix you made in a different commit (and do it like that from now on)

**Prompt 6:** *(fix findings-types.md; run pnpm check-types)*

> re-read @findings-types.md and fix it, run "pnpm check-types" on the root folder to check the changes

**Prompt 7:** *(fix findings-tdd.md and commit)*

> re-read @findings-tdd.md fix and commit

**Prompt 8:** *(fix findings-i18n.md and commit)*

> re-read @findings-i18n.md fix and commit

**Prompt 9:** *(fix findings-atomic-design.md and commit)*

> re-read @findings-atomic-design.md fix and commit

**Prompt 10:** *(fix findings-e2e.md and commit)*

> re-read @findings-e2e.md fix and commit

**Prompt 11:** *(fix findings-state.md and commit)*

> re-read @findings-state.md fix and commit

**Prompt 12:** *(fix findings-tanstack-query.md and commit)*

> re-read @findings-tanstack-query.md fix and commit

**Prompt 13:** *(fix findings-tanstack-query.md again and commit)*

> re-read @findings-tanstack-query.md fix and commit

**Prompt 14:** *(fix findings-pre-slice-checklist.md and commit)*

> re-read @findings-pre-slice-checklist.md fix and commit

**Prompt 15:** *(fix findings-hooks-service-dao.md and commit)*

> re-read @findings-hooks-service-dao.md fix and commit

**Prompt 16:** *(fix findings-global.md and commit)*

> re-read @findings-global.md fix and commit

**Prompt 17:** *(fix findings-unit-tests.md and commit)*

> re-read @findings-unit-tests.md fix and commit

**Prompt 18:** *(log this session's prompts)*

> save all the prompts of this session into prompts.md

---

## Prompts de la sesión 23 — Entrega final: readme.md completo y sincronización de diagramas (Mermaid ↔ Excalidraw)

> Note: prompts reproduced verbatim, in chronological order. This session read `Instrucciones Proyecto Final.md` and filled the entire `readme.md` deliverable (ficha, producto, arquitectura, modelo de datos con ER Mermaid reconstruido de las 14 migraciones, API OpenAPI de las 3 edge functions, 3 historias, 3 tickets, 3 PRs) leaving everything staged without commits; removed sign-up from the documented scope; updated the 6 `docs/architecture/*.md` to the final architecture (multi-provider BYOK, provider registry, entitlements/plan key routing, no resume); regenerated the 6 `.excalidraw` via the Excalidraw MCP; and verified twice that each Mermaid matches its `.excalidraw` (second pass regenerated them with arrow bindings + grouped labels after manual canvas edits left arrows dangling, and fixed a wrong arrow target and mislabeled arrows).

**Prompt 1:** *(fill the delivery template per the course instructions; stage only)*

> Este repositorio es para realizar una entrega de un proyecto final, revisa las instrucciones en @"Instrucciones Proyecto Final.md" y haz los cambios que consideres necesarios para cumplirlas, no hagas commit de nada, solamente deja los cambios staged

**Prompt 2:** *(sign-up is out of scope — fix the readme)*

> el sign-up no fue realizado todavia, esta fuera del scope

**Prompt 3:** *(audit docs/architecture against the final system)*

> ok, revisa si los documentos de arquitectura reflejan la arquitectura final del sistema

**Prompt 4:** *(update all architecture docs + readme)*

> si, actualiza todo, incluido el readme.md

**Prompt 5:** *(regenerate the .excalidraw files via the Excalidraw MCP)*

> puedes usar el mcp de excalidraw para regenerar esos archivos

**Prompt 6:** *(re-verify the match after manual canvas edits)*

> vuelve a revisar que los mermaid coinciden con excalidraw
