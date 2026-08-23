/**
 * MCA Connect Mobile - Authentication Types
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
