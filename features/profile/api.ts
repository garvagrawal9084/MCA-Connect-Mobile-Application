/**
 * SCIS Connect Mobile - Profile API Service
 * Handles profile fetching, updates, and synchronization with backend `/api/profile/*` endpoints.
 * Adheres strictly to the architectural standards in app/AGENTS.md.
 */

import { apiClient, ApiResponse } from "@/services/api";
import { storageService } from "@/services/storage";
import { API_CONFIG } from "@/constants/config";
import { logger } from "@/utils/logger";
import {
  UserProfile,
  UserProfileResponse,
  UpdateProfileRequest,
  UpdateContactRequest,
  UpdateEducationRequest,
  UpdateProfessionalRequest,
  ChangePasswordRequest,
  ProfileCompletionResponse,
  RenameResumeRequest,
  LeetCodeSyncResponse,
} from "./types";
import { useAuthStore } from "@/features/auth/authStore";

/**
 * Helper: Extracts user profile from response payload and syncs with storage + Zustand store
 */
function syncUserFromResponse(data: unknown): UserProfile | null {
  if (!data) return null;
  const raw = data as Record<string, unknown>;
  const profileUser = (raw.user || raw.student || raw.profile || raw.data || raw) as UserProfile;

  if (profileUser && (profileUser.email || profileUser.name || profileUser.id || profileUser._id)) {
    storageService.setUser(profileUser);
    useAuthStore.getState().setUser(profileUser);
    logger.info("PROFILE_API", "Profile synchronized to local storage and auth store", {
      userId: profileUser.id || profileUser._id,
      email: profileUser.email,
    });
    return profileUser;
  }
  return null;
}

