---
name: orchestrator-run-retro
description: >
  Mine the last N /ticket-orchestrator runs for repeated friction and turn them into
  actionable orchestrator improvements (scripts, clearer agent prompts, implementer
  checklists, gate/process fixes). Use whenever the user asks to analyze orchestrator
  runs, retro the pipeline, find repeated agent improvisation (TTY/mutation parse/
  python one-liners), improve mutation_tester/implementer/reviews_lead prompts, or
  update ORCHESTRATOR_IMPROVEMENTS — even if they only mention "last 3 features",
  "mutation friction", or "what keeps going wrong in the orchestrator".
disable-model-invocation: true
---

# Orchestrator run retro

Turn completed `/ticket-orchestrator` runs into a durable improvement backlog. Agents draft features; retros prune the harness.

**Why:** the same tax recurs across features — mutation log scraping, wrong `main` base, empty review files, slice findings that should have been in `implementer.md`. A retro that only skimmed `mutation.md` would miss half of it.

## When to use

- "Analyze the last N orchestrator runs"
- "What scripts should we add from agent improvisation?"
- After several `pr_ready`/`done` features, before changing `.agents/`

**Not for:** implementing the backlog (separate chore), or running a live feature through the pipeline (`orchestrator_lead`).

## Inputs

| Input | Default |
|---|---|
| `N` | 3 (last full orchestrator features that reached `pr_ready` or `done`) |
| Output path | `.agents/ORCHESTRATOR_IMPROVEMENTS.md` (overwrite or merge — ask if file exists with locked decisions) |
| Scope | Whole pipeline (boot → spec → slices → full review → mutation → DoD → close), not mutation-only |

Skip ad-hoc/`n/a` history lines unless the user asks. Prefer features with `docs/features/<name>/`.

## Protocol

### 1. Select runs

1. Read `progress/history.md` (newest at bottom) and `progress/current.md`.
2. Take the last **N** entries that are real orchestrator features (`pr_ready`/`done`, have `docs/features/<name>/`).
3. Note delivery branch name from recent notes (`feature-entregaN-*`).

### 2. Per feature — docs first

For each `<name>`, read (skim if huge; still open every file):

`docs/features/<name>/{mutation,review,review-engineering,review-slice,review-spec,dod,tdd,tasks,risks,spec}.md`

Record:

- Round counts (spec / slice / full review / mutation kill loops)
- Empty or stub review files (process smell)
- Mutation base-ref, survivors, errors, helper bypasses (`inPlace`, manual `stryker`)
- DoD fails then passes; human waivers; post-DoD changes

### 3. Per feature — transcripts

Mine agent transcripts for improvisation and false claims:

**Locations (check both):**

- `~/.cursor/projects/<main-project>/agent-transcripts/`
- `~/.cursor/projects/<main-project>-worktrees-<name>/agent-transcripts/` (boot often moves root mid-run)

**Search themes** (rg across parent + subagents):

```
run-mutation|stryker|TTY|progress-append|inPlace|mutationTestReport|tee /tmp|python3|sed -i
yarn test-ci|set -e|IconButton|atoms/|CHANGES_REQUESTED|ESCALATE|human-excluded
bootstrap|worktree|origin/main|feature-entrega|SafeArea|requestClose
```

Capture **evidence**: transcript uuid (short) + short quote, or `docs/...` path.

Use explore subagents **in parallel** (one feature each) when N≥2; merge afterward.

### 4. Gap analysis (required)

Friction alone is not enough — check whether current harness already forbids it:

| Friction type | Diff against |
|---|---|
| Mutation ops | `.agents/skills/mutation-testing/` + `run-mutation.sh` + `mutation_tester.md` |
| Boot / base-ref / phases | `orchestrator_lead.md`, `ORCHESTRATOR.md`, ticket-orchestrator command |
| Recurring slice/review findings | `implementer.md`, `reviewer_slice.md`, `reviews_lead.md` |
| Empty reviews / compact wipe | `reviews_lead.md`, `compact-docs` skill, `dod_validator.md` |
| Test commands | project `AGENTS.md` / implementer (prefer `pnpm --filter …`) |

