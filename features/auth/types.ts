/**
 * SCIS Connect Mobile - Authentication Types
 */

export interface LoginCredentials {
  identifier: string; // Email or Student Registration Number
  password: string;
  rememberMe?: boolean;
}

export interface LoginFormErrors {
  identifier?: string;
  password?: string;
  general?: string;
}

export interface AuthUser {
  id: string;
  studentId: string;
  name: string;
  email: string;
  course: string;
  semester: number;
  avatarUrl?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: AuthUser;
  expiresIn?: number;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  data?: unknown;
}

export interface ForgotPasswordFormErrors {
  email?: string;
  general?: string;
}
