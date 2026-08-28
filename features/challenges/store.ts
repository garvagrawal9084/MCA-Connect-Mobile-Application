/**
 * SCIS Connect Mobile - Challenges & Certificates Zustand Store
 * Manages client state, caching, active challenges, leaderboards, and certificate collections.
 */

import { create } from "zustand";
import { logger } from "@/utils/logger";
import { challengesApi, certificatesApi } from "./api";
import {
  Challenge,
  MyChallengeItem,
  ChallengeDailySolve,
  LeaderboardEntry,
  Certificate,
} from "./types";

interface ChallengeState {
  // State
  allChallenges: Challenge[];
  myChallenges: MyChallengeItem[];
  activeChallenge: Challenge | null;
  activeChallengeSolves: ChallengeDailySolve[];
  globalLeaderboard: LeaderboardEntry[];
  challengeLeaderboards: Record<string, LeaderboardEntry[]>;
  certificates: Certificate[];

  // Loading flags
  isLoadingChallenges: boolean;
  isLoadingMyChallenges: boolean;
  isLoadingDetails: boolean;
  isLoadingLeaderboard: boolean;
  isLoadingCertificates: boolean;
  isJoining: boolean;
  error: string | null;

  // Actions
  fetchAllChallenges: (forceRefresh?: boolean) => Promise<void>;
  fetchMyChallenges: (forceRefresh?: boolean) => Promise<void>;
  fetchChallengeById: (id: string) => Promise<void>;
  fetchLeaderboard: (challengeId?: string) => Promise<void>;
  fetchCertificates: () => Promise<void>;
  joinChallenge: (challengeId: string, userId?: string) => Promise<boolean>;
  leaveChallenge: (challengeId: string, userId?: string) => Promise<boolean>;
  clearActiveChallenge: () => void;
  clearError: () => void;
}

