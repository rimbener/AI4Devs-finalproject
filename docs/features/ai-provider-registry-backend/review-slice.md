---
feature: ai-provider-registry-backend
---

# Slice review — ai-provider-registry-backend

Durable trail across slices/rounds. Findings are `open` until the cited implementer fix lands; never emptied.

## Slice 1 — round 1 (commit `28258cfe9`)

**Scope reviewed**: task-1..task-6 diff (`git diff 273b7e2d1 28258cfe9`) — two migrations
(`20260726185408_ai_provider_registry.sql`, `20260726185414_user_ai_keys_provider_fk.sql`),
`supabase/functions/_shared/provider-catalog.ts` (new), `generate-lesson/_shared/models.ts`,
`lesson-generation.validation.ts`, `lesson-generation.vision-model.ts`, `lesson-generation.route.ts`,
`lesson-generation.provider-factory.ts`, `types.ts`, `index.ts`, plus the corresponding Jest tests
in `libs/supabase-services/src/services/`.

**Verdict: CHANGES_REQUESTED** — all 3 findings RESOLVED by `implementer` in a follow-up commit
(no re-review round remains per protocol; see each finding's fix note below).

### Findings

1. **`[types]` RESOLVED — Major.** Fix: extracted `ProviderEntry`/`ProviderModel` into
   `supabase/functions/_shared/provider-catalog.types.ts` (import-free); `provider-catalog.ts` now
   imports the type from there instead of defining/exporting it, and no longer exports the private
   `CatalogQueryClient` structural type either (single-file use only, not a public contract). All
   six consumers (`lesson-generation.validation.ts`, `lesson-generation.vision-model.ts`,
   `lesson-generation.route.ts`, `index.ts`, `lesson-generation.validation.test.ts`,
   `lesson-generation.vision-model.test.ts`) re-pointed to import `ProviderEntry` from
   `provider-catalog.types.ts`. Re-ran `pnpm --filter @helsoft/supabase-services test`
   (34/34 suites, 281/281 tests), `check-types`, repo-wide `pnpm check-types`/`pnpm lint` — all
   green. Original finding, unchanged below:

   `supabase/functions/_shared/provider-catalog.ts:9-24` defines
   `ProviderEntry`/`ProviderModel` and exports them directly from the implementation file, but they
   are consumed across ≥6 other files: `lesson-generation.validation.ts:5`,
   `lesson-generation.vision-model.ts:5`, `lesson-generation.route.ts:1`, `index.ts:23`, and the
   `ProviderEntry`-importing tests `lesson-generation.validation.test.ts:1`,
   `lesson-generation.vision-model.test.ts:1`. Per `.agents/rules/types.mdc`: "If the type is used
   in multiple files, it should be stored in a `*.types.ts` file, and not exported from the
   component, class, service, hook, etc." This exact convention is already established in the very
   same directory (`generate-lesson/_shared/lesson-generation.types.ts`, whose own header even notes
   it exists because of "review.md round-1 finding #2's file split") — so this isn't a new pattern,
   it's an existing one this slice should have followed. Fix: extract `ProviderEntry`/`ProviderModel`
   into a co-located `supabase/functions/_shared/provider-catalog.types.ts` (import-free, matching
   task-3's own "pure half" framing), re-point `provider-catalog.ts` and all consumers to import the
   types from there, and stop exporting them from `provider-catalog.ts` itself.

2. **`[code-quality]` RESOLVED — Minor/dead-code (YAGNI).** Fix: deleted `AiModelEntry` and
   `AiProviderModels` from `models.ts` outright (no future task-7..12 consumer named or found);
   rewrote the file header to point at `provider-catalog.types.ts`'s `ProviderModel`/`ProviderEntry`
   as the live replacement instead of the vague "older seams" wording. Also corrected task-4.md's
   Done-criteria bullet that had asserted these types must remain exported. Confirmed via grep: no
   remaining reference to either type anywhere under `supabase/` or `libs/supabase-services`
   (`libs/types/src/ai-provider.ts`'s own same-named types are untouched, unrelated, D15 scope).
   Re-ran the same green suite as finding 1. Original finding, unchanged below:

   `supabase/functions/generate-lesson/_shared/models.ts:11-18` — `AiModelEntry`/`AiProviderModels`
   are still exported (per task-4.md's Done criteria, "kept for type-shape compatibility with older
   seams") but after `AI_MODEL_REGISTRY`'s deletion in this same slice, nothing in the reachable
   import graph uses them: `index.ts`, `lesson-generation.provider-factory.ts` and
   `lesson-generation.route.ts` only import `AiProvider`/`PLATFORM_TEXT_MODEL_ID` from this file, and
   no later task (task-7 through task-12) ever touches `models.ts` again. They are permanently dead
   after this slice. Fix: delete both types (and update the file header, which still references a
   now-nonexistent "older seam"), or — if there's a real planned consumer not reflected in the task
   docs — name it explicitly in the comment instead of the vague "older seams."

3. **`[code-quality]` RESOLVED — Minor, comment accuracy.** Fix: added an explicit
   `on delete restrict` clause to the `user_ai_keys_provider_fkey` FK (rather than relying on the
   unstated `NO ACTION` default) and reworded the header comment to name `NO ACTION` as the actual
   default and explain why it's behaviourally identical here (constraint isn't deferrable). Also
   corrected the equivalent claim in task-2.md's Done criteria. No live DB in this sandbox to
   re-apply the migration against; verified by SQL review only (same limitation noted in `tdd.md`).
   Original finding, unchanged below:

   `supabase/migrations/20260726185414_user_ai_keys_provider_fk.sql:8-9` (header) states
   "`ON DELETE RESTRICT` (the default)" for the new `user_ai_keys_provider_fkey`, but the DDL itself
   never writes `on delete restrict` and Postgres's actual default when no `ON DELETE` clause is
   given is `NO ACTION`, not `RESTRICT` (they differ for deferrable constraints only, which this one
   isn't, so the *behaviour* described — blocking the delete — is correct, only the name is wrong).
   Fix: either add an explicit `on delete restrict` to the `alter table` so the comment is literally
   true, or correct the comment to `NO ACTION (the default, behaviourally identical to RESTRICT here
   since the constraint isn't deferrable)`.

### Checks that passed (no findings)

- **`[hooks-service-dao]`** — N/A/pass: this is Supabase Edge Function server code
  (`supabase/functions/`), not `libs/*`; it correctly keeps the pure decision modules
  (`lesson-generation.validation.ts`, `lesson-generation.vision-model.ts`) free of any Supabase
  client import, with only `index.ts` touching `adminClient` (matching the pre-existing `plans`
  read precedent) and `provider-catalog.ts`'s `loadProviderCatalog` taking a structurally-typed
  client rather than importing `supabase-js`. No hook/service/DAO boundary is crossed by this slice.
- **`[global]`** — kebab-case filenames throughout; migrations in `supabase/migrations/`, shared Edge
  module in `supabase/functions/_shared/` (matching the `cors.ts` precedent); Deno (`.ts` with
  `npm:`/`.ts` extension imports) vs. Jest (`libs/supabase-services/src/services/*.test.ts` reaching
  into `supabase/functions/` by relative import) boundary respected, matching the established
  `lesson-generation.validation.test.ts` precedent cited in task-3's own notes. `libs/types/src/ai-provider.ts`
  confirmed untouched (`git diff` empty) — D15 respected.
- **`[tdd]`** — genuine Red→Green→Refactor evidence for all non-UI `.ts` work (task-3/4/5/6) in
  `tdd.md`, one `@s` at a time, tests rewritten against injected `ProviderEntry` fixtures rather than
  retrofitted; migrations (task-1/2) have no Jest harness in this repo (documented risk R1) and are
  explicitly deferred to task-12's SQL verification script — a pre-agreed, spec-level exemption, not
  an implementer shortcut. `tdd.md` is 5997 bytes, under the 8000-byte budget.
- **Migration correctness** — `ai_providers`/`ai_provider_models` RLS + grants match the `plans`
  precedent (`20260716170000_create_profiles.sql`) policy-name/revoke/grant shape exactly; two-file
  ordering (`...185408` before `...185414`) satisfies D3; reversibility-note headers present on both
  migrations; the `groq`-disables-platform-generation blast-radius warning (D14) is present in
  task-1's migration header as required.
- **`AiProvider` widening** — widened to `string` in both `models.ts` and `_shared/types.ts` per D6;
  `providerCreators: Record<AiProvider, ...>` in `lesson-generation.provider-factory.ts` correctly
  keeps a comment documenting the accepted D7/R4 risk (possible `undefined` factory lookup) rather
  than silently absorbing it.
- **`[atomic-design]` / `[component-split]` / `[state]` / `[state-sharing]` / `[tanstack-query]` /
  `[i18n]` / `[e2e]`** — N/A, justified: this slice touches no `.tsx`, no React component/hook, and
  no `libs/hooks`/`libs/components` code; `ai_providers.name`/`ai_provider_models.label` are seeded
  display strings in Postgres, not `t()`-rendered UI copy (task-1 notes verify all locales already
  hold byte-identical values), and no UI-facing rendering is in this story's scope (frontend story
  owns it, per spec.md's Out-of-scope list).
- **Accessibility (WCAG 2.2 AA)** — **N/A**: no UI added or touched by this slice (spec.md: "UI
  states: None — no UI in scope"; confirmed by diff — no `.tsx` file present).

