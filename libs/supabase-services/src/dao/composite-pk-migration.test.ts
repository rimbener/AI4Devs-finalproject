import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const migrationPath = resolve(
  __dirname,
  '../../../../supabase/migrations/20260722000000_multi_provider_ai_keys.sql',
);

const sql = () => readFileSync(migrationPath, 'utf8');

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

  // @s4/@s5 — save_api_key upserts on conflict (user_id, provider) and names vault secret per provider
  it('redefines save_api_key to upsert on conflict (user_id, provider) with per-provider secret name', () => {
    const content = sql();
    expect(content).toMatch(
      /create.*function public\.save_api_key\(p_user_id uuid, p_provider text, p_api_key text\)/i,
    );
    expect(content).toMatch(/on conflict \(user_id, provider\) do update/i);
    expect(content).toMatch(/user_ai_key_' \|\| p_user_id::text \|\| '_' \|\| p_provider/i);
  });

  // @s5 — remove_api_key(p_user_id, p_provider) deletes only that provider's row + vault secret
  it('redefines remove_api_key with p_provider parameter for per-provider deletion', () => {
    const content = sql();
    expect(content).toMatch(
      /create.*function public\.remove_api_key\(p_user_id uuid, p_provider text\)/i,
    );
    expect(content).toMatch(/where uak\.user_id = p_user_id\s+and uak\.provider = p_provider/i);
  });

  // @s9 — get_api_key now takes p_provider to return only that provider's decrypted key
  it('redefines get_api_key to accept p_provider and return only that provider key', () => {
    const content = sql();
    expect(content).toMatch(
      /create.*function public\.get_api_key\(p_user_id uuid, p_provider text\)/i,
    );
    expect(content).toMatch(/where uak\.user_id = p_user_id\s+and uak\.provider = p_provider/i);
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
  });

  // @s9 — service_role-only execute on all three RPCs (no authenticated grant)
  it('grants execute on all three RPCs to service_role only', () => {
    const content = sql();
    expect(content).toMatch(/grant execute on function public\.save_api_key.*to service_role/i);
    expect(content).toMatch(/grant execute on function public\.remove_api_key.*to service_role/i);
    expect(content).toMatch(/grant execute on function public\.get_api_key.*to service_role/i);
  });
});
