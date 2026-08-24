/**
 * SCIS Connect Mobile - Storage & Session Service
 * Provides centralized in-memory & session management for cookies, auth tokens, and user state.
 * Adheres strictly to the architectural standards in app/AGENTS.md.
 */

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

class StorageService {
  private cookies: Map<string, StoredCookie> = new Map();
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private currentUser: AuthUser | null = null;
  private rememberMe: boolean = false;

  /**
   * Set or get Remember Me preference for cookie persistence
   */
  setRememberMe(remember: boolean): void {
    this.rememberMe = remember;
    if (!remember) {
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
  }

  /**
   * Clear all cookies
   */
  clearCookies(): void {
    this.cookies.clear();
    logger.debug("STORAGE", "All cookies cleared");
  }

  /**
   * Access Token Management
   */
  setAccessToken(token: string | null): void {
    this.accessToken = token;
    logger.debug("STORAGE", token ? "Access token stored" : "Access token cleared");
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
    } else {
      this.deleteCookie("refreshToken");
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
   * Clear full session (Tokens, User, Cookies, Remember Me state)
   */
  clearSession(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.currentUser = null;
    this.cookies.clear();
    this.rememberMe = false;
    logger.info("STORAGE", "Full auth session cleared");
  }
}

export const storageService = new StorageService();
export default storageService;
