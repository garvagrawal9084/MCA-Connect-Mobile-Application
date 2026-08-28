/**
 * SCIS Connect Mobile - Results & Assessments Zustand Store
 * Manages test results, scorecards, topic mastery, question reviews, and analytics.
 */

import { create } from "zustand";
import { logger } from "@/utils/logger";
import { resultsApi } from "./api";
import {
  ResultItem,
  ResultAnalysisResponse,
  AttemptAnswersResponse,
  AssessmentRanking,
  SpeedAnalysisResponse,
  StudentImprovementResponse,
  PracticeSuggestion,
  AIRecommendationData,
} from "./types";

interface ResultState {
  // State
  results: ResultItem[];
  activeResult: ResultItem | null;
  activeAnalysis: ResultAnalysisResponse | null;
  activeAnswers: AttemptAnswersResponse | null;
  assessmentLeaderboard: AssessmentRanking[];
  speedAnalysis: SpeedAnalysisResponse | null;
  improvementData: StudentImprovementResponse | null;
  suggestions: PracticeSuggestion[] | null;
  aiRecommendation: AIRecommendationData | null;

  // Loading & Error States
  isLoadingResults: boolean;
  isLoadingAnalysis: boolean;
  isLoadingAnswers: boolean;
  isLoadingLeaderboard: boolean;
  isLoadingAnalytics: boolean;
  error: string | null;

  // Actions
  fetchMyResults: (force?: boolean) => Promise<void>;
  fetchResultAnalysis: (resultId: string) => Promise<ResultAnalysisResponse | null>;
  fetchAttemptAnswers: (attemptId: string) => Promise<AttemptAnswersResponse | null>;
  fetchAssessmentLeaderboard: (
    assessmentId?: string,
    dimension?: string,
    value?: string
  ) => Promise<void>;
  fetchPerformanceAnalytics: () => Promise<void>;
  clearActiveAnalysis: () => void;
  clearActiveAnswers: () => void;
}

export const useResultStore = create<ResultState>((set, get) => ({
  results: [],
  activeResult: null,
  activeAnalysis: null,
  activeAnswers: null,
  assessmentLeaderboard: [],
  speedAnalysis: null,
  improvementData: null,
  suggestions: null,
  aiRecommendation: null,

  isLoadingResults: false,
  isLoadingAnalysis: false,
  isLoadingAnswers: false,
  isLoadingLeaderboard: false,
  isLoadingAnalytics: false,
  error: null,

  fetchMyResults: async (force = false) => {
    if (!force && get().results.length > 0) {
      return;
    }

    set({ isLoadingResults: true, error: null });
    logger.info("RESULT_STORE", "Fetching student assessment results");

    try {
      const response = await resultsApi.getMyResults();
      const rawList = response.data?.results || [];

      set({
        results: rawList,
        isLoadingResults: false,
      });
      logger.info("RESULT_STORE", `Loaded ${rawList.length} assessment results`);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to load results";
      logger.warn("RESULT_STORE", "Could not fetch results, setting empty fallback", err);
      set({
        error: errMsg,
        isLoadingResults: false,
      });
    }
  },

  fetchResultAnalysis: async (resultId: string) => {
    set({ isLoadingAnalysis: true, error: null, activeAnalysis: null });
    logger.info("RESULT_STORE", `Fetching detailed analysis for result: ${resultId}`);

    try {
      const response = await resultsApi.getResultAnalysis(resultId);
      if (response.data) {
        set({
          activeAnalysis: response.data,
          activeResult: response.data.result,
          isLoadingAnalysis: false,
        });
        return response.data;
      }
      set({ isLoadingAnalysis: false });
      return null;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to load analysis";
      logger.error("RESULT_STORE", `Analysis fetch failed for ${resultId}`, err);
      set({ error: errMsg, isLoadingAnalysis: false });
      return null;
    }
  },

  fetchAttemptAnswers: async (attemptId: string) => {
    set({ isLoadingAnswers: true, error: null, activeAnswers: null });
    logger.info("RESULT_STORE", `Fetching attempt answers for attempt: ${attemptId}`);

    try {
      const response = await resultsApi.getAttemptAnswers(attemptId);
      if (response.data) {
        set({
          activeAnswers: response.data,
          isLoadingAnswers: false,
        });
        return response.data;
      }
      set({ isLoadingAnswers: false });
      return null;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to load answers";
      logger.error("RESULT_STORE", `Attempt answers fetch failed for ${attemptId}`, err);
      set({ error: errMsg, isLoadingAnswers: false });
      return null;
    }
  },

  fetchAssessmentLeaderboard: async (
    assessmentId?: string,
    dimension?: string,
    value?: string
  ) => {
    set({ isLoadingLeaderboard: true });
    logger.info("RESULT_STORE", "Fetching assessment leaderboard", {
      assessmentId,
      dimension,
      value,
    });

    try {
      let response;
      if (dimension && value) {
        response = await resultsApi.getFilteredLeaderboard(dimension, value, assessmentId);
      } else {
        response = await resultsApi.getGlobalLeaderboard(assessmentId);
      }

      const rankings = response.data?.rankings || [];
      set({
        assessmentLeaderboard: rankings,
        isLoadingLeaderboard: false,
      });
    } catch (err: unknown) {
      logger.warn("RESULT_STORE", "Failed to fetch assessment leaderboard", err);
      set({ isLoadingLeaderboard: false });
    }
  },

  fetchPerformanceAnalytics: async () => {
    set({ isLoadingAnalytics: true });
    logger.info("RESULT_STORE", "Fetching student performance analytics suite");

    try {
      const [speedRes, impRes, suggRes, aiRes] = await Promise.allSettled([
        resultsApi.getSpeedAnalysis(),
        resultsApi.getImprovement(),
        resultsApi.getSuggestions(),
        resultsApi.getAIRecommendation(),
      ]);

      const speed = speedRes.status === "fulfilled" ? speedRes.value.data?.speed : null;
      const improvement = impRes.status === "fulfilled" ? impRes.value.data?.improvement : null;
      const suggestions =
        suggRes.status === "fulfilled" ? suggRes.value.data?.suggestions : null;
      const aiRecommendation =
        aiRes.status === "fulfilled" ? aiRes.value.data?.recommendation : null;

      set({
        speedAnalysis: speed,
        improvementData: improvement,
        suggestions: suggestions,
        aiRecommendation: aiRecommendation,
        isLoadingAnalytics: false,
      });
      logger.info("RESULT_STORE", "Performance analytics suite updated");
    } catch (err: unknown) {
      logger.warn("RESULT_STORE", "Failed to complete analytics suite load", err);
      set({ isLoadingAnalytics: false });
    }
  },

  clearActiveAnalysis: () => set({ activeAnalysis: null }),
  clearActiveAnswers: () => set({ activeAnswers: null }),
}));
