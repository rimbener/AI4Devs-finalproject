-- Fix manage-api-key 502 on save/remove:
-- 1) RETURNS TABLE(provider, …) shadowed ON CONFLICT (user_id, provider) → ambiguous
--    column error. Use the named PK constraint.
-- 2) Edge listUserApiKeys does adminClient.from('user_ai_keys').select(...) as
--    service_role, but that role had no SELECT grant → permission denied → 502.
--    Grant SELECT to service_role (RLS still applies to authenticated; service_role
--    bypasses RLS for the Edge admin client).
-- 3) Return every key for the user from save_api_key (matches original single-key
--    RPC shape) so callers can use the RPC payload without a second select.

grant select on public.user_ai_keys to service_role;

create or replace function public.save_api_key(p_user_id uuid, p_provider text, p_api_key text)
returns table (provider text, updated_at timestamptz)
language plpgsql
security definer
set search_path = public, vault, pg_temp
as $$
declare
  v_secret_id uuid;
  v_existing_secret_id uuid;
begin
  select uak.secret_id into v_existing_secret_id
  from public.user_ai_keys uak
  where uak.user_id = p_user_id
    and uak.provider = p_provider;

  if v_existing_secret_id is not null then
    perform vault.update_secret(v_existing_secret_id, p_api_key);
    v_secret_id := v_existing_secret_id;
  else
    v_secret_id := vault.create_secret(
      p_api_key,
      'user_ai_key_' || p_user_id::text || '_' || p_provider
    );
  end if;

  insert into public.user_ai_keys as uak (user_id, secret_id, provider, updated_at)
  values (p_user_id, v_secret_id, p_provider, now())
  on conflict on constraint user_ai_keys_pkey do update
    set secret_id  = excluded.secret_id,
        updated_at = now();

  return query
    select uak.provider, uak.updated_at
    from public.user_ai_keys uak
    where uak.user_id = p_user_id;
end;
$$;

revoke all on function public.save_api_key(uuid, text, text) from public;
grant execute on function public.save_api_key(uuid, text, text) to service_role;
