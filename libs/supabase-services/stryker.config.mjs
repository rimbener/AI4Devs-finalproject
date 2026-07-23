// @ts-check
/**
 * StrykerJS — @helsoft/supabase-services (ts-jest).
 * The mutation_tester narrows scope to the feature's changed files at runtime:
 *   pnpm --filter @helsoft/supabase-services exec stryker run --mutate "src/services/foo.service.ts,src/dao/foo.dao.ts"
 * @type {import('@stryker-mutator/api/core').PartialStrykerOptions}
 */
export default {
  packageManager: 'pnpm',
  testRunner: 'jest',
  // pnpm's isolated layout stops Stryker's default `@stryker-mutator/*` glob from
  // resolving in the checker/runner child processes, so they are named explicitly.
  plugins: ['@stryker-mutator/jest-runner', '@stryker-mutator/typescript-checker'],
  jest: { projectType: 'custom', configFile: 'jest.config.js' },
  checkers: ['typescript'],
  tsconfigFile: 'tsconfig.json',
  reporters: ['clear-text', 'json', 'html'], // no 'progress' — non-TTY/agent/CI safe; 'json' feeds parse-mutation-report.mjs
  // Edge-relative imports don't resolve in Stryker's sandbox copy, so mutate in place.
  // Baked here so agents never hand-roll `stryker --inPlace` (regression from the
  // entitlements run). See .agents/skills/mutation-testing/SKILL.md §Tooling notes.
  inPlace: true,
  coverageAnalysis: 'perTest',
  // Default scope (overridden per-feature via --mutate). Never mutate tests or barrels.
  mutate: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/index.ts',
    '!src/**/test-utils/**',
    '!src/**/testing/**',
  ],
  // Feature policy: 100% of mutants on changed lines must be killed.
  thresholds: { high: 100, low: 100, break: 100 },
};
