/**
 * SCIS Connect Mobile - Core API Service Client
 * Standardized HTTP client for interacting with the SCIS backend API.
 * Adheres strictly to the architectural standards in app/AGENTS.md.
 */

import { API_CONFIG } from "@/constants/config";
import { logger } from "@/utils/logger";
import { storageService } from "@/services/storage";
import type { LoginResponseData } from "@/features/auth/types";
import { Platform } from "react-native";
import * as Device from "expo-device";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  statusCode?: number;
}

export class ApiError extends Error {
  statusCode: number;
  data?: unknown;

  constructor(message: string, statusCode: number = 500, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.data = data;
  }
}

export interface RequestOptions extends RequestInit {
  timeout?: number;
  token?: string;
  includeCookies?: boolean;
  saveCookies?: boolean;
  _retry?: boolean;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_CONFIG.BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  /**
   * Main request handler
   */
  async request<T = unknown>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      timeout = API_CONFIG.TIMEOUT_MS,
      token,
      includeCookies = true,
      saveCookies,
      headers = {},
      ...customConfig
    } = options;

    const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = `${this.baseUrl}${normalizedEndpoint}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-SCIS-Client": "mobile-app",
      "X-SCIS-Platform": Platform.OS,
      "X-SCIS-Device-Model": encodeURIComponent(Device.modelName || "Unknown mobile device"),
      ...(headers as Record<string, string>),
    };

    // Attach Bearer token if provided or stored
    const activeToken = token || storageService.getAccessToken();
    if (activeToken) {
      requestHeaders["Authorization"] = `Bearer ${activeToken}`;
    }

    // Attach stored cookies if enabled and present
    if (includeCookies) {
      const cookieHeader = storageService.getCookieHeader();
      if (cookieHeader && !requestHeaders["Cookie"]) {
        requestHeaders["Cookie"] = cookieHeader;
      }
    }

    try {
      logger.debug("API", `Sending request: ${options.method || "GET"} ${normalizedEndpoint}`);

      const response = await fetch(url, {
        credentials: "include",
        ...customConfig,
        headers: requestHeaders,
        signal: controller.signal,
      });

      clearTimeout(timer);

      // Extract and persist any Set-Cookie headers only when explicitly enabled or when rememberMe is active
      const shouldSaveCookies =
        saveCookies !== undefined ? saveCookies : storageService.isRememberMe();

      if (shouldSaveCookies) {
        try {
          const rawHeaders = response.headers as unknown as {
            getSetCookie?: () => string[];
            get: (header: string) => string | null;
          };

          if (typeof rawHeaders.getSetCookie === "function") {
            const cookies = rawHeaders.getSetCookie();
            if (cookies && cookies.length > 0) {
              storageService.parseAndStoreSetCookie(cookies);
            }
          } else {
            const setCookieHeader = response.headers.get("set-cookie");
            if (setCookieHeader) {
              storageService.parseAndStoreSetCookie(setCookieHeader);
            }
          }
        } catch (cookieErr) {
          logger.debug("API", "Could not parse Set-Cookie header", cookieErr);
        }
      } else {
        logger.debug("API", "Skipping cookie storage because Remember Me / saveCookies is disabled");
      }

      // Parse JSON response safely
      let responseData: unknown = null;
      const text = await response.text();
      if (text) {
        try {
          responseData = JSON.parse(text);
        } catch {
          responseData = { message: text };
        }
      }

      const isSuccess = response.ok;
      const parsedData = responseData as Record<string, unknown> | null;
      const message =
        parsedData?.message && typeof parsedData.message === "string"
          ? parsedData.message
          : isSuccess
          ? "Request succeeded"
          : "Request failed";

      if (!isSuccess) {
        const errorMsg =
          (parsedData?.message as string) ||
          (parsedData?.error as string) ||
          `HTTP Error ${response.status}: ${response.statusText}`;

        // Auto-refresh token retry on 401 Unauthorized for non-auth routes
        const isAuthRoute =
          normalizedEndpoint.includes("/api/auth/login") ||
          normalizedEndpoint.includes("/api/auth/refresh") ||
          normalizedEndpoint.includes("/api/auth/forgot-password");

        if (
          response.status === 401 &&
          !options._retry &&
          !isAuthRoute &&
          storageService.hasRefreshToken()
        ) {
          logger.info(
            "API",
            `Encountered 401 on ${normalizedEndpoint}. Attempting silent token refresh...`
          );
          try {
            const refreshPayload = { refreshToken: storageService.getRefreshToken() };
            const refreshRes = await this.post<LoginResponseData>(
              API_CONFIG.ENDPOINTS.AUTH.REFRESH,
              refreshPayload,
              {
                includeCookies: true,
                saveCookies: storageService.isRememberMe(),
                _retry: true,
              }
            );

            if (refreshRes.data?.accessToken) {
              storageService.setAccessToken(refreshRes.data.accessToken);
              if (refreshRes.data.user) {
                storageService.setUser(refreshRes.data.user);
              }
              if (refreshRes.data.refreshToken && storageService.isRememberMe()) {
                storageService.setRefreshToken(refreshRes.data.refreshToken);
              }
              logger.info("API", `Token refreshed silently. Retrying ${normalizedEndpoint}`);
              return this.request<T>(endpoint, {
                ...options,
                token: refreshRes.data.accessToken,
                _retry: true,
              });
            }
          } catch (refreshErr) {
            logger.warn("API", "Silent token refresh failed during 401 retry", refreshErr);
            storageService.clearSession();
          }
        }

        logger.warn("API", `API Error [${response.status}] on ${normalizedEndpoint}`, {
          status: response.status,
          message: errorMsg,
          data: parsedData?.data || parsedData,
        });

        throw new ApiError(errorMsg, response.status, parsedData?.data || parsedData);
      }

      return {
        success: parsedData?.success !== false,
        message,
        data: (parsedData?.data as T) ?? (parsedData as unknown as T),
        statusCode: response.status,
      };
    } catch (err: unknown) {
      clearTimeout(timer);

      if (err instanceof ApiError) {
        throw err;
      }

      if (err instanceof Error && err.name === "AbortError") {
        logger.error("API", `Request timed out on ${normalizedEndpoint}`, err);
        throw new ApiError("Network request timed out. Please check your connection.", 408);
      }

      const errorMessage =
        err instanceof Error ? err.message : "Network error. Please try again.";
      logger.error("API", `Network/Client failure on ${normalizedEndpoint}`, err);
      throw new ApiError(errorMessage, 0);
    }
  }

  /**
   * Helper: GET request
   */
  async get<T = unknown>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  /**
   * Helper: POST request
   */
  async post<T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * Helper: PUT request
   */
  async put<T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * Helper: PATCH request
   */
  async patch<T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * Helper: DELETE request
   */
  async delete<T = unknown>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

export const apiClient = new ApiClient();
export default apiClient;
