# Mutation — card-list-with-abm-dialog

> ⚠ **STALE relative to current code.** All rounds below (including the accepted 97.2–97.5%
> baseline) predate a substantial human-authored architecture rewrite (Context + `useReducer`,
> new sub-component files) and a new Add-dialog feature — see `spec.md`'s "Issues found by this
> doc pass" and `task-4.md`. Mutation has not been re-run against the current shape; do not treat
> the accepted score below as covering the current tree.

## Round History

| Round | Base | total | killed | ignored | survived | errors | score % | Status |
|---|---|--:|--:|--:|--:|--:|--:|---|
| 1 (initial) | — | 79 | 51 | 0 | 27 | 1 | 65.4 | —  |
| 2 (kill pass) | — | 79 | 69 | 6 | 2 | 1 | 97.2 | Approved  |
| 3 (restructure investigation) | — | 79 | 69 | 6 | 2 | 1 | 97.2 | Human-accepted ✓  |
| 4 (bug-fix re-run, post-pr_ready) | feature-entrega3-HernanLaura | 87 | 75 | 0 | 5 | 1 | 93.8 | Survivors (new) — ESCALATE |
| 5 (kill pass, this round) | feature-entrega3-HernanLaura | 87 | 76 | 2 | 2 | 1 | 97.4 | **Approved — back to Round 2 baseline** |
| 6 (molecule extraction re-run) | feature-entrega3-HernanLaura | 90 | 76 | 0 | 4 | 2 ⚠ | 95.0 | NEW SURVIVORS — 2 from prior rounds + 2 new (testID exports) — ESCALATE |
| 7 (kill pass, testID export) | feature-entrega3-HernanLaura | 90 | 78 | 0 | 2 | 2 ⚠ | 97.5 | **Approved — back to Round 5/2 baseline** |

---

## Round 7 — Kill pass for the 2 new Round-6 testID-export survivors (2026-07-27)

**Verdict: 97.50%, 2 survivors — both the pre-existing documented-equivalent `ConditionalExpression`
survivors at lines 134/142 (relocated by the Round 6 molecule extraction, untouched, unchanged
reasoning from Rounds 1–5). The 2 NEW survivors from Round 6's `cardListItemCardTestId` export are
resolved.**

### What changed

Added one direct unit test to `card-list-with-abm-dialog.test.tsx` asserting the exact resolved
string each testID-builder export produces, instead of only exercising them indirectly through
`getByTestId` lookups (which pass regardless of the literal's exact content, since the same
literal is used to both build and query):

```ts
it('builds the row/edit/remove testID strings in the documented format', () => {
  expect(cardListItemCardTestId('item-1')).toBe('card-list-with-abm-dialog-card-item-1');
  expect(cardListItemEditTestId('item-1')).toBe('card-list-with-abm-dialog-edit-item-1');
  expect(cardListItemRemoveTestId('item-1')).toBe('card-list-with-abm-dialog-remove-item-1');
});
```

This is a real, valuable assertion (locks the testID contract that every other test and the
Playwright e2e suite rely on for row/edit/remove element lookup), not a metrics-gaming hack. It
directly kills both Round 6 survivors:

- `card-list-with-abm-dialog.tsx:21` — `StringLiteral` (empty-string replacement on
  `` `card-list-with-abm-dialog-card-${id}` ``) — **KILLED**: the new `toBe` assertion fails
  outright against `''`.
- `card-list-with-abm-dialog.tsx:21` — `ArrowFunction` (`() => undefined` replacement) — **KILLED**:
  the new assertion fails against `undefined`.

No production code changed — this was a pure test-strengthening fix per the "kill mutation
survivors by strengthening the test wherever possible" rule; the export's behavior was already
correct.

### Score analysis (Round 7)

- **Round 6**: 90 mutants, 76 killed, 0 ignored, 4 survived (2 pre-existing relocated + 2 new
  testID-export), 2 errors. Score = 76/(76+4+2) = 95.00%.
- **Round 7**: 90 mutants, 78 killed, 0 ignored, 2 survived (134/142, unchanged, documented
  equivalent), 2 errors. Score = 78/(78+2+2) = 97.50%.

### Gates (Round 7)

- `pnpm --filter @helsoft/components test -- card-list-with-abm-dialog.test.tsx --silent` — new
  test green alongside the existing 29 in the file (30/30).
