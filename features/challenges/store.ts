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
  DailyMaxRecord,
  Certificate,
  SolvedQuestion,
} from "./types";

interface ChallengeState {
  // State
  allChallenges: Challenge[];
  myChallenges: MyChallengeItem[];
  activeChallenge: Challenge | null;
  activeChallengeSolves: ChallengeDailySolve[];
  globalLeaderboard: LeaderboardEntry[];
  challengeLeaderboards: Record<string, LeaderboardEntry[]>;
  challengeDailyMax: Record<string, DailyMaxRecord[]>;
  selectedChallengeId: string | null;
  certificates: Certificate[];

  // Loading flags
  isLoadingChallenges: boolean;
  isLoadingMyChallenges: boolean;
  isLoadingDetails: boolean;
  isLoadingLeaderboard: boolean;
  isLoadingDailyMax: boolean;
  isLoadingCertificates: boolean;
  isJoining: boolean;
  error: string | null;

  // Actions
  fetchAllChallenges: (forceRefresh?: boolean) => Promise<void>;
  fetchMyChallenges: (forceRefresh?: boolean) => Promise<void>;
  fetchChallengeById: (id: string) => Promise<void>;
  fetchLeaderboard: (challengeId?: string) => Promise<void>;
  fetchChallengeDailyMax: (challengeId: string, batch?: string) => Promise<void>;
  setSelectedChallengeId: (challengeId: string | null) => void;
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
  challengeDailyMax: {},
  selectedChallengeId: null,
  certificates: [],

  isLoadingChallenges: false,
  isLoadingMyChallenges: false,
  isLoadingDetails: false,
  isLoadingLeaderboard: false,
  isLoadingDailyMax: false,
  isLoadingCertificates: false,
  isJoining: false,
  error: null,

  setSelectedChallengeId: (challengeId: string | null) => {
    set({ selectedChallengeId: challengeId });
  },

  fetchAllChallenges: async (_forceRefresh = false) => {
    set({ isLoadingChallenges: true, error: null });
    try {
      const response = await challengesApi.getAllChallenges();
      if (response.success && response.data) {
        const challenges =
          response.data.challenges ||
          (response.data as unknown as Challenge[]) ||
          [];
        set({ allChallenges: challenges, isLoadingChallenges: false });
        logger.info("CHALLENGE_STORE", `Loaded ${challenges.length} challenges`);
      } else {
        set({
          isLoadingChallenges: false,
          error: response.message || "Failed to load challenges",
        });
      }
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Error loading challenges";
      logger.error("CHALLENGE_STORE", "Failed to fetch all challenges", err);
      set({ isLoadingChallenges: false, error: errorMsg });
    }
  },

  fetchMyChallenges: async (_forceRefresh = false) => {
    set({ isLoadingMyChallenges: true, error: null });
    try {
      const response = await challengesApi.getMyChallenges();
      if (response.success && response.data) {
        const myChallenges =
          response.data.challenges ||
          (response.data as unknown as MyChallengeItem[]) ||
          [];
        set({ myChallenges, isLoadingMyChallenges: false });
        logger.info(
          "CHALLENGE_STORE",
          `Loaded ${myChallenges.length} student challenges`
        );
      } else {
        set({
          isLoadingMyChallenges: false,
          error: response.message || "Failed to load your challenges",
        });
      }
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Error loading student challenges";
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
      const errorMsg =
        err instanceof Error ? err.message : "Error loading challenge details";
      logger.error(
        "CHALLENGE_STORE",
        `Failed to fetch challenge details: ${id}`,
        err
      );
      set({ isLoadingDetails: false, error: errorMsg });
    }
  },

