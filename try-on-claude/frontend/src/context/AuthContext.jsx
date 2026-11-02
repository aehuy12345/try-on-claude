import { useCallback, useEffect, useMemo, useState } from 'react';
import * as authService from '../services/authService.js';
import {
  TOKEN_STORAGE_KEY,
  setSessionExpiredHandler,
  tokenStorage,
} from '../services/apiClient.js';
import { AuthContext } from './authContext.js';

const PROFILE_DRAFT_KEY = 'tryon_profile_draft';

/**
 * Holds the session token (source of truth for route guards) and in-memory flags.
 * `justRegistered` is never persisted: a page reload must not show the welcome message again.
 * `sessionExpired` tells ProtectedRoute to add the expired-session banner reason; any new token clears it.
 */
export function AuthProvider({ children }) {
  const [state, setState] = useState(() => ({
    token: tokenStorage.get(),
    justRegistered: false,
    sessionExpired: false,
  }));

  // apiClient clears the token itself; mirror that in state and flag the expiry.
  useEffect(() => {
    const unregister = setSessionExpiredHandler(() =>
      setState({ token: null, justRegistered: false, sessionExpired: true }),
    );

    // Keep tabs in sync. `key === null` means localStorage.clear() ran in another tab.
    const onStorage = (event) => {
      if (event.key !== null && event.key !== TOKEN_STORAGE_KEY) return;
      const token = tokenStorage.get();
      setState((prev) =>
        prev.token === token ? prev : { token, justRegistered: false, sessionExpired: false },
      );
    };
    window.addEventListener('storage', onStorage);

    return () => {
      unregister();
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const register = useCallback(async (credentials) => {
    const { token } = await authService.register(credentials);
    tokenStorage.set(token);
    // One update so GuestRoute redirects with the flag already visible to /profile.
    setState({ token, justRegistered: true, sessionExpired: false });
  }, []);

  const login = useCallback(async (credentials) => {
    const { token } = await authService.login(credentials);
    tokenStorage.set(token);
    setState({ token, justRegistered: false, sessionExpired: false });
  }, []);

  // Callers navigate away first (Header): clearing the token on a protected page would redirect to /login.
  const logout = useCallback(() => {
    tokenStorage.clear();
    localStorage.removeItem(PROFILE_DRAFT_KEY);
    setState({ token: null, justRegistered: false, sessionExpired: false });
  }, []);

  const clearJustRegistered = useCallback(() => {
    setState((prev) => (prev.justRegistered ? { ...prev, justRegistered: false } : prev));
  }, []);

  const value = useMemo(
    () => ({
      token: state.token,
      isAuthenticated: Boolean(state.token),
      justRegistered: state.justRegistered,
      sessionExpired: state.sessionExpired,
      register,
      login,
      logout,
      clearJustRegistered,
    }),
    [state, register, login, logout, clearJustRegistered],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
