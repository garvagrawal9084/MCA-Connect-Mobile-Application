/**
 * SCIS Connect Mobile - Challenges & Certificates React Hooks
 * Clean custom hooks to bind challenge state and actions directly to UI components.
 */

import { useEffect, useCallback } from "react";
import { useChallengeStore } from "./store";

export const useChallenges = (autoFetch: boolean = true) => {
  const allChallenges = useChallengeStore((state) => state.allChallenges);
  const isLoading = useChallengeStore((state) => state.isLoadingChallenges);
  const error = useChallengeStore((state) => state.error);
  const fetchAllChallenges = useChallengeStore((state) => state.fetchAllChallenges);

  useEffect(() => {
    if (autoFetch && allChallenges.length === 0 && !isLoading) {
      fetchAllChallenges();
    }
  }, [autoFetch, allChallenges.length, isLoading, fetchAllChallenges]);

  const refresh = useCallback(() => {
    return fetchAllChallenges(true);
  }, [fetchAllChallenges]);

  return {
    challenges: allChallenges,
    isLoading,
    error,
    refresh,
  };
};

export const useMyChallenges = (autoFetch: boolean = true) => {
  const myChallenges = useChallengeStore((state) => state.myChallenges);
  const isLoading = useChallengeStore((state) => state.isLoadingMyChallenges);
  const error = useChallengeStore((state) => state.error);
  const fetchMyChallenges = useChallengeStore((state) => state.fetchMyChallenges);
  const joinChallenge = useChallengeStore((state) => state.joinChallenge);
  const leaveChallenge = useChallengeStore((state) => state.leaveChallenge);
  const isJoining = useChallengeStore((state) => state.isJoining);

  useEffect(() => {
    if (autoFetch && myChallenges.length === 0 && !isLoading) {
      fetchMyChallenges();
    }
  }, [autoFetch, myChallenges.length, isLoading, fetchMyChallenges]);

  const refresh = useCallback(() => {
    return fetchMyChallenges(true);
  }, [fetchMyChallenges]);

  return {
    myChallenges,
    isLoading,
    isJoining,
    error,
    refresh,
    joinChallenge,
    leaveChallenge,
  };
};

export const useChallengeDetails = (id?: string) => {
  const activeChallenge = useChallengeStore((state) => state.activeChallenge);
  const activeChallengeSolves = useChallengeStore((state) => state.activeChallengeSolves);
  const isLoading = useChallengeStore((state) => state.isLoadingDetails);
  const error = useChallengeStore((state) => state.error);
  const fetchChallengeById = useChallengeStore((state) => state.fetchChallengeById);
  const clearActiveChallenge = useChallengeStore((state) => state.clearActiveChallenge);

  useEffect(() => {
    if (id) {
      fetchChallengeById(id);
    }
    return () => {
      clearActiveChallenge();
    };
  }, [id, fetchChallengeById, clearActiveChallenge]);

  const refresh = useCallback(() => {
    if (id) {
      return fetchChallengeById(id);
    }
    return Promise.resolve();
  }, [id, fetchChallengeById]);

  return {
    challenge: activeChallenge,
    solves: activeChallengeSolves,
    isLoading,
    error,
    refresh,
  };
};

export const useLeaderboard = (challengeId?: string, autoFetch: boolean = true) => {
  const globalLeaderboard = useChallengeStore((state) => state.globalLeaderboard);
  const challengeLeaderboards = useChallengeStore((state) => state.challengeLeaderboards);
  const isLoading = useChallengeStore((state) => state.isLoadingLeaderboard);
  const error = useChallengeStore((state) => state.error);
  const fetchLeaderboard = useChallengeStore((state) => state.fetchLeaderboard);

  const leaderboard = challengeId
    ? challengeLeaderboards[challengeId] || []
    : globalLeaderboard;

  useEffect(() => {
    if (autoFetch) {
      fetchLeaderboard(challengeId);
    }
  }, [autoFetch, challengeId, fetchLeaderboard]);

  const refresh = useCallback(() => {
    return fetchLeaderboard(challengeId);
  }, [challengeId, fetchLeaderboard]);

  return {
    leaderboard,
    isLoading,
    error,
    refresh,
  };
};

export const useChallengeDailyMax = (
  challengeId?: string,
  autoFetch: boolean = true,
  batch: string = "OVERALL"
) => {
  const challengeDailyMax = useChallengeStore(
    (state) => state.challengeDailyMax
  );
  const isLoading = useChallengeStore((state) => state.isLoadingDailyMax);
  const error = useChallengeStore((state) => state.error);
  const fetchChallengeDailyMax = useChallengeStore(
    (state) => state.fetchChallengeDailyMax
  );

  const records = challengeId ? challengeDailyMax[challengeId] || [] : [];

  useEffect(() => {
    if (autoFetch && challengeId) {
      fetchChallengeDailyMax(challengeId, batch);
    }
  }, [autoFetch, challengeId, batch, fetchChallengeDailyMax]);

  const refresh = useCallback(() => {
    if (challengeId) {
      return fetchChallengeDailyMax(challengeId, batch);
    }
    return Promise.resolve();
  }, [challengeId, batch, fetchChallengeDailyMax]);

  return {
    dailyMaxRecords: records,
    isLoading,
    error,
    refresh,
  };
};

export const useCertificates = (autoFetch: boolean = true) => {
  const certificates = useChallengeStore((state) => state.certificates);
  const isLoading = useChallengeStore((state) => state.isLoadingCertificates);
  const error = useChallengeStore((state) => state.error);
  const fetchCertificates = useChallengeStore((state) => state.fetchCertificates);

  useEffect(() => {
    if (autoFetch && certificates.length === 0 && !isLoading) {
      fetchCertificates();
    }
  }, [autoFetch, certificates.length, isLoading, fetchCertificates]);

  const refresh = useCallback(() => {
    return fetchCertificates();
  }, [fetchCertificates]);

  return {
    certificates,
    isLoading,
    error,
    refresh,
  };
};