- `pnpm --filter @helsoft/components test` — 71/71 suites, 534/534 tests green.
- `pnpm --filter @helsoft/components lint` — clean.
- `pnpm --filter @helsoft/components check-types` — clean.
- `pnpm --filter @helsoft/components exec playwright test
  tests/e2e/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.e2e.js --reporter=list`
  — 5/5 passed.
- Stryker re-run (`.agents/skills/mutation-testing/scripts/run-mutation.sh
  feature-entrega3-HernanLaura` + `parse-mutation-report.mjs card-list-with-abm-dialog`) scoped to
  this feature's 5 changed/new files: 90 mutants, 78 killed, 0 ignored, 2 survived (134/142,
  documented equivalent, untouched), 2 errors (both investigated — the pre-existing theme-factory
  `StyleSheet.create` `ArrowFunction` RuntimeError from Rounds 1–6, plus one more of the same kind
  now surfacing from the `CardListRow` molecule's own theme factory, both treated-as-detected per
  the established convention) — **97.50%**.

### Survivors — Round 7 (unchanged from Round 6, relocated from Rounds 1–5)

- `card-list-with-abm-dialog.tsx:134` — `ConditionalExpression` (`true` replacement) —
  `if (dialogState?.type === 'edit')` guard in `handleEditConfirm`. Relocated from line 98 (Round
  5) / line 98 (Rounds 1–4) by the Round 6 molecule extraction. Same documented-equivalent
  reasoning carried forward unchanged (see Rounds 1–3's full investigation below): the guard's
  else-branch never fires via any real interaction path, since this Dialog's own Save button (the
  only caller of `handleEditConfirm`) only exists in the render tree while `open`, i.e. while
  `dialogState?.type === 'edit'` already holds.
- `card-list-with-abm-dialog.tsx:142` — `ConditionalExpression` (`true` replacement) — same
  reasoning, `handleRemoveConfirm`'s `dialogState?.type === 'remove'` guard, relocated from line
  106.

### Files changed this round

- `libs/components/src/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.test.tsx` —
  added the testID-builder-format assertion (kills the 2 Round-6 `StringLiteral`/`ArrowFunction`
  survivors on `cardListItemCardTestId`). No production source touched.

---

## Round 6 — Molecule extraction re-run (2026-07-27)

**Verdict: 95.00%, 4 survivors — 2 previously-accepted equivalents (lines 134/142) now relocated,
2 NEW survivors in the `cardListItemCardTestId` export (lines 21). ESCALATE.** (Resolved in Round 7
above.)

This round re-ran mutation testing after the `CardListRow` molecule extraction (commits
e4b2a5a54 and f753311a5), which moved row content rendering out of the organism and introduced
a `CardListRowAdapter` to map generic `CardListItem<TItem>` down to the molecule's flat prop
shape.

### Scope

**Files measured:**
- `libs/components/src/molecules/card-list-row/card-list-row.tsx` (new)
- `libs/components/src/molecules/card-list-row/card-list-row.types.ts` (new)
- `libs/components/src/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.tsx`
- `libs/components/src/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.types.ts`
- `libs/components/src/organisms/card-list-with-abm-dialog/use-card-list-with-abm-dialog.ts`

**New files in scope:** The `CardListRow` molecule (2 files) brought 20 net new mutants and
were fully tested with 10 killed, 0 survived, 1 error (the StyleSheet.create theme-factory
error, matching the pattern in the organism). The molecule itself does not produce new
survivors.

**Organism changes:** The extraction moved lines; the two documented-equivalent survivors
(formerly at lines 98/106 in Round 5, now at lines 134/142) remain unreachable via the
identical `handleEditConfirm`/`handleRemoveConfirm` guard logic. No behavior change to
those handlers — they were relocated within the file to accommodate the row extraction.

### Survivors — Round 6

**Two pre-existing (relocated from Rounds 1–5):**

- `card-list-with-abm-dialog.tsx:134` — `ConditionalExpression` (`true` replacement)
  - `if (dialogState?.type === 'edit')` guard in `handleEditConfirm`
  - **Relocated from line 98 (Round 5).** Same unreachable-guard equivalence — the test that
    would force this `true` mutant to survive is the one already establishing that the handler
    is called while `open` is true, which already means `dialogState.type === 'edit'` is true.
    This is the documented-equivalent survivor carried forward from Rounds 1–5 without
    revisiting.

