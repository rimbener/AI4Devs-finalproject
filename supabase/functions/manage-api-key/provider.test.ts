import { assertEquals } from 'jsr:@std/assert@1';

import { isAiProvider } from './provider.ts';

// @s2/@s4/@s5 — the allow-list now covers all six providers
Deno.test('isAiProvider accepts all six known providers', () => {
  assertEquals(isAiProvider('groq'), true);
  assertEquals(isAiProvider('openai'), true);
  assertEquals(isAiProvider('anthropic'), true);
  assertEquals(isAiProvider('google'), true);
  assertEquals(isAiProvider('xai'), true);
  assertEquals(isAiProvider('deepseek'), true);
});

Deno.test('isAiProvider rejects an unrecognized provider string', () => {
  assertEquals(isAiProvider('unknown'), false);
  assertEquals(isAiProvider('azure'), false);
});

Deno.test('isAiProvider rejects non-string values (including undefined/missing)', () => {
  assertEquals(isAiProvider(undefined), false);
  assertEquals(isAiProvider(42), false);
  assertEquals(isAiProvider(null), false);
});
