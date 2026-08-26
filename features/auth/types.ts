/**
 * SCIS Connect Mobile - Authentication Types
 * Strictly typed interfaces matching the SCIS backend contracts.
 */

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginFormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export interface ProgramInfo {
  id?: string;
  _id?: string;
  name: string;
  code: string;
}

export interface AuthUser {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  roll_no?: string;
  role?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
  batchYear?: number | string;
  program?: ProgramInfo | null;
  studentId?: string;
  course?: string;
  semester?: number;
  avatar?: string;
  avatarUrl?: string;
  community?: {
    _id?: string;
    id?: string;
    name?: string;
    code?: string;
  } | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginResponseData {
  user: AuthUser;
  accessToken: string;
  refreshToken?: string;
}

export interface RefreshTokenResponseData {
  user: AuthUser;
  accessToken: string;
  refreshToken?: string;
}

export interface RefreshTokenErrorData {
  requiresVerification?: boolean;
  email?: string;
}

export interface EmailNotVerifiedErrorData {
  requiresVerification?: boolean;
  email?: string;
  message?: string;
  resendUrl?: string;
  helpUrl?: string;
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
