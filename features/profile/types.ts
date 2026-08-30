/**
 * SCIS Connect Mobile - Student Profile Types & Generic Fallback Data
 * Strictly typed interfaces matching the SCIS backend `/api/auth/me` contract.
 */

import { AuthUser } from "@/features/auth/types";

export type UserProfile = AuthUser;

export interface UserProfileResponse {
  user: UserProfile;
}

export interface ProfileState {
  profile: UserProfile | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
}
