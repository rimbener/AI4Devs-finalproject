# Mutation — tanstack-query-hooks-migration

_Auto-stubbed by `parse-mutation-report.mjs` from the per-lib Stryker JSON reports. 40 survivor(s), 129 error mutant(s) ⚠ — kill or ESCALATE (never rewrite as PASS)._

| lib | total | killed | survived | errors | score % |
|---|--:|--:|--:|--:|--:|
| @helsoft/hooks | 253 | 95 | 32 | 126 ⚠ | 74.8 |
| @helsoft/study-buddy | 63 | 55 | 8 | 0 | 87.3 |
| @helsoft/supabase-services | 6 | 3 | 0 | 3 ⚠ | 100.0 |

## Surviving mutants

- `src/hooks/use-api-key.ts:63` — StringLiteral (NoCoverage)
- `src/hooks/use-api-key.ts:51` — StringLiteral (Survived)
- `src/hooks/use-api-key.ts:69` — BlockStatement (Survived)
- `src/hooks/use-api-key.ts:79` — ArrayDeclaration (Survived)
- `src/hooks/use-api-key.ts:86` — ArrayDeclaration (Survived)
- `src/hooks/use-api-key.ts:93` — ConditionalExpression (Survived)
- `src/hooks/use-api-key.ts:93` — EqualityOperator (Survived)
- `src/hooks/use-lesson-attempt.ts:45` — ArrayDeclaration (Survived)
- `src/hooks/use-lesson-attempt.ts:49` — ConditionalExpression (Survived)
- `src/hooks/use-lesson-attempt.ts:51` — BooleanLiteral (Survived)
- `src/hooks/use-lesson-generation.ts:83` — StringLiteral (NoCoverage)
- `src/hooks/use-lesson-generation.ts:57` — BlockStatement (Survived)
- `src/hooks/use-lesson-generation.ts:56` — BlockStatement (Survived)
- `src/hooks/use-lesson-generation.ts:61` — ArrayDeclaration (Survived)
- `src/hooks/use-lesson-generation.ts:64` — ArrowFunction (Survived)
- `src/hooks/use-lesson-generation.ts:64` — ArrayDeclaration (Survived)
- `src/hooks/use-lesson-generation.ts:97` — ArrayDeclaration (Survived)
- `src/hooks/use-lesson-generation.ts:104` — ArrayDeclaration (Survived)
- `src/hooks/use-lesson.ts:27` — ArrayDeclaration (Survived)
- `src/hooks/use-lessons.ts:46` — ArrayDeclaration (Survived)
- `src/hooks/use-lessons.ts:48` — ArrayDeclaration (Survived)
- `src/hooks/use-pdf-documents.ts:46` — ArrayDeclaration (Survived)
- `src/hooks/use-pdf-documents.ts:48` — ArrayDeclaration (Survived)
- `src/hooks/use-slide-image-url.ts:22` — StringLiteral (Survived)
- `src/hooks/use-profile.ts:28` — StringLiteral (Survived)
- `src/hooks/use-profile.ts:43` — ArrayDeclaration (Survived)
- `src/hooks/use-session-gate.ts:14` — OptionalChaining (Survived)
- `src/hooks/use-session.ts:28` — BlockStatement (Survived)
- `src/hooks/use-session.ts:29` — LogicalOperator (Survived)
- `src/hooks/use-session.ts:28` — ConditionalExpression (Survived)
- `src/hooks/use-session.ts:40` — BooleanLiteral (Survived)
- `src/hooks/use-session.ts:49` — ArrayDeclaration (Survived)
- `src/components/lesson-generation/use-lesson-generation.ts:36` — OptionalChaining (Survived)
- `src/components/lesson-generation/use-lesson-generation.ts:43` — ConditionalExpression (Survived)
- `src/components/lesson-generation/use-lesson-generation.ts:49` — ConditionalExpression (Survived)
- `src/components/lesson-generation/use-lesson-generation.ts:56` — BlockStatement (Survived)
- `src/components/lesson-generation/use-lesson-generation.ts:57` — BooleanLiteral (Survived)
- `src/components/lesson-generation/use-lesson-generation.ts:66` — ConditionalExpression (Survived)
- `src/components/lesson-generation/use-lesson-generation.ts:66` — LogicalOperator (Survived)
- `src/components/lesson-generation/use-lesson-generation.ts:75` — OptionalChaining (Survived)