export const profileApi = {
  /**
   * 1. Fetch current user's complete profile
   * Endpoint: GET /api/profile/ (with fallback to /api/auth/me)
   */
  async getProfile(): Promise<ApiResponse<UserProfileResponse>> {
    logger.info("PROFILE_API", `Fetching profile from ${API_CONFIG.ENDPOINTS.PROFILE.BASE}`);

    try {
      const response = await apiClient.get<UserProfileResponse>(API_CONFIG.ENDPOINTS.PROFILE.BASE);
      if (response.data) {
        syncUserFromResponse(response.data);
      }
      return response;
    } catch (err) {
      logger.warn("PROFILE_API", "GET /api/profile/ failed, falling back to /api/auth/me", err);
      const fallbackResponse = await apiClient.get<UserProfileResponse>(API_CONFIG.ENDPOINTS.AUTH.ME);
      if (fallbackResponse.data) {
        syncUserFromResponse(fallbackResponse.data);
      }
      return fallbackResponse;
    }
  },

  /**
   * 2. Update core profile details
   * Endpoint: PATCH /api/profile/
   */
  async updateProfile(data: UpdateProfileRequest): Promise<ApiResponse<UserProfileResponse>> {
    logger.info("PROFILE_API", "Updating core profile details", { keys: Object.keys(data) });
    const response = await apiClient.patch<UserProfileResponse>(API_CONFIG.ENDPOINTS.PROFILE.BASE, data);
    if (response.data) {
      syncUserFromResponse(response.data);
    }
    return response;
  },

  /**
   * 3. Fetch public/peer profile by userId
   * Endpoint: GET /api/profile/:userId
   */
  async getProfileById(userId: string): Promise<ApiResponse<UserProfileResponse>> {
    logger.info("PROFILE_API", `Fetching public profile for user: ${userId}`);
    return apiClient.get<UserProfileResponse>(API_CONFIG.ENDPOINTS.PROFILE.BY_ID(userId));
  },

  /**
   * 4. Fetch profile completion status & score
   * Endpoint: GET /api/profile/completion
   */
  async getCompletion(): Promise<ApiResponse<ProfileCompletionResponse>> {
    logger.info("PROFILE_API", "Fetching profile completion metrics");
    return apiClient.get<ProfileCompletionResponse>(API_CONFIG.ENDPOINTS.PROFILE.COMPLETION);
  },

  /**
   * 5. Update contact details
   * Endpoint: PATCH /api/profile/contact
   */
  async updateContact(data: UpdateContactRequest): Promise<ApiResponse<UserProfileResponse>> {
    logger.info("PROFILE_API", "Updating profile contact details");
    const response = await apiClient.patch<UserProfileResponse>(API_CONFIG.ENDPOINTS.PROFILE.CONTACT, data);
    if (response.data) {
      syncUserFromResponse(response.data);
    }
    return response;
  },

  /**
   * 6. Update education details
   * Endpoint: PATCH /api/profile/education
   */
  async updateEducation(data: UpdateEducationRequest): Promise<ApiResponse<UserProfileResponse>> {
    logger.info("PROFILE_API", "Updating profile education details");
    const response = await apiClient.patch<UserProfileResponse>(API_CONFIG.ENDPOINTS.PROFILE.EDUCATION, data);
    if (response.data) {
      syncUserFromResponse(response.data);
    }
    return response;
  },

  /**
   * 7. Delete profile avatar image
   * Endpoint: DELETE /api/profile/image
   */
  async deleteImage(): Promise<ApiResponse<UserProfileResponse>> {
    logger.info("PROFILE_API", "Deleting profile avatar image");
    const response = await apiClient.delete<UserProfileResponse>(API_CONFIG.ENDPOINTS.PROFILE.IMAGE);
    if (response.data) {
      syncUserFromResponse(response.data);
    }
    return response;
  },

  /**
   * 8. Upload profile avatar image (multipart/form-data)
   * Endpoint: POST /api/profile/image
   */
  async uploadImage(formData: FormData): Promise<ApiResponse<UserProfileResponse>> {
    logger.info("PROFILE_API", "Uploading profile avatar image");
    const response = await apiClient.upload<UserProfileResponse>(
      API_CONFIG.ENDPOINTS.PROFILE.IMAGE,
      formData
    );
    if (response.data) {
      syncUserFromResponse(response.data);
    }
    return response;
  },

  /**
   * 9. Change password
   * Endpoint: POST /api/profile/password
   */
  async changePassword(data: ChangePasswordRequest): Promise<ApiResponse<{ message: string }>> {
    logger.info("PROFILE_API", "Submitting password change request");
    return apiClient.post<{ message: string }>(API_CONFIG.ENDPOINTS.PROFILE.PASSWORD, data);
  },

  /**
   * 10. Update professional details (skills, coding links, objective)
   * Endpoint: PATCH /api/profile/professional
   */
  async updateProfessional(data: UpdateProfessionalRequest): Promise<ApiResponse<UserProfileResponse>> {
    logger.info("PROFILE_API", "Updating professional details and skills");
    const response = await apiClient.patch<UserProfileResponse>(
      API_CONFIG.ENDPOINTS.PROFILE.PROFESSIONAL,
      data
    );
    if (response.data) {
      syncUserFromResponse(response.data);
    }
    return response;
  },

  /**
   * 11. Upload resume (multipart/form-data)
   * Endpoint: POST /api/profile/resume
   */
  async uploadResume(formData: FormData): Promise<ApiResponse<UserProfileResponse>> {
    logger.info("PROFILE_API", "Uploading new resume");
    const response = await apiClient.upload<UserProfileResponse>(
      API_CONFIG.ENDPOINTS.PROFILE.RESUME,
      formData
    );
    if (response.data) {
      syncUserFromResponse(response.data);
    }
    return response;
  },

  /**
   * 12. Delete resume
   * Endpoint: DELETE /api/profile/resume/:resumeId
   */
  async deleteResume(resumeId: string): Promise<ApiResponse<UserProfileResponse>> {
    logger.info("PROFILE_API", `Deleting resume: ${resumeId}`);
    const response = await apiClient.delete<UserProfileResponse>(
      API_CONFIG.ENDPOINTS.PROFILE.RESUME_BY_ID(resumeId)
    );
    if (response.data) {
      syncUserFromResponse(response.data);
    }
    return response;
  },

  /**
   * 13. Set resume as primary
   * Endpoint: PATCH /api/profile/resume/:resumeId/primary
   */
  async setPrimaryResume(resumeId: string): Promise<ApiResponse<UserProfileResponse>> {
    logger.info("PROFILE_API", `Setting resume as primary: ${resumeId}`);
    const response = await apiClient.patch<UserProfileResponse>(
      API_CONFIG.ENDPOINTS.PROFILE.RESUME_PRIMARY(resumeId)
    );
    if (response.data) {
      syncUserFromResponse(response.data);
    }
    return response;
  },

  /**
   * 14. Rename resume title
   * Endpoint: PATCH /api/profile/resume/:resumeId/rename
   */
  async renameResume(resumeId: string, title: string): Promise<ApiResponse<UserProfileResponse>> {
    logger.info("PROFILE_API", `Renaming resume: ${resumeId} to "${title}"`);
    const payload: RenameResumeRequest = { title };
    const response = await apiClient.patch<UserProfileResponse>(
      API_CONFIG.ENDPOINTS.PROFILE.RESUME_RENAME(resumeId),
      payload
    );
    if (response.data) {
      syncUserFromResponse(response.data);
    }
    return response;
  },

  /**
   * 15. Trigger LeetCode stats sync
   * Endpoint: POST /api/profile/sync-leetcode
   */
  async syncLeetCode(): Promise<ApiResponse<LeetCodeSyncResponse>> {
    logger.info("PROFILE_API", "Triggering LeetCode stats synchronization");
    const response = await apiClient.post<LeetCodeSyncResponse>(
      API_CONFIG.ENDPOINTS.PROFILE.SYNC_LEETCODE
    );
    if (response.data) {
      syncUserFromResponse(response.data);
    }
    return response;
  },
};

export default profileApi;
