/**
 * SCIS Connect Mobile - Global Authentication Store (Zustand)
 * Provides reactive client-side authentication state and lifecycle methods.
 * Adheres strictly to the architectural standards in app/AGENTS.md.
 */

import { create } from "zustand";
import { AuthUser, LoginCredentials, LoginResponseData } from "./types";
import { authApi } from "./api";
import { storageService } from "@/services/storage";
import { jobWatcher } from "@/features/placement/jobWatcher";
import { notificationWatcher } from "@/services/notifications/notificationWatcher";
import { logger } from "@/utils/logger";
import {
  registerForPushNotificationsAsync,
  unregisterPushNotificationsAsync,
} from "@/services/notifications/notificationPermissions";

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  rememberMe: boolean;
  error: string | null;

  // Lifecycle & Actions
  initializeAuth: () => Promise<boolean>;
  login: (credentials: LoginCredentials) => Promise<LoginResponseData>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  setUser: (user: AuthUser | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  rememberMe: false,
  error: null,

  /**
   * App launch bootstrap: Restores persisted session from SecureStore and tests silent token refresh
   */
  initializeAuth: async (): Promise<boolean> => {
    // Avoid re-running bootstrap if already initialized
    if (get().isInitialized) {
      return get().isAuthenticated;
    }

    set({ isLoading: true });
    logger.info("AUTH_STORE", "Bootstrapping authentication lifecycle...");

    try {
      // 1. Initialize persistent storage layer
      await storageService.init();

      const isRememberMe = storageService.isRememberMe();
      const hasRefreshToken = storageService.hasRefreshToken();
      const storedUser = storageService.getUser();
      const storedAccessToken = storageService.getAccessToken();

      set({
        rememberMe: isRememberMe,
        user: storedUser,
        accessToken: storedAccessToken,
      });

      // 2. If Remember Me was enabled and we have a refresh token / session cookies, attempt silent refresh
      if (isRememberMe && hasRefreshToken) {
        logger.info("AUTH_STORE", "Found persistent Remember Me credentials; validating via silent refresh...");
        try {
          const response = await authApi.refreshToken();
          if (response.data) {
            const freshUser = storageService.getUser() || response.data.user || null;
            const freshToken = storageService.getAccessToken() || response.data.accessToken || null;

            set({
              user: freshUser,
              accessToken: freshToken,
              isAuthenticated: true,
              isLoading: false,
              isInitialized: true,
              error: null,
            });

            logger.info("AUTH_STORE", "Silent token refresh succeeded during startup bootstrap", {
              email: freshUser?.email,
              name: freshUser?.name,
            });
            registerForPushNotificationsAsync(freshToken || undefined).catch((pushErr) =>
              logger.debug("AUTH_STORE", "Push registration after silent refresh deferred", pushErr)
            );
            return true;
          }
        } catch (refreshErr) {
          logger.warn("AUTH_STORE", "Silent refresh failed during startup. Requiring re-login", refreshErr);
          storageService.clearSession();
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialized: true,
          });
          return false;
        }
      }

      // 3. Fallback check for in-memory session (e.g. fast re-renders)
      const hasValidSession = Boolean(storedUser && storedAccessToken);
      set({
        isAuthenticated: hasValidSession,
        isLoading: false,
        isInitialized: true,
      });

      logger.info("AUTH_STORE", "Authentication bootstrap completed", {
        isAuthenticated: hasValidSession,
        rememberMe: isRememberMe,
      });

      // Synchronize push token with authenticated session in background
      if (hasValidSession) {
        registerForPushNotificationsAsync(storedAccessToken || undefined).catch((e) =>
          logger.debug("AUTH_STORE", "Push registration after bootstrap deferred", e)
        );
      }

      return hasValidSession;
    } catch (err) {
      logger.error("AUTH_STORE", "Unhandled error during authentication bootstrap", err);
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
      });
      return false;
    }
  },

  /**
   * Login user with credentials and update global auth state
   */
  login: async (credentials: LoginCredentials): Promise<LoginResponseData> => {
    set({ isLoading: true, error: null });

    try {
      const response = await authApi.login(credentials);
      const data = response.data;

      if (!data) {
        throw new Error("Invalid response received from login endpoint");
      }

      const activeUser = data.user || storageService.getUser();
      const activeToken = data.accessToken || storageService.getAccessToken();

      set({
        user: activeUser,
        accessToken: activeToken,
        isAuthenticated: true,
        rememberMe: Boolean(credentials.rememberMe),
        isLoading: false,
        error: null,
      });

      logger.info("AUTH_STORE", "Login successful and global state updated", {
        email: activeUser?.email,
        rememberMe: credentials.rememberMe,
      });

      // Synchronize push token with backend for authenticated student
      registerForPushNotificationsAsync(activeToken || undefined).catch((pushErr) => {
        logger.debug("AUTH_STORE", "Background push token sync after login deferred", pushErr);
      });

      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  /**
   * Sign out student and clean both in-memory and persistent session storage
   */
  logout: () => {
    logger.info("AUTH_STORE", "Logging out student and resetting auth state");
    void unregisterPushNotificationsAsync();
    storageService.clearSession();
    jobWatcher.reset();
    notificationWatcher.reset();
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      rememberMe: false,
      error: null,
    });
  },

  /**
   * Trigger manual or background token refresh
   */
  refreshToken: async (): Promise<boolean> => {
    set({ isLoading: true });
    try {
      const response = await authApi.refreshToken();
      if (response.data) {
        const freshUser = storageService.getUser() || response.data.user || null;
        const freshToken = storageService.getAccessToken() || response.data.accessToken || null;

        set({
          user: freshUser,
          accessToken: freshToken,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        void registerForPushNotificationsAsync(freshToken || undefined);
        return true;
      }
      set({ isLoading: false });
      return false;
    } catch (err) {
      logger.warn("AUTH_STORE", "Manual token refresh failed", err);
      set({ isLoading: false });
      return false;
    }
  },

  setUser: (user: AuthUser | null) => {
    storageService.setUser(user);
    set({ user });
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