  fetchLeaderboard: async (challengeId?: string) => {
    set({ isLoadingLeaderboard: true, error: null });
    try {
      if (challengeId) {
        const response = await challengesApi.getChallengeLeaderboard(challengeId);
        if (response.success && response.data) {
          const rawList = Array.isArray(response.data)
            ? response.data
            : (response.data as { leaderboard?: LeaderboardEntry[] }).leaderboard || [];

          // Normalize entries with deep fallback extraction for nested user models
          const list: LeaderboardEntry[] = rawList.map((entry, idx) => {
            const raw = entry as unknown as Record<string, unknown>;
            const userObj =
              typeof raw.user === "object" && raw.user !== null
                ? (raw.user as Record<string, unknown>)
                : typeof raw.userId === "object" && raw.userId !== null
                ? (raw.userId as Record<string, unknown>)
                : null;

            const name =
              (userObj?.name as string) ||
              (raw.name as string) ||
              (raw.studentName as string) ||
              (raw.userName as string) ||
              (userObj?.leetcodeUsername as string) ||
              (raw.leetcodeUsername as string) ||
              (userObj?.username as string) ||
              (raw.username as string) ||
              ((userObj?.roll_no || raw.roll_no || raw.rollNo)
                ? `Student (${userObj?.roll_no || raw.roll_no || raw.rollNo})`
                : `Coder #${entry.rank ?? idx + 1}`);

            const roll_no =
              (userObj?.roll_no as string) ||
              (userObj?.rollNo as string) ||
              (raw.roll_no as string) ||
              (raw.rollNo as string) ||
              "";

            const previous =
              typeof raw.previous === "number"
                ? raw.previous
                : typeof raw.baselineSolved === "number"
                ? raw.baselineSolved
                : 0;

            const current =
              typeof raw.current === "number"
                ? raw.current
                : typeof raw.totalSolved === "number"
                ? raw.totalSolved
                : typeof raw.solvedCount === "number"
                ? raw.solvedCount
                : typeof raw.solved === "number"
                ? raw.solved
                : typeof userObj?.totalSolved === "number"
                ? (userObj.totalSolved as number)
                : 0;

            const increase =
              typeof raw.increase === "number"
                ? raw.increase
                : typeof raw.gainedSolved === "number"
                ? raw.gainedSolved
                : typeof raw.gained === "number"
                ? raw.gained
                : Math.max(0, current - previous);

            const score =
              typeof raw.score === "number"
                ? raw.score
                : typeof raw.points === "number"
                ? raw.points
                : increase * 10;

            return {
              rank: entry.rank ?? idx + 1,
              name,
              roll_no,
              challengeId: (raw.challengeId as string) || challengeId,
              previous,
              current,
              increase,
              score,
              pairName: (raw.pairName as string) || undefined,
              groupName: (raw.groupName as string) || undefined,
              dailyTotal: typeof raw.dailyTotal === "number" ? raw.dailyTotal : undefined,
              leetcodeUsername: (raw.leetcodeUsername as string) || (userObj?.leetcodeUsername as string) || undefined,
            };
          });

          // Filter out empty rows or placeholder entries
          const validList = list.filter((item) => {
            const hasScore = typeof item.score === "number" && item.score > 0;
            const hasSolved = typeof item.current === "number" && item.current > 0;
            const hasGained = typeof item.increase === "number" && item.increase > 0;
            const hasRealName = item.name && !item.name.startsWith("Coder #") && item.name !== "Student";
            return hasScore || hasSolved || hasGained || hasRealName;
          });

          set((state) => ({
            challengeLeaderboards: {
              ...state.challengeLeaderboards,
              [challengeId]: validList,
            },
            isLoadingLeaderboard: false,
          }));
          logger.info(
            "CHALLENGE_STORE",
            `Loaded challenge leaderboard for ${challengeId} with ${validList.length} verified entries`
          );
        } else {
          set((state) => ({
            challengeLeaderboards: {
              ...state.challengeLeaderboards,
              [challengeId]: [],
            },
            isLoadingLeaderboard: false,
          }));
        }
      } else {
        const response = await challengesApi.getGlobalLeaderboard();
        if (response.success && response.data) {
          const rawList = Array.isArray(response.data)
            ? response.data
            : (response.data as { leaderboard?: LeaderboardEntry[] }).leaderboard || [];

          const list: LeaderboardEntry[] = rawList.map((entry, idx) => {
            const raw = entry as unknown as Record<string, unknown>;
            const userObj =
              typeof raw.user === "object" && raw.user !== null
                ? (raw.user as Record<string, unknown>)
                : typeof raw.userId === "object" && raw.userId !== null
                ? (raw.userId as Record<string, unknown>)
                : null;

            const name =
              (userObj?.name as string) ||
              (raw.name as string) ||
              (raw.studentName as string) ||
              (raw.userName as string) ||
              (userObj?.leetcodeUsername as string) ||
              (raw.leetcodeUsername as string) ||
              (userObj?.username as string) ||
              (raw.username as string) ||
              ((userObj?.roll_no || raw.roll_no || raw.rollNo)
                ? `Student (${userObj?.roll_no || raw.roll_no || raw.rollNo})`
                : `Coder #${entry.rank ?? idx + 1}`);

            const roll_no =
              (userObj?.roll_no as string) ||
              (userObj?.rollNo as string) ||
              (raw.roll_no as string) ||
              (raw.rollNo as string) ||
              "";

            const previous =
              typeof raw.previous === "number"
                ? raw.previous
                : typeof raw.baselineSolved === "number"
                ? raw.baselineSolved
                : 0;

            const current =
              typeof raw.current === "number"
                ? raw.current
                : typeof raw.totalSolved === "number"
                ? raw.totalSolved
                : typeof raw.solvedCount === "number"
                ? raw.solvedCount
                : typeof raw.solved === "number"
                ? raw.solved
                : typeof userObj?.totalSolved === "number"
                ? (userObj.totalSolved as number)
                : 0;

            const increase =
              typeof raw.increase === "number"
                ? raw.increase
                : typeof raw.gainedSolved === "number"
                ? raw.gainedSolved
                : typeof raw.gained === "number"
                ? raw.gained
                : Math.max(0, current - previous);

            const score =
              typeof raw.score === "number"
                ? raw.score
                : typeof raw.points === "number"
                ? raw.points
                : increase * 10;

            return {
              rank: entry.rank ?? idx + 1,
              name,
              roll_no,
              challengeId: raw.challengeId as string,
              previous,
              current,
              increase,
              score,
              pairName: (raw.pairName as string) || undefined,
              groupName: (raw.groupName as string) || undefined,
              dailyTotal: typeof raw.dailyTotal === "number" ? raw.dailyTotal : undefined,
              leetcodeUsername: (raw.leetcodeUsername as string) || (userObj?.leetcodeUsername as string) || undefined,
            };
          });

          // Filter out empty rows or placeholder entries
          const validGlobalList = list.filter((item) => {
            const hasScore = typeof item.score === "number" && item.score > 0;
            const hasSolved = typeof item.current === "number" && item.current > 0;
            const hasGained = typeof item.increase === "number" && item.increase > 0;
            const hasRealName = item.name && !item.name.startsWith("Coder #") && item.name !== "Student";
            return hasScore || hasSolved || hasGained || hasRealName;
          });

          set({ globalLeaderboard: validGlobalList, isLoadingLeaderboard: false });
          logger.info(
            "CHALLENGE_STORE",
            `Loaded global leaderboard with ${validGlobalList.length} verified entries`
          );
        } else {
          set({ globalLeaderboard: [], isLoadingLeaderboard: false });
        }
      }
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Error loading leaderboard";
      logger.error("CHALLENGE_STORE", "Failed to fetch leaderboard", err);
      set({ isLoadingLeaderboard: false, error: errorMsg });
    }
  },