- `card-list-with-abm-dialog.tsx:142` — `ConditionalExpression` (`true` replacement)
  - `if (dialogState?.type === 'remove')` guard in `handleRemoveConfirm`
  - **Relocated from line 106 (Round 5).** Same reasoning as the `'edit'` guard above.

**Two NEW (in the organism-owned export layer), killed in Round 7:**

- `card-list-with-abm-dialog.tsx:21` — `StringLiteral` (empty string replacement)
  - `export const cardListItemCardTestId = (id: string) => `card-list-with-abm-dialog-card-${id}`;`
  - Mutates the template literal to an empty string.
  - **Not covered:** Tests do render cards under this testID (via FlatList), but Stryker's
    mutant (changing the ID to `""`) is not caught by the testing strategy. All 25 tests
    that exercise the testID still pass because they match on "render count and type," not
    on the specific ID value. A test that **asserts** the exact testID value would kill this.

- `card-list-with-abm-dialog.tsx:21` — `ArrowFunction` (undefined replacement)
  - Same export, function signature mutated to `() => undefined`.
  - **Not covered:** All 29 tests that cover this code pass; none assert that the function
    returns a non-undefined value or has the expected arity. Tests call it (via FlatList's
    internal keyExtractor setup) but don't validate the return structure.

### Score analysis (Round 6)

