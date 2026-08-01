import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const migrationPath = resolve(
  __dirname,
  '../../../../supabase/migrations/20260722000000_multi_provider_ai_keys.sql',
);

const sql = () => readFileSync(migrationPath, 'utf8');

/** Slice one RPC: `create function …` through its `grant execute …;` (not sibling RPCs). */
const rpcChunk = (content: string, name: string): string => {
  const re = new RegExp(
    String.raw`create\s+function\s+public\.${name}\b[\s\S]*?grant\s+execute\s+on\s+function\s+public\.${name}\b[^;]*;`,
    'i',
  );
  const match = content.match(re);
  if (!match) {
    throw new Error(`RPC chunk for public.${name} not found in migration`);
  }
  return match[0];
};

describe('composite-pk migration', () => {
  // @s4/@s5 — composite PK (user_id, provider) enforces one row per provider per user
  it('drops the old user_id-only PK and adds composite PK (user_id, provider)', () => {
    const content = sql();
    expect(content).toMatch(/alter table public\.user_ai_keys drop constraint/i);
    expect(content).toMatch(/add constraint user_ai_keys_pkey primary key \(user_id, provider\)/i);
  });

  it('adds a CHECK constraint restricting provider to the six allowed values', () => {
    const content = sql();
    expect(content).toMatch(
      /add constraint user_ai_keys_provider_check check \(provider in \('groq','openai','anthropic','google','xai','deepseek'\)\)/i,
    );
  });

  // @s4/@s5 — save_api_key upserts via named PK constraint (column list is ambiguous with
  // RETURNS TABLE(provider, …) output vars) and names vault secret per provider
  it('redefines save_api_key to upsert on conflict (user_id, provider) with per-provider secret name', () => {
    const chunk = rpcChunk(sql(), 'save_api_key');
    expect(chunk).toMatch(
      /create\s+function\s+public\.save_api_key\(p_user_id uuid, p_provider text, p_api_key text\)/i,
    );
    expect(chunk).toMatch(/on conflict on constraint user_ai_keys_pkey do update/i);
    expect(chunk).toMatch(/user_ai_key_' \|\| p_user_id::text \|\| '_' \|\| p_provider/i);
  });

  // @s5 — remove_api_key(p_user_id, p_provider) deletes only that provider's row + vault secret
  it('redefines remove_api_key with p_provider parameter for per-provider deletion', () => {
    const chunk = rpcChunk(sql(), 'remove_api_key');
    expect(chunk).toMatch(
      /create\s+function\s+public\.remove_api_key\(p_user_id uuid, p_provider text\)/i,
    );
    // Assert the DELETE (not a sibling RPC's SELECT) — bare columns, no uak. alias.
    expect(chunk).toMatch(
      /delete from public\.user_ai_keys\s+where user_id = p_user_id\s+and provider = p_provider/i,
    );
  });

  // @s9 — get_api_key now takes p_provider to return only that provider's decrypted key
  it('redefines get_api_key to accept p_provider and return only that provider key', () => {
    const chunk = rpcChunk(sql(), 'get_api_key');
    expect(chunk).toMatch(
      /create\s+function\s+public\.get_api_key\(p_user_id uuid, p_provider text\)/i,
    );
    expect(chunk).toMatch(
      /return query[\s\S]*?where uak\.user_id = p_user_id\s+and uak\.provider = p_provider/i,
    );
  });

  // @s9 — RLS select-own policy is unchanged: it was defined in the original migration and
  // continues to scope to the owning user (auth.uid() = user_id), now for all provider rows.
  it('original migration still carries the select-own RLS policy that works for multi-row', () => {
    const originalMigrationPath = resolve(
      __dirname,
      '../../../../supabase/migrations/20260710223250_user_ai_keys.sql',
    );
    const original = readFileSync(originalMigrationPath, 'utf8');
    expect(original).toMatch(/policy "user_ai_keys_select_own"/i);
    expect(original).toMatch(/using \(auth\.uid\(\) = user_id\)/i);
    expect(original).toMatch(/grant select on public\.user_ai_keys to service_role/i);
  });

  // @s9 — service_role-only execute on all three RPCs (no authenticated/anon grant)
  it('grants execute on all three RPCs to service_role only', () => {
    const content = sql();
    for (const name of ['save_api_key', 'remove_api_key', 'get_api_key'] as const) {
      const chunk = rpcChunk(content, name);
      expect(chunk).toMatch(
        new RegExp(
          String.raw`grant execute on function public\.${name}\b[^;]*to service_role`,
          'i',
        ),
      );
    }
    expect(content).not.toMatch(
      /grant execute on function public\.(save_api_key|remove_api_key|get_api_key)\b[^;]*to (authenticated|anon)\b/i,
    );
  });
});
