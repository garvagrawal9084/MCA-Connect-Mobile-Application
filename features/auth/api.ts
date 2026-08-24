/**
 * SCIS Connect Mobile - Authentication API Service
 * Handles all authentication-related network calls with backend integration.
 * Adheres strictly to the architectural standards in app/AGENTS.md.
 */

import { apiClient, ApiResponse, ApiError } from "@/services/api";
import { storageService } from "@/services/storage";
import { API_CONFIG } from "@/constants/config";
import { logger } from "@/utils/logger";
import {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginCredentials,
  LoginResponseData,
} from "./types";

export const authApi = {
  /**
   * Student Login
   * Endpoint: POST /api/auth/login
   * Payload: { email, password }
   * Response: { success: true, message: "Login successful", data: { user, accessToken } }
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponseData>> {
    const shouldRemember = Boolean(credentials.rememberMe);
    storageService.setRememberMe(shouldRemember);

    const payload = {
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password,
    };

    logger.info("AUTH", `Initiating login API call to ${API_CONFIG.ENDPOINTS.AUTH.LOGIN}`, {
      email: payload.email,
      rememberMe: shouldRemember,
    });

    const response = await apiClient.post<LoginResponseData>(
      API_CONFIG.ENDPOINTS.AUTH.LOGIN,
      payload,
      {
        saveCookies: shouldRemember,
      }
    );

    // If login returned tokens or user data, persist in storageService
    if (response.data) {
      if (response.data.accessToken) {
        storageService.setAccessToken(response.data.accessToken);
      }
      if (response.data.user) {
        storageService.setUser(response.data.user);
      }

      if (shouldRemember) {
        // If refreshToken was returned directly in payload in addition to Set-Cookie
        if (response.data.refreshToken) {
          storageService.setCookie("refreshToken", response.data.refreshToken);
        }
        logger.info("AUTH", "Login API successful: session, tokens, and cookies saved (Remember Me: true)", {
          userId: response.data.user?.id || response.data.user?._id,
          email: response.data.user?.email,
          cookiesStored: true,
        });
      } else {
        // Ensure no cookies are kept in storage
        storageService.clearCookies();
        logger.info("AUTH", "Login API successful: session and tokens stored WITHOUT cookies (Remember Me: false)", {
          userId: response.data.user?.id || response.data.user?._id,
          email: response.data.user?.email,
          cookiesStored: false,
        });
      }
    }

    return response;
  },

  /**
   * Request password reset OTP/link for a student college email
   * Endpoint: POST /api/auth/forgot-password
   */
  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    const payload: ForgotPasswordRequest = { email: email.trim().toLowerCase() };
    const response = await apiClient.post<ForgotPasswordResponse>(
      API_CONFIG.ENDPOINTS.AUTH.FORGOT_PASSWORD,
      payload
    );

    return {
      success: response.success,
      message: response.message || "OTP sent to your email",
      data: response.data,
    };
  },

  /**
   * Refresh Access Token
   * Endpoint: POST /api/auth/refresh
   * Backend Contract:
   *  - 401: Refresh token not found / Invalid refresh token
   *  - 403: Email not verified ({ requiresVerification: true, email: user.email })
   *  - 200: Token refreshed ({ user: formatUserWithCommunity(user), accessToken })
   */
  async refreshToken(customRefreshToken?: string): Promise<ApiResponse<LoginResponseData>> {
    const activeRefreshToken = customRefreshToken || storageService.getRefreshToken();

    logger.info("AUTH", `Initiating token refresh API call to ${API_CONFIG.ENDPOINTS.AUTH.REFRESH}`, {
      hasRefreshToken: Boolean(activeRefreshToken),
      rememberMe: storageService.isRememberMe(),
    });

    try {
      const payload = activeRefreshToken ? { refreshToken: activeRefreshToken } : undefined;
      const response = await apiClient.post<LoginResponseData>(
        API_CONFIG.ENDPOINTS.AUTH.REFRESH,
        payload,
        {
          includeCookies: true,
          saveCookies: storageService.isRememberMe(),
        }
      );

      if (response.data) {
        if (response.data.accessToken) {
          storageService.setAccessToken(response.data.accessToken);
        }
        if (response.data.user) {
          storageService.setUser(response.data.user);
        }
        if (response.data.refreshToken && storageService.isRememberMe()) {
          storageService.setRefreshToken(response.data.refreshToken);
        }

        logger.info("AUTH", "Token refreshed successfully", {
          userId: response.data.user?.id || response.data.user?._id,
          email: response.data.user?.email,
          isEmailVerified: response.data.user?.isEmailVerified,
        });
      }

      return response;
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.statusCode === 401) {
          // Refresh token expired, invalid, or missing
          logger.warn("AUTH", "Token refresh failed with 401: clearing invalid session", {
            message: err.message,
          });
          storageService.clearSession();
        } else if (err.statusCode === 403) {
          // Email verification required
          logger.warn("AUTH", "Token refresh blocked with 403: email verification required", {
            message: err.message,
            data: err.data,
          });
        }
      }
      throw err;
    }
  },

  /**
   * Log out student and purge storage
   */
  logout(): void {
    logger.info("AUTH", "Signing out user and purging session");
    storageService.clearSession();
  },
};

export default authApi;
