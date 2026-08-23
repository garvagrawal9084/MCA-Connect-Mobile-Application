/**
 * SCIS Connect Mobile - Authentication API Service
 * Handles all authentication-related network calls.
 */

import { apiClient, ApiResponse } from "@/services/api";
import { API_CONFIG } from "@/constants/config";
import {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginCredentials,
  AuthResponse,
} from "./types";

export const authApi = {
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
   * Student Login
   * Endpoint: POST /api/auth/login
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post<AuthResponse>(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
      identifier: credentials.identifier.trim(),
      password: credentials.password,
    });
  },
};

export default authApi;
