/**
 * SCIS Connect Mobile - Profile API Service
 * Handles profile fetching and synchronization with backend `/api/auth/me`.
 * Adheres strictly to the architectural standards in app/AGENTS.md.
 */

import { apiClient, ApiResponse } from "@/services/api";
import { storageService } from "@/services/storage";
import { API_CONFIG } from "@/constants/config";
import { logger } from "@/utils/logger";
import { UserProfile, UserProfileResponse } from "./types";
import { useAuthStore } from "@/features/auth/authStore";

export const profileApi = {
  /**
   * Fetch current user's complete profile
   * Endpoint: GET /api/auth/me
   * Response: { success: true, message: "User profile retrieved", data: { user: UserProfile } }
   */
  async getProfile(): Promise<ApiResponse<UserProfileResponse>> {
    logger.info("PROFILE_API", `Fetching student profile from ${API_CONFIG.ENDPOINTS.AUTH.ME}`);

    const response = await apiClient.get<UserProfileResponse>(API_CONFIG.ENDPOINTS.AUTH.ME);

    if (response.data) {
      const raw = response.data as unknown as Record<string, unknown>;
      const profileUser = (raw.user || raw.student || raw.data || raw) as UserProfile;
      if (profileUser && (profileUser.email || profileUser.name || profileUser.id || profileUser._id)) {
        // Persist fresh user profile data in local storage
        storageService.setUser(profileUser);
        // Sync into global Auth store
        useAuthStore.getState().setUser(profileUser);

        logger.info("PROFILE_API", "Profile retrieved and synced to local store", {
          userId: profileUser.id || profileUser._id,
          email: profileUser.email,
          hasProfileImage: Boolean(profileUser.profileImage || profileUser.avatar),
        });
      }
    }

    return response;
  },
};

export default profileApi;
