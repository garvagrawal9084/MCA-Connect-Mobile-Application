/**
 * SCIS Connect Mobile - Core API Service Client
 * Standardized HTTP client for interacting with the SCIS backend API.
 */

import { API_CONFIG } from "@/constants/config";
import { logger } from "@/utils/logger";

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

interface RequestOptions extends RequestInit {
  timeout?: number;
  token?: string;
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
    const { timeout = API_CONFIG.TIMEOUT_MS, token, headers = {}, ...customConfig } = options;

    const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = `${this.baseUrl}${normalizedEndpoint}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(headers as Record<string, string>),
    };

    if (token) {
      requestHeaders["Authorization"] = `Bearer ${token}`;
    }

    try {
      logger.debug("API", `Sending request: ${options.method || "GET"} ${normalizedEndpoint}`);

      const response = await fetch(url, {
        ...customConfig,
        headers: requestHeaders,
        signal: controller.signal,
      });

      clearTimeout(timer);

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

        logger.warn("API", `API Error [${response.status}] on ${normalizedEndpoint}`, {
          status: response.status,
          message: errorMsg,
        });

        throw new ApiError(errorMsg, response.status, parsedData);
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
   * Helper: DELETE request
   */
  async delete<T = unknown>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

export const apiClient = new ApiClient();
export default apiClient;
