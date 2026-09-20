/**
 * SCIS Connect Mobile - Profile React Hooks
 * Provides clean state management, pull-to-refresh, mutations, and fallback handling for student profiles.
 * Adheres strictly to the architectural standards in app/AGENTS.md.
 */

import { useState, useEffect, useCallback } from "react";
import * as Haptics from "expo-haptics";
import { profileApi } from "./api";
import {
  UserProfile,
  UpdateProfileRequest,
  UpdateContactRequest,
  UpdateEducationRequest,
  UpdateProfessionalRequest,
  ChangePasswordRequest,
  ProfileCompletionResponse,
} from "./types";
import { useAuthStore } from "@/features/auth/authStore";
import { logger } from "@/utils/logger";

export function useProfile() {
  const authUser = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Initialize with active authUser or null
  const [profile, setProfile] = useState<UserProfile | null>(authUser || null);
  const [completion, setCompletion] = useState<ProfileCompletionResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sync when authStore user changes
  useEffect(() => {
    if (authUser) {
      setProfile(authUser);
    }
  }, [authUser]);

  /**
   * Fetch profile from /api/profile/ (or fallback /api/auth/me)
   */
  const fetchProfile = useCallback(async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
    }
    setError(null);

    try {
      logger.info("PROFILE_HOOK", "Initiating profile fetch...");
      const response = await profileApi.getProfile();
      if (response.data) {
        const raw = response.data as Record<string, unknown>;
        const userObj = (raw.user || raw.student || raw.profile || raw.data || raw) as UserProfile;
        if (userObj && (userObj.name || userObj.email || userObj.id || userObj._id)) {
          setProfile(userObj);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load profile data";
      logger.warn("PROFILE_HOOK", "Could not fetch profile from server", err);
      setError(msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  /**
   * Fetch profile completion status
   */
  const fetchCompletion = useCallback(async () => {
    try {
      const response = await profileApi.getCompletion();
      if (response.data) {
        setCompletion(response.data);
      }
    } catch (err: unknown) {
      logger.warn("PROFILE_HOOK", "Could not fetch completion metrics", err);
    }
  }, []);

  /**
   * Pull-to-refresh handler
   */
  const refreshProfile = useCallback(async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Promise.all([fetchProfile(true), fetchCompletion()]);
  }, [fetchProfile, fetchCompletion]);

  /**
   * Generic mutation wrapper with error handling and Haptics
   */
  const executeMutation = useCallback(
    async <T>(action: () => Promise<T>, successMessage: string): Promise<boolean> => {
      setIsUpdating(true);
      setError(null);
      try {
        await action();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        logger.info("PROFILE_HOOK", successMessage);
        return true;
      } catch (err: unknown) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        const msg = err instanceof Error ? err.message : "Profile update failed";
        logger.error("PROFILE_HOOK", msg, err);
        setError(msg);
        return false;
      } finally {
        setIsUpdating(false);
      }
    },
    []
  );

  /**
   * Mutations for all profile update operations
   */
  const updateProfile = useCallback(
    (data: UpdateProfileRequest) =>
      executeMutation(() => profileApi.updateProfile(data), "Core profile updated successfully"),
    [executeMutation]
  );

  const updateContact = useCallback(
    (data: UpdateContactRequest) =>
      executeMutation(() => profileApi.updateContact(data), "Contact details updated successfully"),
    [executeMutation]
  );

  const updateEducation = useCallback(
    (data: UpdateEducationRequest) =>
      executeMutation(() => profileApi.updateEducation(data), "Education details updated successfully"),
    [executeMutation]
  );

  const updateProfessional = useCallback(
    (data: UpdateProfessionalRequest) =>
      executeMutation(
        () => profileApi.updateProfessional(data),
        "Professional details updated successfully"
      ),
    [executeMutation]
  );

  const uploadImage = useCallback(
    (formData: FormData) =>
      executeMutation(() => profileApi.uploadImage(formData), "Profile avatar uploaded successfully"),
    [executeMutation]
  );

  const deleteImage = useCallback(
    () =>
      executeMutation(() => profileApi.deleteImage(), "Profile avatar deleted successfully"),
    [executeMutation]
  );

  const changePassword = useCallback(
    (data: ChangePasswordRequest) =>
      executeMutation(() => profileApi.changePassword(data), "Password changed successfully"),
    [executeMutation]
  );

  const uploadResume = useCallback(
    (formData: FormData) =>
      executeMutation(() => profileApi.uploadResume(formData), "Resume uploaded successfully"),
    [executeMutation]
  );

  const deleteResume = useCallback(
    (resumeId: string) =>
      executeMutation(() => profileApi.deleteResume(resumeId), `Resume ${resumeId} deleted`),
    [executeMutation]
  );

  const setPrimaryResume = useCallback(
    (resumeId: string) =>
      executeMutation(() => profileApi.setPrimaryResume(resumeId), `Resume ${resumeId} set as primary`),
    [executeMutation]
  );

  const renameResume = useCallback(
    (resumeId: string, title: string) =>
      executeMutation(
        () => profileApi.renameResume(resumeId, title),
        `Resume ${resumeId} renamed to "${title}"`
      ),
    [executeMutation]
  );

  const syncLeetCode = useCallback(
    () =>
      executeMutation(() => profileApi.syncLeetCode(), "LeetCode stats synchronized successfully"),
    [executeMutation]
  );

  // Initial load on mount if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
      fetchCompletion();
    }
  }, [isAuthenticated, fetchProfile, fetchCompletion]);

  return {
    profile,
    completion,
    isLoading,
    isRefreshing,
    isUpdating,
    error,
    fetchProfile,
    fetchCompletion,
    refreshProfile,
    // Mutations
    updateProfile,
    updateContact,
    updateEducation,
    updateProfessional,
    uploadImage,
    deleteImage,
    changePassword,
    uploadResume,
    deleteResume,
    setPrimaryResume,
    renameResume,
    syncLeetCode,
  };
}

export default useProfile;
