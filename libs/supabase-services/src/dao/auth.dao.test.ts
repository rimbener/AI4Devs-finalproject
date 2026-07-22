jest.mock('../supabase/supabase-client', () => ({ getSupabase: jest.fn() }));

import { getSupabase } from '../supabase/supabase-client';
import { AuthDao } from './auth.dao';

const mockGetSupabase = getSupabase as jest.Mock;

describe('AuthDao', () => {
  const signInWithPassword = jest.fn();
  const signOut = jest.fn();
  const getSession = jest.fn();
  const onAuthStateChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSupabase.mockReturnValue({
      auth: { signInWithPassword, signOut, getSession, onAuthStateChange },
    });
  });

  // @s2 — happy path sign-in delegates to supabase-js with the exact credentials and returns
  // the raw session/user data untouched (no mapping at this layer).
  it('signInWithPassword calls supabase auth.signInWithPassword with the given email and password', async () => {
    const data = { session: { access_token: 'tok' }, user: { id: 'u1' } };
    signInWithPassword.mockResolvedValue({ data, error: null });

    const result = await AuthDao.signInWithPassword({ email: 'a@b.com', password: 'secret1' });

    expect(signInWithPassword).toHaveBeenCalledWith({ email: 'a@b.com', password: 'secret1' });
    expect(result).toBe(data);
  });

  // @s2 (failure path) — a supabase auth error is thrown as-is; mapping to a typed error
  // code is the service's job (task-6), not the DAO's.
  it('signInWithPassword throws the raw supabase error when authentication fails', async () => {
    const error = { message: 'Invalid login credentials', status: 400 };
    signInWithPassword.mockResolvedValue({ data: { session: null, user: null }, error });

    await expect(AuthDao.signInWithPassword({ email: 'a@b.com', password: 'wrong' })).rejects.toBe(
      error,
    );
  });

  // @s4 — sign-out delegates to supabase-js with no arguments.
  it('signOut calls supabase auth.signOut', async () => {
    signOut.mockResolvedValue({ error: null });

    await AuthDao.signOut();

    expect(signOut).toHaveBeenCalledWith();
  });

  // @s4 (failure path) — a supabase sign-out error is thrown as-is.
  it('signOut throws the raw supabase error when it fails', async () => {
    const error = { message: 'network error' };
    signOut.mockResolvedValue({ error });

    await expect(AuthDao.signOut()).rejects.toBe(error);
  });

  it('getSession returns the current session from supabase auth', async () => {
    const session = { access_token: 'tok' };
    getSession.mockResolvedValue({ data: { session }, error: null });

    const result = await AuthDao.getSession();

    expect(getSession).toHaveBeenCalledWith();
    expect(result).toBe(session);
  });

  it('getSession throws the raw supabase error when it fails', async () => {
    const error = { message: 'session failed' };
    getSession.mockResolvedValue({ data: { session: null }, error });

    await expect(AuthDao.getSession()).rejects.toBe(error);
  });

  it('onAuthStateChange wires the callback and returns an unsubscribe', () => {
    const unsubscribe = jest.fn();
    onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe } },
    });
    const callback = jest.fn();

    const stop = AuthDao.onAuthStateChange(callback);
    const registered = onAuthStateChange.mock.calls[0][0] as (
      event: string,
      session: unknown,
    ) => void;
    registered('SIGNED_IN', { access_token: 'tok' });
    stop();

    expect(callback).toHaveBeenCalledWith({ access_token: 'tok' });
    expect(unsubscribe).toHaveBeenCalledWith();
  });
});
