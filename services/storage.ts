/**
 * SCIS Connect Mobile - Storage & Session Service
 * Provides centralized in-memory & persistent session management for cookies, auth tokens, and user state.
 * Adheres strictly to the architectural standards in app/AGENTS.md.
 */

import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { logger } from "@/utils/logger";
import { AuthUser } from "@/features/auth/types";

export interface CookieOptions {
  path?: string;
  domain?: string;
  expires?: Date;
  maxAge?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "strict" | "lax" | "none";
}

export interface StoredCookie {
  name: string;
  value: string;
  options?: CookieOptions;
}

export interface NotificationPreferences {
  masterNotificationsEnabled: boolean;
  jobAlertsEnabled: boolean;
  announcementsEnabled: boolean;
  deadlineRemindersEnabled: boolean;
  resultsPublishedEnabled: boolean;
}

const STORAGE_KEYS = {
  REMEMBER_ME: "scis_auth_remember_me",
  COOKIES: "scis_auth_cookies",
  ACCESS_TOKEN: "scis_auth_access_token",
  REFRESH_TOKEN: "scis_auth_refresh_token",
  USER: "scis_auth_user",
  NOTIFICATION_PREFERENCES: "scis_notification_preferences",
} as const;

// Safe platform wrapper for SecureStore with web/local fallback
async function safeSecureGet(key: string): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return null;
    }
    const isAvailable = await SecureStore.isAvailableAsync();
    if (isAvailable) {
      return await SecureStore.getItemAsync(key);
    }
    return null;
  } catch (err) {
    logger.debug("STORAGE", `SecureStore get failed for ${key}`, err);
    return null;
  }
}

async function safeSecureSet(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
      return;
    }
    const isAvailable = await SecureStore.isAvailableAsync();
    if (isAvailable) {
      await SecureStore.setItemAsync(key, value);
    }
  } catch (err) {
    logger.debug("STORAGE", `SecureStore set failed for ${key}`, err);
  }
}

async function safeSecureDelete(key: string): Promise<void> {
  try {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(key);
      }
      return;
    }
    const isAvailable = await SecureStore.isAvailableAsync();
    if (isAvailable) {
      await SecureStore.deleteItemAsync(key);
    }
  } catch (err) {
    logger.debug("STORAGE", `SecureStore delete failed for ${key}`, err);
  }
}

class StorageService {
  private cookies: Map<string, StoredCookie> = new Map();
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private currentUser: AuthUser | null = null;
  private rememberMe: boolean = false;
  private initialized: boolean = false;

  /**
   * Asynchronously initialize storage by loading persisted session data from SecureStore
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      const rememberMeValue = await safeSecureGet(STORAGE_KEYS.REMEMBER_ME);
      const shouldRemember = rememberMeValue === "true";
      this.rememberMe = shouldRemember;

      if (shouldRemember) {
        // Load refresh token
        const persistedRefreshToken = await safeSecureGet(STORAGE_KEYS.REFRESH_TOKEN);
        if (persistedRefreshToken) {
          this.refreshToken = persistedRefreshToken;
        }

        // Load access token
        const persistedAccessToken = await safeSecureGet(STORAGE_KEYS.ACCESS_TOKEN);
        if (persistedAccessToken) {
          this.accessToken = persistedAccessToken;
        }

        // Load cookies
        const persistedCookiesJson = await safeSecureGet(STORAGE_KEYS.COOKIES);
        if (persistedCookiesJson) {
          try {
            const parsed = JSON.parse(persistedCookiesJson) as Record<string, StoredCookie>;
            this.cookies.clear();
            for (const [key, item] of Object.entries(parsed)) {
              this.cookies.set(key, item);
            }
          } catch (e) {
            logger.warn("STORAGE", "Failed to parse persisted cookies JSON", e);
          }
        }

        // Load user profile
        const persistedUserJson = await safeSecureGet(STORAGE_KEYS.USER);
        if (persistedUserJson) {
          try {
            this.currentUser = JSON.parse(persistedUserJson) as AuthUser;
          } catch (e) {
            logger.warn("STORAGE", "Failed to parse persisted user JSON", e);
          }
        }

        logger.info("STORAGE", "Session restored from SecureStore", {
          rememberMe: true,
          hasAccessToken: Boolean(this.accessToken),
          hasRefreshToken: Boolean(this.refreshToken),
          userEmail: this.currentUser?.email,
          cookieCount: this.cookies.size,
        });
      } else {
        logger.debug("STORAGE", "No persistent Remember Me session found in SecureStore");
      }
    } catch (err) {
      logger.error("STORAGE", "Failed during storageService.init()", err);
    } finally {
      this.initialized = true;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Set or get Remember Me preference for cookie persistence
   */
  setRememberMe(remember: boolean): void {
    this.rememberMe = remember;
    if (remember) {
      safeSecureSet(STORAGE_KEYS.REMEMBER_ME, "true");
      this.persistCurrentSession();
    } else {
      safeSecureSet(STORAGE_KEYS.REMEMBER_ME, "false");
      this.clearPersistedSession();
      this.clearCookies();
    }
    logger.debug("STORAGE", `Remember Me preference updated: ${remember}`);
  }

