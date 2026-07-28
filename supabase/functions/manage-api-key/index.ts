// manage-api-key -- the first Edge Function in the repo (task-2, Slice 1: `save` action;
// `remove` added in task-9, Slice 2). This file is intentionally thin HTTP/Supabase wiring --
// the actual decision logic lives in the pure, Deno-unit-tested modules it composes
// (provider.ts, handle-save.ts, handle-remove.ts, logger.ts). Verified here via manual
// smoke against a running Supabase stack, per risks.md R1 (Deno/Edge sits outside the
// Jest/Stryker harness).
import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2';

import { corsHeaders, corsPreflightResponse } from '../_shared/cors.ts';
import { loadProviderCatalog } from '../_shared/provider-catalog.ts';
import type { ProviderEntry } from '../_shared/provider-catalog.types.ts';
import { handleRemoveApiKey, type RemoveApiKeyResult } from './handle-remove.ts';
import { handleSaveApiKey, type ApiKeyStatus, type SaveApiKeyResult } from './handle-save.ts';
import { logEvent } from './logger.ts';
import { guardRemoveProvider, guardSaveProvider, type AiProvider } from './provider.ts';

// Cast used ONLY at the two `loadProviderCatalog(adminClient, ...)` call sites below (Full
// review round 1, Minor finding): the real `SupabaseClient`'s `.maybeSingle()` returns a
// thenable query builder rather than a plain `Promise`, which `loadProviderCatalog`'s minimal
// structural `CatalogQueryClient` type (task-3/D5) otherwise rejects. Scoped narrowly so
// `adminClient`'s every other use in this file (`.from('user_ai_keys').select(...)`, both
// `.rpc(...)` calls) keeps real `SupabaseClient` type checking -- unlike
// generate-lesson/index.ts's file-wide `AnySupabaseClient` (that file's `deno check` can't even
// evaluate it today due to unrelated npm:zod resolution issues; this file's `deno check` is
// green, so widening the whole file would give up a check that actually passes).
// deno-lint-ignore no-explicit-any
type AnySupabaseClient = any;

type SaveRequestBody = {
  action: 'save';
  provider: AiProvider;
  apiKey: string;
};

type RemoveRequestBody = {
  action: 'remove';
  provider: AiProvider;
};

type RequestBody = SaveRequestBody | RemoveRequestBody;

// The catalog-backed guard's own wire-level failure shape (ai-provider-registry-backend, D11) --
// a distinct, Edge-local `{ code }` union, not `@helsoft/types`' `ApiKeyErrorCode` (D11 keeps that
// widening + copy + client mapping in the paired frontend story's scope).
type ProviderGuardErrorResult = { code: 'network_error' | 'provider_disabled' };

type DispatchResult = {
  status: number;
  body: SaveApiKeyResult | RemoveApiKeyResult | ProviderGuardErrorResult;
};

type UserAiKeyRow = { provider: string; updated_at: string };

const jsonResponse = (request: Request, status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(request), 'Content-Type': 'application/json' },
  });

const errorStatus = (result: SaveApiKeyResult | RemoveApiKeyResult): number => {
  if ('code' in result) {
    return result.code === 'validation_error' ? 400 : 502;
  }
  return 200;
};

// `network_error` means "catalog read failed / provider unknown" -- a backend-side condition,
// so it gets the same 502 as every other `network_error` from `errorStatus` above regardless of
// which guard produced it. `provider_disabled` means the request named a real, known provider
// that's currently off, which is a client-correctable 400.
const guardErrorStatus = (code: 'network_error' | 'provider_disabled'): number =>
  code === 'network_error' ? 502 : 400;

const listUserApiKeys = async (
  adminClient: SupabaseClient,
  userId: string,
): Promise<ApiKeyStatus> => {
  const { data, error } = await adminClient
    .from('user_ai_keys')
    .select('provider, updated_at')
    .eq('user_id', userId);
  if (error) throw error;
  return {
    keys: (data ?? []).map((row: UserAiKeyRow) => ({
      provider: row.provider as AiProvider,
      updatedAt: row.updated_at,
    })),
  };
};

/**
 * Authenticates the caller from the request's own JWT -- user_id is derived here, never
 * trusted from the client-supplied request body (task-2 Goal, step 1). Returns `null` on any
 * auth failure so the caller can respond 401 without inspecting Supabase's own error shape.
 */
