-- Local-only seed (runs on `supabase db reset` / first `supabase start`).
-- Do NOT push this to a hosted project — use Auth Admin API there instead.

create extension if not exists pgcrypto;

-- Core plans, matching the hosted project. Redundant with the migration's own
-- insert but kept explicit here so a reset always reflects the cloud values.
insert into public.plans (
  id,
  use_platform_key,
  show_ads,
  show_key_settings
)
values
  ('free', false, true, true),
  ('paid', true, false, false)
on conflict (id) do update set
  use_platform_key = excluded.use_platform_key,
  show_ads = excluded.show_ads,
  show_key_settings = excluded.show_key_settings;

-- Demo plan flag rows (beyond seeded free/paid above).
insert into public.plans (
  id,
  use_platform_key,
  show_ads,
  show_key_settings
)
values
  ('demo_platform_key', true, false, false),
  ('demo_show_ads', false, true, false),
  ('demo_show_key', false, false, true)
on conflict (id) do update set
  use_platform_key = excluded.use_platform_key,
  show_ads = excluded.show_ads,
  show_key_settings = excluded.show_key_settings;

-- Entitlement demo users (password: test123). Profiles are created by trigger; flip plan_id after.
do $$
declare
  r record;
begin
  for r in
    select *
    from (
      values
        (
          '44444444-4444-4444-4444-444444444444'::uuid,
          'test@free.com',
          'free'
        ),
        (
          '55555555-5555-5555-5555-555555555555'::uuid,
          'test@paid.com',
          'paid'
        )
    ) as t(user_id, email, plan_id)
  loop
    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000',
      r.user_id,
      'authenticated',
      'authenticated',
      r.email,
      crypt('test123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

    insert into auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) values (
      gen_random_uuid(),
      r.user_id,
      format(
        '{"sub":"%s","email":"%s","email_verified":true,"phone_verified":false}',
        r.user_id,
        r.email
      )::jsonb,
      'email',
      r.user_id::text,
      now(),
      now(),
      now()
    );

    update public.profiles
    set plan_id = r.plan_id
    where id = r.user_id;
  end loop;
end $$;
