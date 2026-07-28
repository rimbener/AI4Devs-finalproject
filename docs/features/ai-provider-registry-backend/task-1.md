---
id: task-1
title: Create the ai_providers + ai_provider_models tables with RLS, grants and seed
slice: 1
scenarios: [s1, s2, s3, s4, s5, s6, s7]
status: done
paths: [supabase/migrations/<ts1>_ai_provider_registry.sql]
---

## Goal
One migration that creates the two catalog tables with all their constraints, enables RLS with a
read-only `authenticated` policy, sets grants, and seeds today's six providers and thirteen models
so the feature is a behavioural no-op the moment it ships.

## Done criteria
- [ ] Scenarios s1–s7 covered (see Notes — verification is SQL, not Jest)
- [ ] `ai_providers`: `id text primary key`, `name text not null`, `guidance_url text`,
      `enabled boolean not null default true`, `sort_order integer not null`
- [ ] `ai_provider_models`: `provider_id text not null references public.ai_providers (id) on delete cascade`,
      `model_id text not null`, `label text not null`, `vision boolean not null default false`,
      `is_vision_default boolean not null default false`, `sort_order integer not null`,
      `primary key (provider_id, model_id)`
- [ ] `check (not is_vision_default or vision)` — vision default implies vision-capable (s3)
- [ ] `create unique index … on public.ai_provider_models (provider_id) where is_vision_default` (s2)
- [ ] RLS enabled on both tables; one `for select to authenticated using (true)` policy each;
      **no** insert/update/delete policy for `anon` or `authenticated` (s6, s7)
- [ ] `revoke all … from anon, authenticated` + `grant select … to authenticated` +
      `grant all … to service_role` on both tables
- [ ] Seed rows exactly as tabulated in `gherkin-scenarios.md` `@s5`, with `sort_order` 1–6 for
      providers and 1–n within each provider for models
- [ ] Reversibility-note header comment (down migrations are not CLI-generated in this repo)
- [ ] `pnpm lint` + `pnpm check-types` green

## Notes
- **Mirror `supabase/migrations/20260716170000_create_profiles.sql`** — its `plans` table is the
  exact precedent for a seeded `id text primary key` reference table with `select to authenticated`
  RLS plus the revoke/grant trio. Copy that shape rather than inventing one.
- `name` and `label` are **literal display strings, not i18n keys.** Verified safe: `en/es/pt/de`
  already hold byte-identical values for every provider and model name, so the seed changes nothing
  in any locale.
- `sort_order` exists because `select` has no inherent order and today's canonical order
  (`groq, openai, anthropic, google, xai, deepseek`) is load-bearing in the pickers (decision D1).
- Create this migration with `npx supabase migration new ai_provider_registry` so the timestamp is
  real, and confirm its timestamp sorts **before** task-2's.
- **No SQL test harness exists in this repo** (risks.md R1). s1–s7 are proven by applying the
  migration and running the SQL verification script authored in task-12 — not by Jest.
- Header comment must warn that disabling `groq` also disables platform generation (see task-7/D14).
