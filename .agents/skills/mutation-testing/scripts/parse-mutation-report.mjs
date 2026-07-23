#!/usr/bin/env node
// Parse StrykerJS JSON reports (libs/<lib>/reports/mutation/mutation.json) and
// stub docs/features/<name>/mutation.md with a machine-derived table.
//
// Usage: node parse-mutation-report.mjs <feature-name>
//
// Replaces every ad-hoc `python`/`node -e`/`rg` scrape of mutation.html. It is
// purely mechanical: aggregates per-lib totals, computes the mutation score the
// same way Stryker does (score = detected / valid, errors & ignored excluded),
// and lists every surviving mutant as `file:line  mutator`. It does NOT decide
// PASS/FAIL and never rewrites survivors as killed — that's the escalate-only
// gate in mutation_tester.md. A high error count is surfaced as a ⚠, not hidden.

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const name = process.argv[2];
if (!name) { console.error('usage: parse-mutation-report.mjs <feature-name>'); process.exit(1); }

const root = execSync('git rev-parse --show-toplevel').toString().trim();
const libsDir = join(root, 'libs');

const DETECTED = new Set(['Killed', 'Timeout']);
const UNDETECTED = new Set(['Survived', 'NoCoverage']);
const ERRORED = new Set(['CompileError', 'RuntimeError']);

const rows = [];
const survivors = [];
let grandErrors = 0;

for (const lib of readdirSync(libsDir, { withFileTypes: true }).filter((d) => d.isDirectory())) {
  const jsonPath = join(libsDir, lib.name, 'reports', 'mutation', 'mutation.json');
  if (!existsSync(jsonPath)) continue;
  let report;
  try { report = JSON.parse(readFileSync(jsonPath, 'utf8')); } catch { continue; }
  const files = report.files || {};
  let detected = 0, undetected = 0, errors = 0, ignored = 0, total = 0;
  for (const [file, entry] of Object.entries(files)) {
    for (const m of entry.mutants || []) {
      total++;
      if (DETECTED.has(m.status)) detected++;
      else if (UNDETECTED.has(m.status)) { undetected++; survivors.push({ lib: lib.name, file, m }); }
      else if (ERRORED.has(m.status)) errors++;
      else ignored++; // Ignored
    }
  }
  const valid = detected + undetected;
  const score = valid === 0 ? 'n/a' : ((detected / valid) * 100).toFixed(1);
  grandErrors += errors;
  rows.push({ lib: `@helsoft/${lib.name}`, total, killed: detected, survived: undetected, errors, ignored, score });
}

if (rows.length === 0) {
  console.error('parse-mutation-report: no reports/mutation/mutation.json found under libs/* — run run-mutation.sh first.');
  process.exit(1);
}

const featureDir = join(root, 'docs', 'features', name);
mkdirSync(featureDir, { recursive: true });
const out = join(featureDir, 'mutation.md');

const totalSurvived = rows.reduce((n, r) => n + r.survived, 0);
const gateHint = totalSurvived === 0 && grandErrors === 0
  ? 'threshold met on scope'
  : `${totalSurvived} survivor(s)${grandErrors ? `, ${grandErrors} error mutant(s) ⚠` : ''} — kill or ESCALATE (never rewrite as PASS)`;

let md = `# Mutation — ${name}\n\n`;
md += `_Auto-stubbed by \`parse-mutation-report.mjs\` from the per-lib Stryker JSON reports. ${gateHint}._\n\n`;
md += `| lib | total | killed | survived | errors | score % |\n|---|--:|--:|--:|--:|--:|\n`;
for (const r of rows) {
  const flag = r.errors > 0 ? ' ⚠' : '';
  md += `| ${r.lib} | ${r.total} | ${r.killed} | ${r.survived} | ${r.errors}${flag} | ${r.score} |\n`;
}
md += `\n## Surviving mutants\n\n`;
if (survivors.length === 0) {
  md += `_None on the changed lines in scope._\n`;
} else {
  for (const s of survivors) {
    const line = s.m.location?.start?.line ?? '?';
    md += `- \`${s.file}:${line}\` — ${s.m.mutatorName} (${s.m.status})\n`;
  }
  md += `\nEach survivor is handed to \`implementer\` (write the red test that kills it), never marked killed here.\n`;
}
if (grandErrors > 0) {
  md += `\n> ⚠ ${grandErrors} error mutant(s) (CompileError/RuntimeError) excluded from the score — high error counts mean the config/sandbox is off; do not treat as PASS. Investigate or ESCALATE.\n`;
}

writeFileSync(out, md);
console.log(`✓ wrote ${out} (${totalSurvived} survivor(s), ${grandErrors} error mutant(s))`);