Mark each proposal: **gap** (not in harness) vs **already fixed** (cite commit/doc) vs **regressing** (rule exists, agents ignore → strengthen wording or add script).

### 5. Classify improvements

Every proposal goes in exactly one bucket:

1. **Script / tooling** — agents invented the same shell/python ≥2 times → checked-in script (parse mutation JSON, bootstrap worktree, set phase, …)
2. **Agent / skill prompt** — clearer run instructions, checklists, hard rules with *why*
3. **Gate / process** — escalate-only mutation, delivery-branch base, keep review history, post-DoD mini-gate
4. **Product/spec hygiene** — grilling fixtures, single-owner `@s`, Open Decisions for scope that review otherwise invents

**Heuristic:** if the fix is deterministic parsing or git/pnpm ops → script. If it is judgment/checklist → prompt. If it is “agents rewrote PASS to ship” → gate.

### 6. Write the backlog file

Write/update `.agents/ORCHESTRATOR_IMPROVEMENTS.md` using the template below. Concise. Evidence-backed. Prioritized.

Surface **Unresolved questions** at the end for the human (extremely terse). Do not invent locked decisions — leave a Decisions table for the human to fill, or record answers they already gave in-session.

### 7. Return to the user

Short chat summary:

- N features analyzed
- Top 3–5 improvements (P0)
- Path to the `.md` backlog
- Unresolved questions (if any)

Do **not** implement the backlog unless the user asks.

## Output template

```markdown
# Orchestrator improvements — backlog from last N runs

Derived from: <feature list + dates + transcript ids>

Already applied (skip): <cite>

## Decisions (locked)
| Question | Decision |
|---|---|
| … | … (only if human answered) |

## Cross-run friction
| Pattern | Runs | Agents improvise | Evidence |

## Priority backlog
### P0 — …
### P1 — …
…

## Suggested implementation order
1. …

## Files to touch
| Area | Paths |

## Per-run notes
### `<name>`
- …

## Unresolved questions
- …
```

## High-signal smells (hunt these)

| Smell | Typical improvement |
|---|---|
| `tee` + `rg '[Survived]'` or `node -e` on `mutation.html` | JSON reporter + `parse-mutation-report` script |
| Non-TTY / `progress` downgrade | CI/non-TTY reporters in `run-mutation.sh` |
| Bypass helper with `stryker --inPlace` | Bake `inPlace` / fix sandbox in config+script |
| `set -e` stops after first lib under threshold | Continue-all-libs; aggregate exit |
| Worktree from `main` then recreate | Default base = delivery branch |
| Lead `python3`/`sed` phase edits | `set-feature-phase.sh` |
| Empty `review*.md` on APPROVED | Keep review history forever |
| Same slice finding across features | Bake into `implementer.md` checklist |
| Touch `atoms/*` for feature a11y → mutant flood | Ban mutating atoms unless story owns the atom |
| Post-DoD AC/API change without remasure | Mini-gate (gherkin + tests + mutation) |
| Mutation PASS via reclassified survivors | Escalate-only; never rewrite PASS |
| `yarn test-ci` / wrong package manager | Align prompts with monorepo `pnpm` |

## Hard rules

- Entire pipeline, not mutation-only.
- Evidence for every friction row (path or transcript id + quote).
- Gap-analyze against current `.agents/` before proposing.
- Prefer scripts for repeated improvisation; prefer prompts for recurring review themes.
- Write the durable `.md`; don’t only dump findings in chat.
- Don’t implement fixes in the same pass unless asked.
- Don’t lock Decisions the human didn’t make.

## Related

- Source of truth: `.agents/ORCHESTRATOR.md`
- Example backlog: `.agents/ORCHESTRATOR_IMPROVEMENTS.md`
- Mutation skill: `.agents/skills/mutation-testing/`
- Compact docs: `.agents/skills/compact-docs/` (retros should flag if it wipes review history)
