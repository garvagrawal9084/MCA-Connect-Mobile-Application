/**
 * SCIS Connect Mobile - Profile React Hooks
 * Provides clean state management, pull-to-refresh, and fallback handling for student profiles.
 * Adheres strictly to the architectural standards in app/AGENTS.md.
 */

import { useState, useEffect, useCallback } from "react";
import * as Haptics from "expo-haptics";
import { profileApi } from "./api";
import { UserProfile, DUMMY_PROFILE_DATA } from "./types";
import { useAuthStore } from "@/features/auth/authStore";
import { logger } from "@/utils/logger";

export function useProfile() {
  const authUser = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Initialize with active authUser or null
  const [profile, setProfile] = useState<UserProfile | null>(authUser || null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sync when authStore user changes
  useEffect(() => {
    if (authUser) {
      setProfile(authUser);
    }
  }, [authUser]);

  /**
   * Fetch profile from /api/auth/me
   */
  const fetchProfile = useCallback(async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
    }
    setError(null);

    try {
      logger.info("PROFILE_HOOK", "Initiating profile fetch from /api/auth/me...");
      const response = await profileApi.getProfile();
      if (response.data?.user) {
        setProfile(response.data.user);
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
   * Pull-to-refresh handler
   */
  const refreshProfile = useCallback(async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchProfile(true);
  }, [fetchProfile]);

  // Initial load on mount if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
    }
  }, [isAuthenticated, fetchProfile]);

  return {
    profile,
    isLoading,
    isRefreshing,
    error,
    fetchProfile,
    refreshProfile,
    isUsingDummyFallback: !authUser && !profile?.id,
  };
}

export default useProfile;