const authenticateCaller = async (
  request: Request,
  supabaseUrl: string,
  anonKey: string,
): Promise<{ userId: string } | null> => {
  const authHeader = request.headers.get('Authorization') ?? '';
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error,
  } = await callerClient.auth.getUser();

  if (error || !user) return null;
  return { userId: user.id };
};

/**
 * Guards `body`'s shape well enough to call `loadProviderCatalog(body.provider)` and the save/
 * remove handlers below -- unchanged 400 network_error for a malformed/unrecognized body
 * (`action`/`provider`/`apiKey` shape, Full review round 1, Minor 11), just checked before the
 * catalog read (and the caller's auth check) starts instead of after, so the two independent
 * reads can run concurrently (see `Deno.serve` below).
 */
const isValidRequestBody = (body: Partial<RequestBody>): body is RequestBody => {
  if (body.action === 'save') {
    return typeof body.provider === 'string' && typeof body.apiKey === 'string';
  }
  return body.action === 'remove' && typeof body.provider === 'string';
};

/**
 * Routes an already-validated, already-authenticated request body to the save or remove
 * handler, given the provider catalog entry already loaded by the caller (task-9, D6 -- no
 * hardcoded allow-list remains). A throwing catalog read propagates out of `Deno.serve`'s own
 * `Promise.all` uncaught, straight into the top-level try/catch below, which fails closed as 502
 * network_error (task-10, D6) -- asserted, not a new branch.
 */
const dispatch = async (
  body: RequestBody,
  adminClient: SupabaseClient,
  userId: string,
  entry: ProviderEntry | null,
): Promise<DispatchResult> => {
  if (body.action === 'remove') {
    // Remove never consults `enabled` (D10) -- only whether the provider is known at all.
    const guard = guardRemoveProvider(entry);
    if (!guard.ok) {
      return { status: guardErrorStatus(guard.code), body: { code: guard.code } };
    }
    const result = await handleRemoveApiKey(
      { userId, provider: body.provider },
      {
        removeApiKey: async ({ userId: id, provider }) => {
          const { error } = await adminClient.rpc('remove_api_key', {
            p_user_id: id,
            p_provider: provider,
          });
          if (error) throw error;
          return listUserApiKeys(adminClient, id);
        },
        log: logEvent,
      },
    );
    return { status: errorStatus(result), body: result };
  }

  // Save is refused for a disabled provider (D10/D12), checked against the already-loaded entry
  // before any Vault write/RPC call.
  const guard = guardSaveProvider(entry);
  if (!guard.ok) {
    return { status: guardErrorStatus(guard.code), body: { code: guard.code } };
  }

  const result = await handleSaveApiKey(
    { userId, provider: body.provider, apiKey: body.apiKey },
    {
      storeApiKey: async ({ userId: id, provider, apiKey }) => {
        const { error } = await adminClient.rpc('save_api_key', {
          p_user_id: id,
          p_provider: provider,
          p_api_key: apiKey,
        });
        if (error) throw error;
        return listUserApiKeys(adminClient, id);
      },
      log: logEvent,
    },
  );
  return { status: errorStatus(result), body: result };
};

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') {
    return corsPreflightResponse(request);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  // Tracks which action was being handled so the catch-all failure log below is still
  // shaped correctly (@s12) even when the failure happens before/during dispatch.
  let action: 'save' | 'remove' = 'save';

  try {
    const body = (await request.json()) as Partial<RequestBody>;
    if (body.action === 'remove') action = 'remove';

    if (!isValidRequestBody(body)) {
      return jsonResponse(request, 400, { code: 'network_error' });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Authenticating the caller and loading the provider catalog are independent of each other
    // (auth only needs the request's own JWT; the catalog read only needs `body.provider`) --
    // run them concurrently instead of back-to-back so a save/remove call costs one fewer
    // sequential round trip.
    const [caller, entry] = await Promise.all([
      authenticateCaller(request, supabaseUrl, anonKey),
      loadProviderCatalog(adminClient as AnySupabaseClient, body.provider),
    ]);
    if (!caller) {
      return jsonResponse(request, 401, { code: 'network_error' });
    }

    const result = await dispatch(body, adminClient, caller.userId, entry);
    return jsonResponse(request, result.status, result.body);
  } catch {
    // Redacted per @s12 -- never log the request body or key, only a generic outcome.
    logEvent({ action, outcome: 'network_error', userId: 'unknown' });
    return jsonResponse(request, 502, { code: 'network_error' });
  }
});
