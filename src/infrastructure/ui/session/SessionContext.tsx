import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useContainer } from '../AppContainerContext';
import type { AuthCredentials, AuthSession } from '../../../application/ports/IAuthApi';
import { HttpError } from '../../../application/ports/IHttpClient';

type AuthUser = AuthSession['user'];
export type AuthErrorKind = 'invalid' | 'taken' | 'network' | null;

interface SessionApi {
  readonly user: AuthUser | null;
  readonly token: string | null;
  readonly isAuthenticated: boolean;
  readonly busy: boolean;
  readonly error: AuthErrorKind;
  login(credentials: AuthCredentials): Promise<boolean>;
  register(credentials: AuthCredentials): Promise<boolean>;
  logout(): Promise<void>;
  clearError(): void;
}

const SessionContext = createContext<SessionApi | null>(null);

function classifyError(error: unknown): AuthErrorKind {
  if (error instanceof HttpError) {
    if (error.status === 401) return 'invalid';
    if (error.status === 409) return 'taken';
  }
  return 'network';
}

export function SessionProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const container = useContainer();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AuthErrorKind>(null);

  useEffect(() => {
    let active = true;
    void container.session.load().then((restored) => {
      if (active) setSession(restored);
    });
    return () => {
      active = false;
    };
  }, [container]);

  const authenticate = useCallback(
    async (
      action: (c: AuthCredentials) => Promise<AuthSession>,
      credentials: AuthCredentials,
    ): Promise<boolean> => {
      setBusy(true);
      setError(null);
      try {
        const result = await action(credentials);
        await container.session.save(result);
        setSession(result);
        return true;
      } catch (e) {
        setError(classifyError(e));
        return false;
      } finally {
        setBusy(false);
      }
    },
    [container],
  );

  const login = useCallback(
    (c: AuthCredentials) => authenticate((cr) => container.authApi.login(cr), c),
    [authenticate, container],
  );
  const register = useCallback(
    (c: AuthCredentials) => authenticate((cr) => container.authApi.register(cr), c),
    [authenticate, container],
  );
  const logout = useCallback(async () => {
    await container.session.clear();
    setSession(null);
  }, [container]);
  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<SessionApi>(
    () => ({
      user: session?.user ?? null,
      token: session?.accessToken ?? null,
      isAuthenticated: session !== null,
      busy,
      error,
      login,
      register,
      logout,
      clearError,
    }),
    [session, busy, error, login, register, logout, clearError],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionApi {
  const api = useContext(SessionContext);
  if (!api) {
    throw new Error('useSession must be used within a SessionProvider.');
  }
  return api;
}
