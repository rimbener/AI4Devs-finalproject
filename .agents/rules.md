Superseded. Canonical rules:

- /.agents/rules/global.mdc — monorepo spec (folders, libs, naming, tooling, Supabase); every component in a Storybook lib ships a `.stories.tsx`
- /.agents/rules/hooks-service-dao.mdc — hook/service/dao architecture (data-fetching hooks use tanstack-query)
- /.agents/rules/tanstack-query.mdc — `useQuery`/`useMutation` in `@helsoft/hooks`: one `QueryClient` via `QueryProvider`, expose mutation primitives directly, normalize errors, `QueryClientProvider` + `waitFor` in tests
- /.agents/rules/atomic-design.mdc — component structure methodology
- /.agents/rules/component-split.mdc — UI co-location split for non-trivial components
- /.agents/rules/types.mdc — `*.types.ts` only for types another file imports (single-file → inline); no result/return types, prefer inference
- /.agents/rules/i18n.mdc — user-facing text via `t('ns.key')` inline; no `labels` object (key dictionaries excepted)
- /.agents/rules/state.mdc — ≥3 related local states that change together → `useReducer` (not Redux)
- /.agents/rules/state-sharing.mdc — React Context when prop-drilling is deep or a large props bag is threaded through intermediates
- /.agents/rules/tdd.mdc — Three Laws of TDD, Red→Green→Refactor
- /.agents/rules/pre-slice-checklist.mdc — recurring pre-slice self-check (barrels, helpers, a11y, atom ban, Modal, e2e, layout, i18n, test cmd)
- /.agents/rules/e2e.mdc — Playwright e2e are interaction-only; never render-only presence tests (unit tests cover those)
- /.agents/DESIGN.md — brand/design system (colors, type, voice, MD3 foundations, token↔repo mapping); not a `.mdc` rule file but canonical for anything UI/copy

Do not add rules here.
