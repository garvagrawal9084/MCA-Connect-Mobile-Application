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
  assessmentResults: ResultItem[];
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
  isLoadingSingleResult: boolean;
  isLoadingAssessmentResults: boolean;
  isLoadingAnalysis: boolean;
  isLoadingAnswers: boolean;
  isLoadingLeaderboard: boolean;
  isLoadingAnalytics: boolean;
  isComputingResult: boolean;
  isPublishingResult: boolean;
  error: string | null;

  // Actions
  fetchMyResults: (force?: boolean) => Promise<void>;
  fetchResultById: (id: string) => Promise<ResultItem | null>;
  fetchAssessmentResults: (assessmentId: string) => Promise<ResultItem[]>;
  computeResult: (attemptId: string) => Promise<ResultItem | null>;
  publishResult: (id: string) => Promise<ResultItem | null>;
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
  clearActiveResult: () => void;
}

export const useResultStore = create<ResultState>((set, get) => ({
  results: [],
  assessmentResults: [],
  activeResult: null,
  activeAnalysis: null,
  activeAnswers: null,
  assessmentLeaderboard: [],
  speedAnalysis: null,
  improvementData: null,
  suggestions: null,
  aiRecommendation: null,

  isLoadingResults: false,
  isLoadingSingleResult: false,
  isLoadingAssessmentResults: false,
  isLoadingAnalysis: false,
  isLoadingAnswers: false,
  isLoadingLeaderboard: false,
  isLoadingAnalytics: false,
  isComputingResult: false,
  isPublishingResult: false,
  error: null,

  fetchMyResults: async (force = false) => {
    if (!force && get().results.length > 0) {
      return;
    }

    set({ isLoadingResults: true, error: null });
    logger.info("RESULT_STORE", "Fetching student assessment results");

    try {
      const response = await resultsApi.getMyResults();
      const dataPayload = response.data as unknown;
      let rawList: ResultItem[] = [];
      if (Array.isArray(dataPayload)) {
        rawList = dataPayload as ResultItem[];
      } else if (
        dataPayload &&
        typeof dataPayload === "object" &&
        "results" in dataPayload &&
        Array.isArray((dataPayload as { results: unknown[] }).results)
      ) {
        rawList = (dataPayload as { results: ResultItem[] }).results;
      } else if (
        dataPayload &&
        typeof dataPayload === "object" &&
        "data" in dataPayload &&
        (dataPayload as { data: unknown }).data &&
        typeof (dataPayload as { data: { results?: unknown } }).data === "object" &&
        Array.isArray((dataPayload as { data: { results?: unknown[] } }).data.results)
      ) {
        rawList = (dataPayload as { data: { results: ResultItem[] } }).data.results;
      }

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

  fetchResultById: async (id: string) => {
    set({ isLoadingSingleResult: true, error: null });
    logger.info("RESULT_STORE", `Fetching result by ID: ${id}`);

    try {
      const response = await resultsApi.getResult(id);
      const dataPayload = response.data as unknown;
      let res: ResultItem | null = null;
      if (
        dataPayload &&
        typeof dataPayload === "object" &&
        "result" in dataPayload
      ) {
        res = (dataPayload as { result: ResultItem }).result;
      } else if (
        dataPayload &&
        typeof dataPayload === "object" &&
        "_id" in dataPayload
      ) {
        res = dataPayload as ResultItem;
      }

      set({
        activeResult: res,
        isLoadingSingleResult: false,
      });
      return res;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to fetch result";
      logger.error("RESULT_STORE", `Failed to fetch result by ID: ${id}`, err);
      set({ error: errMsg, isLoadingSingleResult: false });
      return null;
    }
  },

  fetchAssessmentResults: async (assessmentId: string) => {
    set({ isLoadingAssessmentResults: true, error: null });
    logger.info("RESULT_STORE", `Fetching results for assessment: ${assessmentId}`);

    try {
      const response = await resultsApi.getAssessmentResults(assessmentId);
      const list = response.data?.results || [];
      set({
        assessmentResults: list,
        isLoadingAssessmentResults: false,
      });
      return list;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to fetch assessment results";
      logger.warn("RESULT_STORE", `Failed to load assessment results for ${assessmentId}`, err);
      set({ error: errMsg, isLoadingAssessmentResults: false });
      return [];
    }
  },

  computeResult: async (attemptId: string) => {
    set({ isComputingResult: true, error: null });
    logger.info("RESULT_STORE", `Triggering computeResult for attempt: ${attemptId}`);

    try {
      const response = await resultsApi.computeResult(attemptId);
      const computed = response.data?.result || null;
      if (computed) {
        // Refresh or update result in current list
        set((state) => ({
          results: [computed, ...state.results.filter((r) => r._id !== computed._id)],
          isComputingResult: false,
        }));
      } else {
        set({ isComputingResult: false });
      }
      return computed;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to compute result";
      logger.error("RESULT_STORE", `Compute result failed for attempt ${attemptId}`, err);
      set({ error: errMsg, isComputingResult: false });
      return null;
    }
  },

  publishResult: async (id: string) => {
    set({ isPublishingResult: true, error: null });
    logger.info("RESULT_STORE", `Triggering publishResult for ID: ${id}`);

    try {
      const response = await resultsApi.publishResult(id);
      const published = response.data?.result || null;
      if (published) {
        set((state) => ({
          results: state.results.map((r) => (r._id === id ? { ...r, isPublished: true, ...published } : r)),
          activeResult: state.activeResult?._id === id ? { ...state.activeResult, isPublished: true, ...published } : state.activeResult,
          isPublishingResult: false,
        }));
      } else {
        set({ isPublishingResult: false });
      }
      return published;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to publish result";
      logger.error("RESULT_STORE", `Publish result failed for ID ${id}`, err);
      set({ error: errMsg, isPublishingResult: false });
      return null;
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
  clearActiveResult: () => set({ activeResult: null }),
}));

