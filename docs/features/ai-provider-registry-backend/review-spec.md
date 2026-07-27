# Spec review — ai-provider-registry-backend

## Round 1 — `spec_reviewer`

**Verdict: CHANGES_REQUESTED** → **all 5 findings resolved by `spec_partner`** (single review round; no re-review follows).

### Blocker

1. **[resolved — with a correction to the finding itself]** Frontend story AC vs the backend's save/remove asymmetry (D10), and `spec.md`'s cross-story note.
   `user-stories/pending/ai-provider-registry-frontend.md` still has an AC line asserting `save/remove` are rejected together for a disabled provider — this contradicts `task-9.md`'s matrix (`remove + disabled → allowed, 200`) and `gherkin-scenarios.md` `@s24`. `spec.md`'s "Cross-story traceability" section claims the frontend story was already amended, but that correction is not actually present in the frontend story file as it exists on disk.

   **Resolution — the finding was partly inaccurate, and re-verifying it surfaced two *different*, genuine contradictions that were fixed instead:**
   - **The save/remove contradiction was already fixed.** The original combined AC had already been replaced by three separate `manage-api-key` ACs (save+disabled → `provider_disabled`; save+unknown → `network_error`; remove+disabled → proceeds, remove+unknown → rejected). The only surviving occurrence of the phrase `"save/remove... is rejected"` is a **quotation inside the supersession note**, which is correct and was deliberately kept. No contradictory AC existed.
   - **Real contradiction #1 (fixed):** the frontend story's `generate-lesson` AC read "resolves a provider (**BYOK or platform path**) that exists but is disabled → `provider_disabled` at HTTP 422", directly contradicting **D14** (platform path → existing `platform_key_unavailable` 503). Split into two ACs: BYOK → `provider_disabled` 422; platform → `platform_key_unavailable` 503, explicitly "*not* `provider_disabled`".
   - **Real contradiction #2 (fixed):** the frontend story's Context omitted **`sort_order`** from both table shapes, so that story could not have preserved today's provider/model order (**D1**). Added to both table descriptions, plus a new ordering AC and a traceability item.
   - **Ambiguity tightened:** "their key is **not deleted**" now reads "not deleted **automatically** — the learner can still remove it themselves (see the `remove` AC below)", removing the apparent clash with D10.
   - `spec.md`'s cross-story section was rewritten to stop overclaiming: it now enumerates exactly which decision IDs that story owns (D1, D10, D11/D12, D13, D14, D15) and states the amendment is now in place — which, as of this round, it is.

### Major

2. **[resolved]** Dual-owned `@s5`/`@s6`/`@s7`. `task-12.md` no longer claims scenario ownership: its frontmatter is now `scenarios: []` plus a new non-authoritative `verifies: [s1..s9]` field, and its Goal states explicitly that `@s1`–`@s7` are owned by task-1 and `@s8`–`@s9` by task-2. task-1 and task-2 gained matching "**Owns** …; task-12 verifies them and claims no scenario ownership" lines. Ownership is now single and non-overlapping across all 28 tags.

3. **[resolved]** Unlabeled decisions. `spec.md`'s list now carries explicit **`D1:`–`D17:`** labels (extended past D14 to cover the three plan-level decisions previously unnumbered), renumbered so every citation in `task-1..12.md` resolves unambiguously:
   - D11 = `provider_disabled` for `manage-api-key` **+ the `ApiKeyErrorCode` frontend-ownership boundary** (previously only in the unnumbered cross-story paragraph — now a first-class numbered decision, fixing `task-9`'s citation).
   - D12 = `provider_disabled` only for genuinely disabled; unknown unchanged (`task-8`/`task-9` now resolve).
   - D13 = the `GenerationErrorCode` 422 counterpart + its frontend-ownership boundary (`task-7`).
   - D14 = platform route reuses `platform_key_unavailable` 503 (`task-1`/`task-7` now resolve).
   - D15/D16/D17 = `libs/types` untouched / no analytics-or-flags / risk-based slicing.
   A header line now states the section is the single source of decision rationale.

### Minor

4. **[resolved]** Migration header ownership. `task-1` and `task-2` now say they **author** their own headers (task-1: reversibility note + `groq` blast-radius warning + Studio runbook; task-2: reversibility note), each adding "task-12 verifies these exist; it does not write them." `task-12`'s criterion is reworded to **verify, not author**, instructed to report a gap back rather than edit those files, and the two migration paths were **removed from its `paths:`** so it no longer declares write access to them. Its only artifact is `tmp/<feature>/verify-provider-registry.sql`.

5. **[resolved]** Duplicated rationale. Every `task-N.md` Notes section now opens with a one-line `Decisions: **Dx** (…), **Dy** (…). Rationale lives in spec.md` pointer, with the near-verbatim *why* prose deleted: D9 trimmed in `task-3`/`task-6`/`task-11`; D6 in `task-4`/`task-5`/`task-8`/`task-10`; D10/D11/D12 in `task-9`; D11/D13/D14 in `task-7`; D4 in `task-6`; D1/D2/D14 in `task-1`; D3 in `task-2`. Operationally load-bearing specifics (exact statuses, file paths, existing code shapes, repo precedents) were **kept** — only the duplicated reasoning was removed. `spec.md` is the sole source of rationale and remains within its terse-overview budget.

### Clean (no findings — carried forward from round 1)

Seed data in `@s5` matches today's hardcoded registry/guidance URLs/locale strings byte-for-byte; the migration-ordering dependency between `task-1`/`task-2` (D3) is explicit and cross-referenced in both directions; all 12 tasks' `paths` are valid non-`libs/*` locations with established repo precedent; all 28 `@s` tags are unique, testable, and now map to exactly one owning task with no orphans; `tasks.md` doesn't duplicate per-task frontmatter.

### Files changed in this fix round

- `docs/features/ai-provider-registry-backend/spec.md` — D1–D17 labels; rewritten cross-story section
- `docs/features/ai-provider-registry-backend/task-1.md … task-12.md` — ownership lines, header-authoring split, Notes trimmed to decision pointers; `task-12` frontmatter `scenarios: []` + `verifies:` and reduced `paths`
- `docs/features/ai-provider-registry-backend/review-spec.md` — this trail
- **Outside this worktree** (delivery branch checkout, uncommitted): `user-stories/pending/ai-provider-registry-frontend.md` — platform-path AC split (D14), `sort_order` added to both table shapes + a new ordering AC (D1), "not deleted automatically" clarification (D10), traceability note restructured into six decision-ID items