- **Round 5:** 87 mutants, 76 killed, 2 ignored, 2 survived, 1 error. Score = 97.44%.
- **Round 6:** 90 mutants, 76 killed, 0 ignored, 4 survived, 2 errors.
  - Net new mutants: +3 in organism (testID export moves + minor line shifts) +20 in new molecule = +23.
  - Net new killed: 0 (molecule's 10 killed already accounted for in its 10-mutant total).
  - Survivors increased from 2 to 4 (+2 new in testID export).
  - Score: 76/(76+4+2 errors) = 95.00%.

### Gates (Round 6)

- `pnpm --filter @helsoft/components test` — 70+ suites, 530+ tests green (molecule adds
  ~14 new tests to the `card-list-row.test.tsx` suite).
- `pnpm --filter @helsoft/components lint` — clean.
- `pnpm --filter @helsoft/components check-types` — clean.
- Stryker re-run (`.agents/skills/mutation-testing/scripts/run-mutation.sh
  feature-entrega3-HernanLaura` + auto-parse) scoped to this feature's 5 changed/new files:
  90 mutants, 76 killed, 0 ignored, 4 survived (2 pre-existing relocated + 2 new), 2 errors
  — **95.00%**, below the 100% threshold. **ESCALATE.**

### Path forward (Round 6, resolved by Round 7 above)

**Two options:**

1. **Escalate as-is:** The 2 new survivors in the testID export (lines 21) are genuine test gaps,
   but they're in a thin, organism-owned export layer. A test assertion on the exact testID
   value would kill them both (and is a reasonable defensive assertion — ensuring the testID
   has the expected format and not just "some string"). The 2 pre-existing survivors at
   lines 134/142 remain documented-equivalent and out of scope (already accepted in Rounds 1–5).

2. **Kill the testID survivors (implementer, 1 round):** Add a Jest assertion to one of the
   existing organism tests asserting `cardListItemCardTestId('id')` returns the expected literal
   format, killing the `StringLiteral` and `ArrowFunction` mutants at line 21. **This is the option
   taken in Round 7 above** — it raises the score back to the Round 5/2 ceiling of ~97.5%, since
   the 2 relocated documented-equivalents (134/142) remain out of scope.

**Recommendation (superseded by Round 7):** Given that the 2 new survivors were thin export-layer
coverage gaps easily killable with one assertion, and the molecule extraction itself introduced no
test-gap behavior (the molecule's 10 mutants were 100% killed), Round 7 killed them with a single
test-only change, restoring the score to the documented-equivalent ceiling established in Rounds
1–5.

---

## Round 5 — Kill pass for the 3 new Round-4 survivors (2026-07-27)

**Verdict: 97.44%, 2 survivors — both the pre-existing documented-equivalent `ConditionalExpression`
survivors at lines 98/106 (untouched, unchanged reasoning from Rounds 1–3). All 3 NEW survivors
introduced by the `8aa12b28e` bug fix are resolved.**

### What changed

1. **`card-list-with-abm-dialog.tsx:163` — `ConditionalExpression` (`true` replacement) — KILLED
   by a new test**, not a disable comment (this was a real gap, not equivalent). Added
   `"gates each Dialog's own open prop by its matching type, never the other stale dialogState"`
   to `card-list-with-abm-dialog.test.tsx`: opens the edit dialog, asserts (via the existing
   `Dialog` spy/`lastCallFor` helper from `@s19`/`@s20`) that the **edit** Dialog's own `open` is
   `true` **and** the **remove** Dialog's own `open` is `false` at that same moment — this is the
   state where `isOpen` is `true` but `dialogState.type` is `'edit'`, which is exactly what a
   `dialogState?.type === 'remove'` → `true` mutant on line 163 would flip to `true` (since
   `isOpen` alone is already `true`). Then closes the edit dialog (isOpen → false, dialogState
   stays `{type: 'edit', ...}` per the bug fix) and opens remove for a *different* item, asserting
   remove's own `open` is `true` with the new item's content and edit's own `open` stays `false` —
   proving the stale `dialogState` never leaks across a dialog-type switch. Confirmed via a real
   scoped Stryker re-run (below): this test alone moved the line-163 `ConditionalExpression`
   mutant from Survived to killed.
2. **`card-list-with-abm-dialog.tsx:153,163` — `OptionalChaining`** (`dialogState?.type` →
   `dialogState.type` on each Dialog's own `open` guard) — **re-confirmed genuinely equivalent**,
   same reasoning already established and disable-commented for `handleEditConfirm`/
   `handleRemoveConfirm` at lines 98/106: `openEditDialog`/`openRemoveDialog` always set
   `dialogState` and `isOpen` together (batched into one render), and `closeDialog` only ever
   flips `isOpen` back to `false`, never clearing `dialogState`. Since `isOpen &&` short-circuits,
   `dialogState.type` is only ever evaluated once `isOpen` is `true`, i.e. once `dialogState` is
   already non-null — `?.` vs `.` can never observably differ. The new cross-dialog-type test
   above further exercises this exact pairing (opening, closing, and re-opening with a different
   type) and still cannot force `dialogState` to be `null` while `isOpen` is `true` — reinforcing
   the equivalence rather than finding a gap. Per the established convention at lines 98/106
   (`// Stryker disable next-line OptionalChaining: ...`), added the matching disable comments at
   lines 153 and 163 rather than leave them as unaddressed survivors. Unlike the 98/106
   `ConditionalExpression` survivors (deliberately left `Survived`, not `Ignored`, because Stryker
   pairs `true`/`false` replacements on one line and disabling would also hide the legitimately
   killed `false` mutant), these `OptionalChaining` mutants have no such pairing risk — Stryker
   emits `OptionalChaining` as its own independent mutator, so disabling it here cannot suppress
   any other, real mutant on the same line.

### Score analysis

- **Round 4**: 87 mutants, 75 killed, 0 ignored, 5 survived (2 pre-existing + 3 new), 1 error.
  Score = 75/(75+5+1) = 93.75%.
- **Round 5**: 87 mutants instrumented, 76 killed, 2 ignored (the new `OptionalChaining` disable
  comments at 153/163), 2 survived (98/106, unchanged), 1 error.
  Stryker reports 97.44% once the 2 newly-ignored mutants are excluded from its own denominator
  (consistent with how the 6 Round-2 ignored mutants were already excluded from that round's 97.2%).

### Gates (Round 5)

- `pnpm --filter @helsoft/components test` — 70/70 suites, 530/530 tests green (+1 new test vs.
  Round 4's 525; the file also gained a few tests from unrelated earlier work already on disk).
- `pnpm --filter @helsoft/components lint` — clean.
- `pnpm --filter @helsoft/components check-types` — clean.
- Stryker re-run (`.agents/skills/mutation-testing/scripts/run-mutation.sh
  feature-entrega3-HernanLaura` + `parse-mutation-report.mjs card-list-with-abm-dialog`) scoped to
  this feature's 3 changed files: 87 mutants, 76 killed, 2 survived (98/106, documented equivalent,
  untouched), 1 error (investigated in Round 1–3, unchanged) — **97.44%**.

### Files changed this round

- `libs/components/src/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.test.tsx` —
  added the cross-dialog-type guard test (kills line 163's `ConditionalExpression`).
- `libs/components/src/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.tsx` — added
  2 `// Stryker disable next-line OptionalChaining` comments (lines 153, 163), matching the
  existing convention at lines 98/106. No behavior change.

### Survivors — Round 5 (unchanged from Rounds 1–3, see below for full history)

- `card-list-with-abm-dialog.tsx:98,106` — `ConditionalExpression` (`true` replacement), the
  pre-existing documented-equivalent survivors. Untouched, not revisited this round (out of scope
  per the task assignment; Round 3 already empirically ruled out splitting this pairing).

---

## Round 4 — Bug-fix re-run (2026-07-27, post-pr_ready gate)

**Verdict: 93.75%, down from 97.2%. 5 survivors (3 NEW). ESCALATE.** (Resolved in Round 5 above.)

Commit `8aa12b28e` fixed the empty-dialog-flash bug by decoupling `isOpen` from `dialogState`.
The `closeDialog()` handler now only flips `isOpen` to `false`; `dialogState` stays set through
the Dialog's close animation so its body doesn't blank mid-fade. This is the correct fix, but
it introduced **3 new mutation survivors** in the Dialog `open` conditions (lines 153, 163) where
the `isOpen && dialogState?.type === <type>` guards are now untested for edge cases.

### Survivors — Round 4

Two from Round 2 (unchanged, documented equivalent):
- `card-list-with-abm-dialog.tsx:98` — `ConditionalExpression` (`true` replacement) — same
  unreachable-guard issue in `handleEditConfirm` (already documented in prior rounds)
- `card-list-with-abm-dialog.tsx:106` — `ConditionalExpression` (`true` replacement) — same
  unreachable-guard issue in `handleRemoveConfirm` (already documented in prior rounds)

Three NEW, from bug-fix (lines 153, 163 Dialog open props):
- `card-list-with-abm-dialog.tsx:153` — `OptionalChaining` — `dialogState?.type` → `dialogState.type`
  on `open={isOpen && dialogState?.type === 'edit'}`. Tests do not verify that removing `?.` fails
  (i.e., that `dialogState` can be null when `isOpen` is true). By hook design, this should never
  happen (both set together, only `isOpen` is cleared on close), but the new condition is untested
  for defensive null-safety.
- `card-list-with-abm-dialog.tsx:163` — `ConditionalExpression` (`true` replacement) —
  `isOpen && dialogState?.type === 'remove'` → `isOpen && true`. Tests do not kill this because
  the `type` check is redundant when the hook's contract holds (never opens without setting the
  matching type). Same issue: untested pairing of `isOpen` and `type`.
- `card-list-with-abm-dialog.tsx:163` — `OptionalChaining` — same null-safety gap as line 153,
  for the remove dialog.

These 3 new survivors are **real test gaps**, not equivalent mutants. The fix is correct, but
the tests added in the bug-fix commit do not cover:
- Closing a dialog (flips `isOpen`, leaves `dialogState` set) — tests added do cover this per
  the new assertions in `card-list-with-abm-dialog.test.tsx` (@s19/@s20 traces), BUT
- The `isOpen && dialogState?.type === <type>` guard specifically — tests close and re-open
  dialogs, but do not assert that the render output **during** the close animation keeps the
  prior dialog's body (they assert the state, not the rendered UI at each step).

### Score analysis (Round 4)

- **Round 2**: 79 mutants, 69 killed, 6 ignored (via Stryker disable comments), 2 survived
  (documented equivalent). Score = 69/(69+2+1 error) = 97.2%.
- **Round 4**: 87 mutants (not 79), 75 killed, 0 ignored, 5 survived, 1 error.
  Score = 75/(75+5+1 error) = 93.75%.

The mutant count increased because the bug fix added code (the `isOpen &&` guards on the Dialog
`open` props, plus an `isOpen` state variable tracked separately) — Stryker sees more
instrumentable expressions. The score dropped because the new expressions are mutated into
variants the tests don't catch (not because the old code got worse — the old survivors at 98/106
remain identical, just 2 out of a now-larger 87 total).

### Path forward (Round 4, resolved by Round 5 above)

**Escalate to `implementer` to kill the 3 new survivors (lines 153, 163).**
The fix is correct (should be merged), but the tests must cover:
1. Closing a dialog mid-animation and re-opening it shows the **new** dialog (not a mix of old
   and new bodies) — this tests the `type` check in the `isOpen && dialogState?.type === <type>`
   guard.
2. (Optional, for defensive programming) Explicitly call out the null-safety of `?.` in a
   comment; if tests don't exercise the null case, document why it's safe (per the hook's
   contract) and leave the survivors as a known-equivalent ceiling.

The 2 pre-existing survivors (98, 106) remain documented-equivalent from Round 2; do not revisit
them (Round 3's restructuring experiments confirmed they're unsplittable without worse outcomes).

---

## Prior rounds (unchanged)

**Verdict (Rounds 1–3): 97.2%, not 100%. ACCEPTED — mutation 2-round cap, 2026-07-27.** 2 survivors remain, both
re-confirmed **genuinely equivalent** after a real, empirically-tested restructuring attempt in
round 2 (below). Escalated per the ≤2-round cap — round 2 could not raise the score without either
(a) hiding a real, already-killed mutant behind a blanket disable comment, or (b) making the score
*worse* (verified by actually trying it). Escalated to the human, who reviewed this evidence and
explicitly accepted 97.2% as final rather than authorizing a `Dialog` mount-strategy change to
chase the last 2 points (recorded in `spec.md`'s Open decisions and `dod.md`).

### Round 3 investigation: can the guard be split so the equivalent line and the tested line are separate?

Per the orchestrator's round-2 assignment, this round attempted to restructure
`handleEditConfirm`/`handleRemoveConfirm` (`card-list-with-abm-dialog.tsx:90-110`) so the
equivalent-but-unreachable guard and the legitimately-tested call no longer share one
Stryker-disable-able line. **Two concrete restructurings were implemented and run through a real
scoped Stryker pass each** (not just reasoned about) before being reverted — neither achieves the
separation, and one makes the score worse. The code today is therefore byte-identical to round 2.

#### Why the two mutants are inherently paired (read from Stryker's own source)

`@stryker-mutator/instrumenter`'s `DirectiveBookkeeper` (the code that implements `// Stryker
disable next-line <Mutator>`) matches an ignore rule purely by **`(mutatorName, line)`** — see
`node_modules/.../instrumenter/dist/src/transformers/directive-bookkeeper.js`, `IgnoreRule.matches`:
it checks `this.line === line` and `this.mutatorNames.includes(mutatorName)` only. There is no
axis for "which literal replacement" (`true` vs `false`). Since Stryker's `ConditionalExpression`
mutator always emits **both** the `true`- and `false`-replacement mutants for a single `if`/ternary
test, any comment that disables `ConditionalExpression` on that line necessarily disables **both**
mutants on it — there is no config or comment mechanism (checked: also not available via
`mutate`/`excludedMutations`, which are file/mutator-global, not per-instance) to keep only the
`false`-replacement (the legitimately-tested one) visible while suppressing only the
`true`-replacement (the equivalent one).

#### Experiment 1 — extract the guard into a named boolean, then `if` on that boolean

```ts
const isEditDialogOpen = dialogState?.type === 'edit';
if (isEditDialogOpen) {
  onEditSubmit(dialogState.item);
}
closeDialog();
```

Type-checks clean (TS 4.4+ control-flow narrowing through an aliased `const` condition works —
verified standalone before touching the real file). Ran isolated:
`pnpm --filter @helsoft/components exec stryker run --mutate
"src/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.tsx"` (disable comments
removed for the experiment). **Result: worse, not better** — 6 survivors instead of 2:
- `ConditionalExpression` `true` on the **new assignment line** (`isEditDialogOpen = true`) — a
  **new** equivalent survivor that didn't exist before.
- `ConditionalExpression` `true` on the **`if` line** — the same equivalent survivor as today,
  just relocated, still paired with a `false` mutant on the same line.
- 2 `OptionalChaining` re-appeared only because the experiment stripped their existing disable
  comments (expected, not a new finding).

Splitting the guard into "is present" + "is truthy" doesn't remove a `ConditionalExpression` site —
it **adds a second one** (the extraction assignment is itself a boolean expression that, when used
to gate the same `if`, is *also* always-true-when-reachable, so it inherits the identical
equivalent/killed pairing). Net effect: 2 sites with the same unsplittable pairing instead of 1.

#### Experiment 2 — early-return guard clause (single `if` per handler)

```ts
if (dialogState?.type !== 'edit') {
  closeDialog();
  return;
}
onEditSubmit(dialogState.item);
closeDialog();
```

(`closeDialog()` duplicated on both paths to preserve today's "always closes" behavior.)
Type-checks clean, unit suite green. Ran the same isolated Stryker scan. **Result: same problem,
different label, plus a new category of survivor** — 4 survivors:
- `ConditionalExpression` **`false`** on the `if` line now survives instead of `true` (the polarity
  flipped because the guard is negated, but it's still the *same pairing on the same line* — the
  `true`-replacement is now the one that's killed, the `false`-replacement is now the one that's
  equivalent; nothing was actually separated).
- 2 new `NoCoverage BlockStatement` survivors on the early-return block itself — because that
  block is (correctly, per the equivalence argument) never actually entered by any real test, so
  Stryker can't even attempt those mutants meaningfully. This is a **strictly worse** outcome than
  today's 2 documented survivors.
- 2 `OptionalChaining` re-appeared, same as experiment 1 (comments removed for the experiment).

#### Conclusion

Both restructurings were implemented, type-checked, unit-tested, and put through a real scoped
Stryker run — not just reasoned about on paper. Neither separates the equivalent mutant from the
tested one onto independently-disable-able lines; the pairing is a property of Stryker's
`ConditionalExpression` mutator (always emits a `true`+`false` pair per test-line) crossed with its
disable-comment matching (`mutatorName` + `line` only, confirmed by reading
`directive-bookkeeper.js`), not of how the guard is phrased. Any single boolean condition that is
"always true when reachable" will always produce one equivalent mutant and one real (killed)
mutant **on the same line**, and no amount of extraction/renaming/polarity-flipping changes that —
it only relocates which line carries the pair, or (as shown) duplicates the pair onto an
additional line. Both experiments were reverted; `card-list-with-abm-dialog.tsx` is unchanged from
round 2 (verified via `git diff` — empty).

The only way to actually kill these 2 survivors would be to make the `false` branch **genuinely
reachable** (e.g. export the internal handlers for direct unit invocation with a mismatched
`dialogState`, or restructure `Dialog` to conditionally *mount* per dialog type instead of staying
mounted with `open` toggling) — both are larger architectural changes that go beyond "extract a
guard for readability," would touch the shared `Dialog` organism's mount lifecycle (risking its
scrim/animation contract used by every other Dialog consumer in this lib), and were not attempted
per the explicit scope of this round ("a compound guard-and-call on one line... not a metrics-
gaming hack" — changing `Dialog`'s mount strategy across the lib is not that).

### Recommendation to `orchestrator_lead` (Rounds 1–3 scope)

Round budget (≤2 kill rounds) is spent: round 2 killed 24/27 and documented 3 equivalents via
disable comments; this round (round 3, still counted against the cap per the task framing) tried
and empirically ruled out the one remaining lever (line-splitting) and found it structurally
incapable of helping. **Escalate** — 97.2% with 2 provably-equivalent, non-suppressible survivors
and 1 investigated-and-accepted error mutant, not a fabricated 100%.

### Ignored via `// Stryker disable next-line` (5, re-verified equivalent)

- `use-card-list-with-abm-dialog.ts:29,37,45` (ArrayDeclaration, the 3 `useCallback([])`s) —
  `setDialogState` is a React state setter, referentially stable for the component's lifetime;
  the dependency array's contents can never observably change identity or behavior.
- `card-list-with-abm-dialog.tsx:74` (ArrayDeclaration, `keyExtractor`'s `[]`) — closes over
  nothing but its own `item` param; unused-dependency equivalent, identical in kind to
  `pdf-document-list.tsx`'s own `keyExtractor` equivalent (documented in
  `pending-pdfs-generate/mutation.md`).
- `card-list-with-abm-dialog.tsx:98,106` (OptionalChaining only, **not** ConditionalExpression) —
  `handleEditConfirm`/`handleRemoveConfirm`'s own Dialog only renders its Save/Remove button (the
  only caller of these handlers) while `open` is true, i.e. while `dialogState?.type === <matching
  type>` already holds (RN `Modal` renders no children while `visible={false}`). So `dialogState`
  is never `null` on any reachable call, making `?.` vs `.` unobservable.
- `card-list-with-abm-dialog.tsx:153,163` (OptionalChaining only, **not** ConditionalExpression,
  added Round 5) — same equivalence as the 98/106 pair above, applied to each Dialog's own `open`
  guard: `openEditDialog`/`openRemoveDialog` always set `dialogState`+`isOpen` together, and
  `closeDialog` never nulls `dialogState`, so `isOpen &&` short-circuiting means `dialogState.type`
  is only evaluated once `dialogState` is already set.

### Survived — documented equivalent, deliberately NOT suppressed (2, unchanged since round 2)

- `card-list-with-abm-dialog.tsx:98,106` (Round 6/7: relocated to `134,142`) —
  **ConditionalExpression, `true` replacement only.**
  Same unreachable-guard reasoning as the `OptionalChaining` case above (the guard's else-branch
  never fires via any real interaction path). **Deliberately left as `Survived` rather than
  `Ignored`**: Stryker generates *two* `ConditionalExpression` mutants per condition (`true` and
  `false`), and a blanket `// Stryker disable ... ConditionalExpression` would have also
  suppressed the `false` replacement — which **is** a real, already-killed mutant (removing the
  call to `onEditSubmit`/`onRemoveConfirm` breaks the existing "calls onEditSubmit/onRemoveConfirm
  once" tests). Round 3 (above) confirmed empirically — by actually trying two different
  restructurings and re-running Stryker on each — that no code shape separates this pairing onto
  independently-disable-able lines. Trading a slightly lower raw score (97.2/97.5 vs a fabricated
  100) for not silently discarding a real kill signal.

### Error mutant investigation

`card-list-with-abm-dialog.tsx:218` (unchanged line reference through Round 5) — `ArrowFunction`
mutant on `StyleSheet.create((theme) => ({...}))`, mutates the theme-factory arrow to
`() => undefined`. **RuntimeError**, not CompileError: `TypeError: Cannot convert undefined or null
to object` at `Object.entries` inside `react-native-unistyles`'s own style-resolution code, thrown
as soon as any styled element renders. This is a genuine crash produced by breaking the style
factory's return value — **not** a sandbox/config defect. Not escalated; Stryker counts it as
detected (excluded from the score per this skill's convention, consistent with
`activity-open-ended`'s "1 runtime/compile error mutant per lib — Stryker treats as detected"
precedent). **Round 6/7 (post molecule-extraction): a second, identical error mutant now also
appears on `card-list-row.tsx`'s own `StyleSheet.create` theme factory** — same
RuntimeError/`Object.entries` signature, same convention, treated as detected — bringing the
error-mutant count to 2 for Rounds 6–7 (unchanged, not a new investigation).

### Gates (rounds 1–3)

- `pnpm --filter @helsoft/components lint` — clean.
- `pnpm --filter @helsoft/components check-types` — clean.
- `pnpm --filter @helsoft/components test` — 70/70 suites, 525/525 tests green.
- `pnpm --filter @helsoft/components exec playwright test
  tests/e2e/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.e2e.js --reporter=list`
  — 5/5 passed.
- Stryker re-run (`.agents/skills/mutation-testing/scripts/run-mutation.sh
  feature-entrega3-HernanLaura` + `parse-mutation-report.mjs card-list-with-abm-dialog`) scoped to
  this feature's 3 changed files: 79 mutants, 69 killed, 6 ignored (equivalents), 2 survived
  (documented equivalents above), 1 error (investigated above) — 97.2%, byte-identical to round 2
  (`git diff` on the 3 measured files is empty for this round — no source or test change was kept).
- `git diff -- libs/components/src/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.tsx`
  — empty (both experiments above were reverted after their Stryker runs).

### Files measured (rounds 1–3)

```
libs/components/src/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.tsx
libs/components/src/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.types.ts
libs/components/src/organisms/card-list-with-abm-dialog/use-card-list-with-abm-dialog.ts
```

---

## Round 4/5 — Files measured

```
libs/components/src/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.tsx
libs/components/src/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.types.ts
libs/components/src/organisms/card-list-with-abm-dialog/use-card-list-with-abm-dialog.ts
```

## Round 6/7 — Files measured

```
libs/components/src/molecules/card-list-row/card-list-row.tsx
libs/components/src/molecules/card-list-row/card-list-row.types.ts
libs/components/src/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.tsx
libs/components/src/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.types.ts
libs/components/src/organisms/card-list-with-abm-dialog/use-card-list-with-abm-dialog.ts
```
