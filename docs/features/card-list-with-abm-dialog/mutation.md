# Mutation — card-list-with-abm-dialog

**Verdict: 97.2%, not 100%. ACCEPTED — mutation 2-round cap, 2026-07-27.** 2 survivors remain, both
re-confirmed **genuinely equivalent** after a real, empirically-tested restructuring attempt in
round 2 (below). Escalated per the ≤2-round cap — round 2 could not raise the score without either
(a) hiding a real, already-killed mutant behind a blanket disable comment, or (b) making the score
*worse* (verified by actually trying it). Escalated to the human, who reviewed this evidence and
explicitly accepted 97.2% as final rather than authorizing a `Dialog` mount-strategy change to
chase the last 2 points (recorded in `spec.md`'s Open decisions and `dod.md`).

## Round 1 → Round 2 → Round 3 (this pass)

| Round | total | killed | ignored | survived | errors | score % |
|---|--:|--:|--:|--:|--:|--:|
| 1 (initial) | 79 | 51 | 0 | 27 | 1 ⚠ | 65.4 |
| 2 (kill pass) | 79 | 69 | 6 | 2 | 1 ⚠ | 97.2 |
| 3 (this pass — restructure investigation, no net code change) | 79 | 69 | 6 | 2 | 1 ⚠ | 97.2 |

Score = killed / (killed + survived + errors); `ignored` (Stryker-disable-commented equivalents)
are excluded from the denominator, matching this repo's existing convention.

Per-file (this pass, re-confirmed identical to round 2):

| File | total | killed | ignored | survived | score % |
|---|--:|--:|--:|--:|--:|
| `card-list-with-abm-dialog.tsx` | 63 | 60 | 2 (+1 error) | 2 | 96.83 |
| `use-card-list-with-abm-dialog.ts` | 12 | 9 | 3 | 0 | 100.00 |

(Round 2's 24-killed / 3-ignored-via-comment history is unchanged from the prior pass — see
`git log -p` on this file for that narrative. This round only adds the restructuring
investigation below; no test or source file changed as a result.)

## Round 3 investigation: can the guard be split so the equivalent line and the tested line are separate?

Per the orchestrator's round-2 assignment, this round attempted to restructure
`handleEditConfirm`/`handleRemoveConfirm` (`card-list-with-abm-dialog.tsx:90-110`) so the
equivalent-but-unreachable guard and the legitimately-tested call no longer share one
Stryker-disable-able line. **Two concrete restructurings were implemented and run through a real
scoped Stryker pass each** (not just reasoned about) before being reverted — neither achieves the
separation, and one makes the score worse. The code today is therefore byte-identical to round 2.

### Why the two mutants are inherently paired (read from Stryker's own source)

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

### Experiment 1 — extract the guard into a named boolean, then `if` on that boolean

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

### Experiment 2 — early-return guard clause (single `if` per handler)

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

### Conclusion

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

### Recommendation to `orchestrator_lead`

Round budget (≤2 kill rounds) is spent: round 2 killed 24/27 and documented 3 equivalents via
disable comments; this round (round 3, still counted against the cap per the task framing) tried
and empirically ruled out the one remaining lever (line-splitting) and found it structurally
incapable of helping. **Escalate** — 97.2% with 2 provably-equivalent, non-suppressible survivors
and 1 investigated-and-accepted error mutant, not a fabricated 100%.

## Ignored via `// Stryker disable next-line` (3, all re-verified equivalent, unchanged since round 2)

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

## Survived — documented equivalent, deliberately NOT suppressed (2, unchanged since round 2)

- `card-list-with-abm-dialog.tsx:98,106` — **ConditionalExpression, `true` replacement only.**
  Same unreachable-guard reasoning as the `OptionalChaining` case above (the guard's else-branch
  never fires via any real interaction path). **Deliberately left as `Survived` rather than
  `Ignored`**: Stryker generates *two* `ConditionalExpression` mutants per condition (`true` and
  `false`), and a blanket `// Stryker disable ... ConditionalExpression` would have also
  suppressed the `false` replacement — which **is** a real, already-killed mutant (removing the
  call to `onEditSubmit`/`onRemoveConfirm` breaks the existing "calls onEditSubmit/onRemoveConfirm
  once" tests). Round 3 (above) confirmed empirically — by actually trying two different
  restructurings and re-running Stryker on each — that no code shape separates this pairing onto
  independently-disable-able lines. Trading a slightly lower raw score (97.2 vs a fabricated 100)
  for not silently discarding a real kill signal.

## Error mutant investigation (1, unchanged across rounds)

`card-list-with-abm-dialog.tsx:218` — `ArrowFunction` mutant on `StyleSheet.create((theme) =>
({...}))`, mutates the theme-factory arrow to `() => undefined`. **RuntimeError**, not
CompileError: `TypeError: Cannot convert undefined or null to object` at `Object.entries`
inside `react-native-unistyles`'s own style-resolution code, thrown as soon as any styled
element renders. This is a genuine crash produced by breaking the style factory's return value
— **not** a sandbox/config defect. Not escalated; Stryker counts it as detected (excluded from the
score per this skill's convention, consistent with `activity-open-ended`'s "1 runtime/compile
error mutant per lib — Stryker treats as detected" precedent).

## Gates (round 3 — this pass)

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

## Files measured

```
libs/components/src/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.tsx
libs/components/src/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.types.ts
libs/components/src/organisms/card-list-with-abm-dialog/use-card-list-with-abm-dialog.ts
```
