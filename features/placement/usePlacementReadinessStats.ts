/**
 * SCIS Connect Mobile - Placement Studio Real-Time Readiness Stats Hook
 * Dynamically aggregates live metrics across Placement Drives, LeetCode / Challenges Solves,
 * Mock Test Assessments, and Activity Streaks directly from existing backend APIs.
 * Adheres strictly to the architectural standards in app/AGENTS.md.
 */

import { useEffect, useCallback, useMemo } from "react";
import { useAuthStore } from "@/features/auth/authStore";
import { usePlacementCenterStore } from "./store";
import { useChallengeStore } from "@/features/challenges/store";
import { useResultStore } from "@/features/results/store";
import { logger } from "@/utils/logger";

export interface PlacementReadinessStats {
  activeDrivesCount: number;
  solvedCount: number;
  readinessScore: number;
  streakDays: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

function toLocalDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Calculates consecutive active streak days from ISO date strings
 */
function calculateActivityStreak(dateStrings: string[]): number {
  if (!dateStrings.length) return 0;

  const uniqueDateSet = new Set<string>();
  for (const raw of dateStrings) {
    if (!raw) continue;
    try {
      const d = new Date(raw);
      if (!isNaN(d.getTime())) {
        uniqueDateSet.add(toLocalDateString(d));
      }
    } catch {
      // Ignore invalid date
    }
  }

  if (uniqueDateSet.size === 0) return 0;

  const sortedDates = Array.from(uniqueDateSet).sort().reverse();
  const now = new Date();
  const todayStr = toLocalDateString(now);
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = toLocalDateString(yesterdayDate);

  const mostRecent = sortedDates[0];
  // If the most recent active date is neither today nor yesterday, streak is broken
  if (mostRecent !== todayStr && mostRecent !== yesterdayStr) {
    return 0;
  }

  let streak = 0;
  const checkDate = new Date(
    parseInt(mostRecent.split("-")[0]),
    parseInt(mostRecent.split("-")[1]) - 1,
    parseInt(mostRecent.split("-")[2])
  );

  for (const dateStr of sortedDates) {
    const expectedStr = toLocalDateString(checkDate);
    if (dateStr === expectedStr) {
      streak += 1;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}


export function usePlacementReadinessStats(): PlacementReadinessStats {
  const user = useAuthStore((state) => state.user);

  // Placement store
  const dashboardStats = usePlacementCenterStore((state) => state.dashboardStats);
  const jobs = usePlacementCenterStore((state) => state.jobs);
  const totalJobsCount = usePlacementCenterStore((state) => state.totalJobsCount);
  const isLoadingJobs = usePlacementCenterStore((state) => state.isLoadingJobs);
  const isLoadingStats = usePlacementCenterStore((state) => state.isLoadingStats);
  const fetchDashboardStats = usePlacementCenterStore(
    (state) => state.fetchDashboardStats
  );
  const fetchJobs = usePlacementCenterStore((state) => state.fetchJobs);

  // Challenges store
  const myChallenges = useChallengeStore((state) => state.myChallenges);
  const activeChallengeSolves = useChallengeStore(
    (state) => state.activeChallengeSolves
  );
  const isLoadingMyChallenges = useChallengeStore(
    (state) => state.isLoadingMyChallenges
  );
  const fetchMyChallenges = useChallengeStore((state) => state.fetchMyChallenges);

  // Results & Assessments store
  const results = useResultStore((state) => state.results);
  const isLoadingResults = useResultStore((state) => state.isLoadingResults);
  const fetchMyResults = useResultStore((state) => state.fetchMyResults);

  // Fetch / synchronize all source data on mount
  useEffect(() => {
    fetchDashboardStats();
    fetchJobs();
    fetchMyChallenges().then(() => {
      const state = useChallengeStore.getState();
      const challengesList = state.myChallenges || [];
      challengesList.forEach((item) => {
        const cId = item.challenge?._id || item.challenge?.id;
        if (cId) {
          state.fetchChallengeById(cId);
        }
      });
    });
    fetchMyResults();
  }, [fetchDashboardStats, fetchJobs, fetchMyChallenges, fetchMyResults]);

  const refresh = useCallback(async () => {
    logger.info("PLACEMENT_STATS", "Refreshing Placement Studio readiness metrics");
    await Promise.allSettled([
      fetchDashboardStats(),
      fetchJobs(),
      fetchMyChallenges(true).then(async () => {
        const state = useChallengeStore.getState();
        const challengesList = state.myChallenges || [];
        await Promise.allSettled(
          challengesList.map((item) => {
            const cId = item.challenge?._id || item.challenge?.id;
            return cId ? state.fetchChallengeById(cId) : Promise.resolve();
          })
        );
      }),
      fetchMyResults(true),
    ]);
  }, [fetchDashboardStats, fetchJobs, fetchMyChallenges, fetchMyResults]);


  // 1. Calculate Active Drives Count
  const activeDrivesCount = useMemo(() => {
    if (typeof dashboardStats.openJobs === "number" && dashboardStats.openJobs > 0) {
      return dashboardStats.openJobs;
    }
    if (totalJobsCount > 0) {
      return totalJobsCount;
    }
    return jobs.length;
  }, [dashboardStats.openJobs, totalJobsCount, jobs.length]);

  // 2. Calculate Total Solved Questions
  const solvedCount = useMemo(() => {
    // 1. Direct LeetCode profile total solved count
    const leetcodeProfileSolved =
      user?.leetcode_profiles && user.leetcode_profiles.length > 0
        ? Math.max(...user.leetcode_profiles.map((p) => Number(p.totalSolved) || 0))
        : 0;

    // 2. SCIS coding sprint platform challenges (each record stores cumulative solve count at sync)
    const challengeMaxSolved =
      myChallenges.length > 0
        ? Math.max(...myChallenges.map((item) => Number(item.currentSolved) || 0))
        : 0;

    // Return the accurate verified total solved problems
    return Math.max(leetcodeProfileSolved, challengeMaxSolved);
  }, [user?.leetcode_profiles, myChallenges]);


  // 3. Calculate Dynamic Readiness Score (%)
  const readinessScore = useMemo(() => {
    let score = 0;

    // A. Profile & Resume Completeness (Up to 35%)
    const hasResume =
      Boolean(user?.resumeLink) || (user?.resumes && user.resumes.length > 0);
    if (hasResume) score += 10;

    const hasSkills =
      (user?.skills && user.skills.length > 0) ||
      (user?.professionalDetails?.technicalSkills &&
        user.professionalDetails.technicalSkills.length > 0);
    if (hasSkills) score += 10;

    const hasEducation =
      Boolean(user?.education?.graduation) ||
      Boolean(user?.education?.postGraduation) ||
      (user?.sgpa && user.sgpa.length > 0);
    if (hasEducation) score += 10;

    const hasCodingProfiles =
      (user?.leetcode_profiles && user.leetcode_profiles.length > 0) ||
      Boolean(user?.github) ||
      Boolean(user?.linkedin);
    if (hasCodingProfiles) score += 5;

    // B. Mock Tests & Assessments Performance (Up to 45%)
    if (results.length > 0) {
      const totalPercentage = results.reduce((sum, item) => {
        const itemPct =
          typeof item.percentage === "number"
            ? item.percentage
            : item.totalMarks > 0
            ? (item.obtainedMarks / item.totalMarks) * 100
            : 0;
        return sum + itemPct;
      }, 0);
      const avgPercentage = totalPercentage / results.length;
      score += Math.round((avgPercentage / 100) * 45);
    } else {
      // Baseline academic performance weight if no mock tests taken yet
      const graduationCgpa = user?.education?.graduation?.cgpa || 8.0;
      const baselineAcademic = Math.min(30, Math.round((graduationCgpa / 10) * 35));
      score += baselineAcademic;
    }

    // C. Coding Challenges & Practice (Up to 20%)
    if (myChallenges.length > 0) {
      score += 10;
    }
    if (solvedCount > 0) {
      const solvesMilestone = Math.min(10, Math.round((solvedCount / 50) * 10));
      score += solvesMilestone;
    }

    // Ensure score is safely bounded between 0 and 100
    return Math.min(100, Math.max(0, score));
  }, [user, results, myChallenges, solvedCount]);

  // 4. Calculate Streak Days
  const streakDays = useMemo(() => {
    // 1. If backend / LeetCode profile directly provides a verified streak number
    if (user?.leetcode_profiles && user.leetcode_profiles.length > 0) {
      for (const p of user.leetcode_profiles) {
        const directStreak = Number(p.streak ?? p.currentStreak);
        if (directStreak && directStreak > 0) {
          return directStreak;
        }
      }
    }


    // 2. Otherwise calculate consecutive active days from activity timestamps
    const activityDates: string[] = [];

    // Collect dates from challenge sync records
    for (const ch of myChallenges) {
      if (ch.lastSyncAt) activityDates.push(ch.lastSyncAt);
      if (ch.joinedAt) activityDates.push(ch.joinedAt);
    }

    for (const solve of activeChallengeSolves) {
      if (solve.date) activityDates.push(solve.date);
      if (solve.syncedAt) activityDates.push(solve.syncedAt);
    }

    // Collect dates from assessment results
    for (const res of results) {
      if (res.createdAt) activityDates.push(res.createdAt);
      if (res.publishedAt) activityDates.push(res.publishedAt);
    }

    // Collect dates from LeetCode profiles
    if (user?.leetcode_profiles) {
      for (const p of user.leetcode_profiles) {
        if (p.date) activityDates.push(p.date);
      }
    }

    const calculatedStreak = calculateActivityStreak(activityDates);

    // Fallback: If student has active enrolled challenges or solved problems, ensure minimum active status
    if (calculatedStreak === 0 && (myChallenges.length > 0 || solvedCount > 0)) {
      return 1;
    }

    return calculatedStreak;
  }, [user?.leetcode_profiles, myChallenges, activeChallengeSolves, results, solvedCount]);


  const isLoading =
    isLoadingJobs ||
    isLoadingStats ||
    isLoadingMyChallenges ||
    isLoadingResults;

  return {
    activeDrivesCount,
    solvedCount,
    readinessScore,
    streakDays,
    isLoading,
    refresh,
  };
}

export default usePlacementReadinessStats;
