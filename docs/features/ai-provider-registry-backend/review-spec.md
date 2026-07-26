# Spec review — ai-provider-registry-backend

## Round 1 — `spec_reviewer`

**Verdict: CHANGES_REQUESTED**

### Blocker

1. **[open]** Frontend story AC still contradicts the backend's save/remove asymmetry (D10), and `spec.md`'s cross-story note is false as written.
   `user-stories/pending/ai-provider-registry-frontend.md` still has an AC line asserting `save/remove` are rejected together for a disabled provider — this contradicts `task-9.md`'s matrix (`remove + disabled → allowed, 200`) and `gherkin-scenarios.md` `@s24` ("Removing a key succeeds for a disabled provider"). `spec.md`'s "Cross-story traceability" section claims the frontend story was already amended to reflect the remove-allowed-when-disabled behaviour, but that correction is not actually present in the frontend story file as it exists on disk. Either apply the fix to the frontend story's AC (split into a `save`-only rejection clause + a `remove`-always-allowed clause), or correct `spec.md` to stop claiming this is already resolved.

### Major

2. **[open]** Dual-owned scenarios `@s5`, `@s6`, `@s7` — both `task-1.md` (`scenarios: [s1..s7]`) and `task-12.md` (`scenarios: [s5, s6, s7]`) claim ownership of the same tags, violating the single-owning-task rule. Resolve by either having `task-12` not declare `scenarios:` ownership for `s5–s7` (it's the verification mechanism, not a distinct implementation of them), or by making the split explicit and non-overlapping.

3. **[open]** `spec.md`'s decision IDs (`D1`–`D14`, cited throughout `task-1/3/4/6/7/8/9/10/12`) are never labeled in `spec.md` itself, and the reconstructable mapping is inconsistent:
   - `task-8`/`task-9` cite `D12` for "provider_disabled fires only for genuinely disabled" — that's bullet position 11 in `spec.md`'s unlabeled list, not 12.
   - `task-1`/`task-7` cite `D14` for "platform route reuses `platform_key_unavailable`" — that's bullet position 12, not 14.
   - `task-9` cites `D11` for "`ApiKeyErrorCode` widening is frontend-story scope" — that content only appears in the unnumbered "Cross-story traceability" paragraph, not the numbered list.
   - `task-7` cites `D11/D13` for the same scope-boundary idea.
   Add explicit `D1:`–`D14:` labels to `spec.md` covering every decision cited by any task (including the frontend-ownership items currently only in the Cross-story paragraph), with numbering corrected so every task's citation resolves unambiguously.

### Minor

4. **[open]** Ambiguous/duplicated ownership of migration header comments across `task-1`/`task-2` and `task-12`. `task-1.md` and `task-2.md` each already require their own reversibility-note header as a Done criterion; `task-12.md` restates the identical requirement for both files. Clarify whether `task-12` verifies headers `task-1`/`task-2` already wrote, or is itself authoritative for authoring them.

5. **[open]** Decision rationale duplicated near-verbatim between `spec.md` and multiple `task-N.md` Notes sections (e.g. D9 in `spec.md`/`task-3.md`/`task-6.md`; D6 in `spec.md`/`task-4.md`/`task-8.md`/`task-10.md`; D10 in `spec.md`/`task-9.md`), pushing `spec.md` past its terse-overview budget. Trim task Notes to a one-line pointer referencing the decision ID; keep `spec.md` as the single source of the rationale.

### Clean (no findings)

Seed data in `@s5` matches today's hardcoded registry/guidance URLs/locale strings byte-for-byte; the migration-ordering dependency between `task-1`/`task-2` (D3) is explicit and cross-referenced in both directions; all 12 tasks' `paths` are valid non-`libs/*` locations with established repo precedent; all 28 `@s` tags are unique, testable, and (apart from finding 2) map to exactly one owning task with no orphans; `tasks.md` doesn't duplicate per-task frontmatter.