  fetchChallengeDailyMax: async (challengeId: string, batch: string = "OVERALL") => {
    if (!challengeId || typeof challengeId !== "string" || challengeId.trim().length === 0) {
      set({ isLoadingDailyMax: false });
      return;
    }
    set({ isLoadingDailyMax: true, error: null });
    try {
      const response = await challengesApi.getChallengeDailyMax(challengeId, batch);
      if (response && response.success && response.data) {
        let rawRecords: unknown[] = [];
        if (Array.isArray(response.data)) {
          rawRecords = response.data;
        } else if (response.data.dailyMax && Array.isArray(response.data.dailyMax)) {
          rawRecords = response.data.dailyMax;
        } else if (response.data.daily_max && Array.isArray(response.data.daily_max)) {
          rawRecords = response.data.daily_max;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          rawRecords = response.data.data;
        }

        const normalized: DailyMaxRecord[] = [];

        for (const item of rawRecords) {
          const r = item as Record<string, unknown>;
          const date =
            (r.date as string) ||
            (r.dateStr as string) ||
            (r._id && typeof r._id === "object" ? ((r._id as Record<string, unknown>).date as string) : "") ||
            (typeof r._id === "string" && r._id.length <= 12 ? r._id : "") ||
            new Date().toISOString();

          const questions = Array.isArray(r.questions)
            ? (r.questions as SolvedQuestion[])
            : Array.isArray(r.solvedQuestions)
            ? (r.solvedQuestions as SolvedQuestion[])
            : Array.isArray(r.problemList)
            ? (r.problemList as SolvedQuestion[])
            : [];

          const maxCount =
            typeof r.maxCount === "number" && r.maxCount > 0
              ? r.maxCount
              : typeof r.dailySolveCount === "number" && r.dailySolveCount > 0
              ? r.dailySolveCount
              : typeof r.count === "number" && r.count > 0
              ? r.count
              : typeof r.solves === "number" && r.solves > 0
              ? r.solves
              : typeof r.solvedCount === "number" && r.solvedCount > 0
              ? r.solvedCount
              : typeof r.totalSolved === "number" && r.totalSolved > 0
              ? r.totalSolved
              : questions.length > 0
              ? questions.length
              : 0;

          if (Array.isArray(r.students) && r.students.length > 0) {
            for (const st of r.students as Array<Record<string, unknown>>) {
              const stName =
                (st.name as string) ||
                (st.studentName as string) ||
                (st.leetcodeUsername as string) ||
                (st.username as string) ||
                "Student";
              const stRoll = (st.roll_no as string) || (st.rollNo as string) || "";
              const stLeetcode = (st.leetcodeUsername as string) || (st.username as string) || "";
              const stCount = typeof st.count === "number" && st.count > 0 ? st.count : maxCount;

              normalized.push({
                user: {
                  _id: (st._id as string) || (st.id as string) || "",
                  name: stName,
                  email: (st.email as string) || "",
                  roll_no: stRoll,
                },
                leetcodeUsername: stLeetcode,
                date,
                dailySolveCount: stCount,
                questions,
              });
            }
          } else {
            const rawUser =
              (typeof r.user === "object" && r.user !== null ? (r.user as Record<string, unknown>) : null) ||
              (typeof r.topUser === "object" && r.topUser !== null ? (r.topUser as Record<string, unknown>) : null) ||
              (typeof r.student === "object" && r.student !== null ? (r.student as Record<string, unknown>) : null) ||
              (typeof r.userId === "object" && r.userId !== null ? (r.userId as Record<string, unknown>) : null);

            const studentName =
              (rawUser?.name as string) ||
              (rawUser?.studentName as string) ||
              (r.studentName as string) ||
              (r.name as string) ||
              (typeof r.user === "string" && !r.user.match(/^[0-9a-fA-F]{24}$/) ? r.user : "") ||
              (rawUser?.leetcodeUsername as string) ||
              (r.leetcodeUsername as string) ||
              (rawUser?.username as string) ||
              (r.username as string) ||
              ((rawUser?.roll_no || rawUser?.rollNo || r.roll_no || r.rollNo)
                ? `Student (${rawUser?.roll_no || rawUser?.rollNo || r.roll_no || r.rollNo})`
                : "Student");

            const rollNo =
              (rawUser?.roll_no as string) ||
              (rawUser?.rollNo as string) ||
              (r.roll_no as string) ||
              (r.rollNo as string) ||
              "";

            const userObj = {
              _id: (rawUser?._id as string) || (rawUser?.id as string) || (typeof r.user === "string" ? r.user : "") || "",
              name: studentName,
              email: (rawUser?.email as string) || (r.email as string) || "",
              roll_no: rollNo,
            };

            const leetcodeUsername =
              (r.leetcodeUsername as string) ||
              (rawUser?.leetcodeUsername as string) ||
              (r.username as string) ||
              (rawUser?.username as string) ||
              "";

            const dailySolveCount =
              maxCount > 0
                ? maxCount
                : typeof (rawUser as Record<string, unknown>)?.dailySolveCount === "number" &&
                  ((rawUser as Record<string, unknown>).dailySolveCount as number) > 0
                ? ((rawUser as Record<string, unknown>).dailySolveCount as number)
                : typeof r.dailySolveCount === "number"
                ? r.dailySolveCount
                : 0;

            normalized.push({
              user: userObj,
              leetcodeUsername,
              date,
              dailySolveCount,
              questions,
            });
          }
        }

        // Filter out records where no actual solves occurred (dailySolveCount <= 0)
        const validRecords = normalized.filter((r) => r.dailySolveCount > 0);

        set((state) => ({
          challengeDailyMax: {
            ...state.challengeDailyMax,
            [challengeId]: validRecords,
          },
          isLoadingDailyMax: false,
        }));
        logger.info(
          "CHALLENGE_STORE",
          `Loaded ${validRecords.length} verified daily-max solver records for challenge: ${challengeId}`
        );
      } else {
        set((state) => ({
          challengeDailyMax: {
            ...state.challengeDailyMax,
            [challengeId]: [],
          },
          isLoadingDailyMax: false,
        }));
      }
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Error loading daily max solvers";
      logger.error(
        "CHALLENGE_STORE",
        `Failed to fetch daily-max for challenge: ${challengeId}`,
        err
      );
      set((state) => ({
        challengeDailyMax: {
          ...state.challengeDailyMax,
          [challengeId]: [],
        },
        isLoadingDailyMax: false,
        error: errorMsg,
      }));
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