  isRememberMe(): boolean {
    return this.rememberMe;
  }

  /**
   * Set or update a cookie
   */
  setCookie(name: string, value: string, options?: CookieOptions): void {
    if (!name) return;
    this.cookies.set(name, { name, value, options });
    logger.debug("STORAGE", `Cookie saved: ${name}=${value ? "[PROTECTED]" : ""}`);

    if (this.rememberMe) {
      this.persistCookies();
    }
  }

  /**
   * Get a cookie by name
   */
  getCookie(name: string): string | null {
    const cookie = this.cookies.get(name);
    return cookie ? cookie.value : null;
  }

  /**
   * Get all stored cookies as a key-value record
   */
  getAllCookies(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, item] of this.cookies.entries()) {
      result[key] = item.value;
    }
    return result;
  }

  /**
   * Format all stored cookies as a standard HTTP 'Cookie' header string
   * e.g., "refreshToken=xyz; session=abc"
   */
  getCookieHeader(): string {
    const cookiePairs: string[] = [];
    for (const [key, item] of this.cookies.entries()) {
      if (item.value) {
        cookiePairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(item.value)}`);
      }
    }
    return cookiePairs.join("; ");
  }

  /**
   * Parse Set-Cookie header strings and update the stored cookies
   */
  parseAndStoreSetCookie(setCookieHeader: string | string[] | null | undefined): void {
    if (!setCookieHeader) return;

    const cookieStrings = Array.isArray(setCookieHeader)
      ? setCookieHeader
      : [setCookieHeader];

    for (const cookieStr of cookieStrings) {
      if (!cookieStr) continue;
      // Split cookie string by semicolon to extract name=value and attributes
      const parts = cookieStr.split(";").map((p) => p.trim());
      const firstPart = parts[0];
      if (!firstPart) continue;

      const equalIndex = firstPart.indexOf("=");
      if (equalIndex === -1) continue;

      const name = decodeURIComponent(firstPart.substring(0, equalIndex).trim());
      const value = decodeURIComponent(firstPart.substring(equalIndex + 1).trim());

      this.setCookie(name, value);
    }
  }

  /**
   * Delete a specific cookie
   */
  deleteCookie(name: string): void {
    this.cookies.delete(name);
    logger.debug("STORAGE", `Cookie deleted: ${name}`);
    if (this.rememberMe) {
      this.persistCookies();
    }
  }

  /**
   * Clear all cookies
   */
  clearCookies(): void {
    this.cookies.clear();
    logger.debug("STORAGE", "All cookies cleared");
    if (this.rememberMe) {
      safeSecureDelete(STORAGE_KEYS.COOKIES);
    }
  }

  /**
   * Access Token Management
   */
  setAccessToken(token: string | null): void {
    this.accessToken = token;
    logger.debug("STORAGE", token ? "Access token stored" : "Access token cleared");

    if (this.rememberMe) {
      if (token) {
        safeSecureSet(STORAGE_KEYS.ACCESS_TOKEN, token);
      } else {
        safeSecureDelete(STORAGE_KEYS.ACCESS_TOKEN);
      }
    }
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Current Authenticated User Management
   */
  setUser(user: AuthUser | null): void {
    this.currentUser = user;
    logger.debug("STORAGE", user ? `User set: ${user.email}` : "User cleared");

    if (this.rememberMe) {
      if (user) {
        // Persist essential auth profile data under 2048 bytes limit
        const compactUser: Partial<AuthUser> = {
          id: user.id || user._id,
          _id: user._id || user.id,
          name: user.name,
          email: user.email,
          roll_no: user.roll_no,
          role: user.role,
          program: user.program,
          avatar: user.avatar,
          avatarUrl: user.avatarUrl,
          isActive: user.isActive,
          isEmailVerified: user.isEmailVerified,
          batchYear: user.batchYear,
        };
        safeSecureSet(STORAGE_KEYS.USER, JSON.stringify(compactUser));
      } else {
        safeSecureDelete(STORAGE_KEYS.USER);
      }
    }
  }

  getUser(): AuthUser | null {
    return this.currentUser;
  }

  /**
   * Refresh Token Management
   */
  setRefreshToken(token: string | null): void {
    this.refreshToken = token;
    if (token) {
      this.setCookie("refreshToken", token);
      if (this.rememberMe) {
        safeSecureSet(STORAGE_KEYS.REFRESH_TOKEN, token);
      }
    } else {
      this.deleteCookie("refreshToken");
      if (this.rememberMe) {
        safeSecureDelete(STORAGE_KEYS.REFRESH_TOKEN);
      }
    }
    logger.debug("STORAGE", token ? "Refresh token stored" : "Refresh token cleared");
  }

  getRefreshToken(): string | null {
    return this.refreshToken || this.getCookie("refreshToken") || null;
  }

  hasRefreshToken(): boolean {
    return Boolean(this.getRefreshToken());
  }

  /**
   * Persist current in-memory cookies to SecureStore
   */
  private persistCookies(): void {
    try {
      const obj: Record<string, StoredCookie> = {};
      for (const [key, item] of this.cookies.entries()) {
        obj[key] = item;
      }
      safeSecureSet(STORAGE_KEYS.COOKIES, JSON.stringify(obj));
    } catch (err) {
      logger.warn("STORAGE", "Failed to persist cookies to SecureStore", err);
    }
  }

  /**
   * Persist full active session to SecureStore
   */
  private persistCurrentSession(): void {
    this.persistCookies();
    if (this.refreshToken) {
      safeSecureSet(STORAGE_KEYS.REFRESH_TOKEN, this.refreshToken);
    }
    if (this.accessToken) {
      safeSecureSet(STORAGE_KEYS.ACCESS_TOKEN, this.accessToken);
    }
    if (this.currentUser) {
      safeSecureSet(STORAGE_KEYS.USER, JSON.stringify(this.currentUser));
    }
  }

  /**
   * Clear all persisted session items in SecureStore
   */
  private clearPersistedSession(): void {
    safeSecureDelete(STORAGE_KEYS.COOKIES);
    safeSecureDelete(STORAGE_KEYS.REFRESH_TOKEN);
    safeSecureDelete(STORAGE_KEYS.ACCESS_TOKEN);
    safeSecureDelete(STORAGE_KEYS.USER);
    safeSecureDelete(STORAGE_KEYS.REMEMBER_ME);
  }

  /**
   * Clear full session (Tokens, User, Cookies, Remember Me state) from memory and SecureStore
   */
  clearSession(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.currentUser = null;
    this.cookies.clear();
    this.rememberMe = false;
    this.clearPersistedSession();
    logger.info("STORAGE", "Full auth session cleared (memory + SecureStore)");
  }

  /**
   * Notification Preferences Persistence
   */
  async getNotificationPreferences(): Promise<Partial<NotificationPreferences> | null> {
    try {
      const json = await safeSecureGet(STORAGE_KEYS.NOTIFICATION_PREFERENCES);
      return json ? JSON.parse(json) : null;
    } catch (e) {
      logger.debug("STORAGE", "Failed to load notification preferences", e);
      return null;
    }
  }

  async saveNotificationPreferences(prefs: Partial<NotificationPreferences>): Promise<void> {
    try {
      await safeSecureSet(STORAGE_KEYS.NOTIFICATION_PREFERENCES, JSON.stringify(prefs));
      logger.debug("STORAGE", "Persisted notification preferences to storage");
    } catch (e) {
      logger.debug("STORAGE", "Failed to save notification preferences", e);
    }
  }
}

export const storageService = new StorageService();
export default storageService;
