import { useCallback, useMemo, useState } from 'react';
import * as authService from '../services/authService.js';
import { tokenStorage } from '../services/apiClient.js';
import { AuthContext } from './authContext.js';

/**
 * Holds the session token (source of truth for route guards) and in-memory flags.
 * `justRegistered` is never persisted: a page reload must not show the welcome message again.
 */
export function AuthProvider({ children }) {
  const [state, setState] = useState(() => ({ token: tokenStorage.get(), justRegistered: false }));

  const register = useCallback(async (credentials) => {
    const { token } = await authService.register(credentials);
    tokenStorage.set(token);
    // One update so GuestRoute redirects with the flag already visible to /profile.
    setState({ token, justRegistered: true });
  }, []);

  const clearJustRegistered = useCallback(() => {
    setState((prev) => (prev.justRegistered ? { ...prev, justRegistered: false } : prev));
  }, []);

  const value = useMemo(
    () => ({
      token: state.token,
      isAuthenticated: Boolean(state.token),
      justRegistered: state.justRegistered,
      register,
      clearJustRegistered,
    }),
    [state, register, clearJustRegistered],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