Each survivor is handed to `implementer` (write the red test that kills it), never marked killed here.

## Orchestrator scoping analysis (added post-run, before routing to implementer)

**Error-mutant investigation (129 CompileError, 0 RuntimeError):** inspected the raw JSON reports
(`libs/hooks/reports/mutation/mutation.json`, `libs/supabase-services/reports/mutation/mutation.json`)
directly. Every error mutant's `statusReason` is a genuine TypeScript diagnostic (`TS2322`, `TS2345`,
`TS2554`, `TS2741`, `TS2355`, `TS2769`, `TS2367`, `TS18048`, `TS1360`, `TS2740`, `TS2739`, `TS2531`,
`TS18046`, `TS18047`, `TS2532`, `TS2698`, `TS2533`, `TS2721`) — e.g. a `BlockStatement` mutant that
empties a function body whose return type disallows `void` fails with `TS2355`. None are
"cannot find module"/path-resolution failures, which is what the `checkers: ['typescript']` sandbox
misconfiguration in the historical `entitlements` run (referenced in the mutation-testing SKILL) looked
like. **Conclusion: these are the TypeScript checker legitimately rejecting mutants that break the type
system before Jest runs — expected behavior for `@helsoft/hooks`/`@helsoft/supabase-services`'s
`checkers: ['typescript']` config, not a sandbox defect.** Not investigated further; not escalated.

**Scope exclusion — the 4 exempt hooks' pre-existing survivors are legacy, not this feature's delta.**
16 of the 40 survivors sit in `src/hooks/use-lesson-generation.ts` (8) and
`src/components/lesson-generation/use-lesson-generation.ts` (8) — both are hooks this feature
explicitly declared **exempt** from migration (see `.agents/rules/tanstack-query.mdc`'s Exemptions
section and this feature's task-11). Diffing both files against the delivery branch
(`feature-entrega3-HernanLaura`) confirms the *entire* feature touched only their doc comments — zero
logic lines changed (verified independently by `reviewer_slice` in the slice-8 review, and re-confirmed
here via `git diff feature-entrega3-HernanLaura...HEAD`). Per the mutation-testing SKILL's stated
policy — **"Threshold: 100% of mutants killed on the new/changed lines… Legacy untouched code is
measured, not blocked"** — these 16 survivors are pre-existing gaps in code this feature never touched
behaviorally. They are **out of scope for this gate** and are not routed to `implementer`. (They remain
visible in the per-lib table above/JSON reports for whoever eventually migrates or revisits those two
hooks — not silently hidden, just not this feature's obligation.)

**In-scope survivors requiring a kill: 24**, all in files this feature actually rewrote behaviorally:

| File | Survivors | Lines |
|---|--:|---|
| `use-api-key.ts` | 7 | 51, 63, 69, 79, 86, 93×2 |
| `use-lesson-attempt.ts` | 3 | 45, 49, 51 |
| `use-lesson.ts` | 1 | 27 |
| `use-lessons.ts` | 2 | 46, 48 |
| `use-pdf-documents.ts` | 2 | 46, 48 |
| `use-slide-image-url.ts` | 1 | 22 |
| `use-profile.ts` | 2 | 28, 43 |
| `use-session-gate.ts` | 1 | 14 |
| `use-session.ts` | 5 | 28×2, 29, 40, 49 |

**Effective mutation score on in-scope (feature-owned) code:** of the 24 + killed/timeout mutants across
these 9 files (excluding both `use-lesson-generation.ts` files and their CompileError/legacy noise),
24 survivors remain to be killed — routed to `implementer` below.

> ⚠ 129 error mutant(s) (CompileError) — investigated above, confirmed legitimate TypeScript-checker
> rejections, not a sandbox defect. Not escalated.
