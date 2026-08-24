/**
 * SCIS Connect Mobile - Authentication Custom Hooks
 * Provides clean React hooks for consuming authentication state.
 * Adheres strictly to the architectural standards in app/AGENTS.md.
 */

import { useAuthStore } from "./authStore";

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const rememberMe = useAuthStore((state) => state.rememberMe);
  const error = useAuthStore((state) => state.error);

  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const clearError = useAuthStore((state) => state.clearError);

  return {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    isInitialized,
    rememberMe,
    error,
    initializeAuth,
    login,
    logout,
    refreshToken,
    clearError,
  };
}

export default useAuth;