export const useChallengeStore = create<ChallengeState>((set, get) => ({
  allChallenges: [],
  myChallenges: [],
  activeChallenge: null,
  activeChallengeSolves: [],
  globalLeaderboard: [],
  challengeLeaderboards: {},
  certificates: [],

  isLoadingChallenges: false,
  isLoadingMyChallenges: false,
  isLoadingDetails: false,
  isLoadingLeaderboard: false,
  isLoadingCertificates: false,
  isJoining: false,
  error: null,

  fetchAllChallenges: async (_forceRefresh = false) => {
    set({ isLoadingChallenges: true, error: null });
    try {
      const response = await challengesApi.getAllChallenges();
      if (response.success && response.data) {
        const challenges = response.data.challenges || (response.data as unknown as Challenge[]) || [];
        set({ allChallenges: challenges, isLoadingChallenges: false });
        logger.info("CHALLENGE_STORE", `Loaded ${challenges.length} challenges`);
      } else {
        set({
          isLoadingChallenges: false,
          error: response.message || "Failed to load challenges",
        });
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Error loading challenges";
      logger.error("CHALLENGE_STORE", "Failed to fetch all challenges", err);
      set({ isLoadingChallenges: false, error: errorMsg });
    }
  },

  fetchMyChallenges: async (_forceRefresh = false) => {
    set({ isLoadingMyChallenges: true, error: null });
    try {
      const response = await challengesApi.getMyChallenges();
      if (response.success && response.data) {
        const myChallenges = response.data.challenges || (response.data as unknown as MyChallengeItem[]) || [];
        set({ myChallenges, isLoadingMyChallenges: false });
        logger.info("CHALLENGE_STORE", `Loaded ${myChallenges.length} student challenges`);
      } else {
        set({
          isLoadingMyChallenges: false,
          error: response.message || "Failed to load your challenges",
        });
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Error loading student challenges";
      logger.error("CHALLENGE_STORE", "Failed to fetch student challenges", err);
      set({ isLoadingMyChallenges: false, error: errorMsg });
    }
  },

  fetchChallengeById: async (id: string) => {
    set({ isLoadingDetails: true, error: null });
    try {
      const response = await challengesApi.getChallengeById(id);
      if (response.success && response.data) {
        set({
          activeChallenge: response.data.challenge,
          activeChallengeSolves: response.data.solves || [],
          isLoadingDetails: false,
        });
        logger.info("CHALLENGE_STORE", `Loaded challenge details for: ${id}`);
      } else {
        set({
          isLoadingDetails: false,
          error: response.message || "Failed to load challenge details",
        });
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Error loading challenge details";
      logger.error("CHALLENGE_STORE", `Failed to fetch challenge details: ${id}`, err);
      set({ isLoadingDetails: false, error: errorMsg });
    }
  },

  fetchLeaderboard: async (challengeId?: string) => {
    set({ isLoadingLeaderboard: true, error: null });
    try {
      if (challengeId) {
        const response = await challengesApi.getChallengeLeaderboard(challengeId);
        if (response.success && response.data) {
          const list = response.data.leaderboard || [];
          set((state) => ({
            challengeLeaderboards: {
              ...state.challengeLeaderboards,
              [challengeId]: list,
            },
            isLoadingLeaderboard: false,
          }));
          logger.info("CHALLENGE_STORE", `Loaded challenge leaderboard for ${challengeId}`);
        } else {
          set({ isLoadingLeaderboard: false });
        }
      } else {
        const response = await challengesApi.getGlobalLeaderboard();
        if (response.success && response.data) {
          const list = response.data.leaderboard || [];
          set({ globalLeaderboard: list, isLoadingLeaderboard: false });
          logger.info("CHALLENGE_STORE", `Loaded global leaderboard with ${list.length} entries`);
        } else {
          set({ isLoadingLeaderboard: false });
        }
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Error loading leaderboard";
      logger.error("CHALLENGE_STORE", "Failed to fetch leaderboard", err);
      set({ isLoadingLeaderboard: false, error: errorMsg });
    }
  },

  fetchCertificates: async () => {
    set({ isLoadingCertificates: true, error: null });
    try {
      const response = await certificatesApi.getMyCertificates();
      if (response.success && response.data) {
        const certList = Array.isArray(response.data)
          ? response.data
          : (response.data as { certificates?: Certificate[] }).certificates || [];
        set({ certificates: certList, isLoadingCertificates: false });
        logger.info("CHALLENGE_STORE", `Loaded ${certList.length} certificates`);
      } else {
        set({
          isLoadingCertificates: false,
          error: response.message || "Failed to load certificates",
        });
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Error loading certificates";
      logger.error("CHALLENGE_STORE", "Failed to fetch certificates", err);
      set({ isLoadingCertificates: false, error: errorMsg });
    }
  },

  joinChallenge: async (challengeId: string, userId?: string) => {
    set({ isJoining: true, error: null });
    try {
      const response = await challengesApi.joinChallenge(challengeId, userId);
      if (response.success) {
        logger.info("CHALLENGE_STORE", `Successfully joined challenge: ${challengeId}`);
        // Refresh enrolled challenges
        await get().fetchMyChallenges(true);
        set({ isJoining: false });
        return true;
      }
      set({
        isJoining: false,
        error: response.message || "Failed to join challenge",
      });
      return false;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Error joining challenge";
      logger.error("CHALLENGE_STORE", `Failed to join challenge: ${challengeId}`, err);
      set({ isJoining: false, error: errorMsg });
      return false;
    }
  },

  leaveChallenge: async (challengeId: string, userId?: string) => {
    set({ isJoining: true, error: null });
    try {
      const response = await challengesApi.leaveChallenge(challengeId, userId);
      if (response.success) {
        logger.info("CHALLENGE_STORE", `Successfully left challenge: ${challengeId}`);
        await get().fetchMyChallenges(true);
        set({ isJoining: false });
        return true;
      }
      set({
        isJoining: false,
        error: response.message || "Failed to leave challenge",
      });
      return false;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Error leaving challenge";
      logger.error("CHALLENGE_STORE", `Failed to leave challenge: ${challengeId}`, err);
      set({ isJoining: false, error: errorMsg });
      return false;
    }
  },

  clearActiveChallenge: () => {
    set({ activeChallenge: null, activeChallengeSolves: [] });
  },

  clearError: () => {
    set({ error: null });
  },
}));
