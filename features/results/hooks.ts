/**
 * SCIS Connect Mobile - Results & Assessments React Hooks
 */

import { useEffect, useCallback } from "react";
import { useResultStore } from "./store";

/**
 * Hook to retrieve and refresh student assessment results
 */
export function useMyResults() {
  const results = useResultStore((state) => state.results);
  const isLoading = useResultStore((state) => state.isLoadingResults);
  const error = useResultStore((state) => state.error);
  const fetchMyResults = useResultStore((state) => state.fetchMyResults);

  useEffect(() => {
    fetchMyResults();
  }, [fetchMyResults]);

  const refresh = useCallback(() => {
    return fetchMyResults(true);
  }, [fetchMyResults]);

  return {
    results,
    isLoading,
    error,
    refresh,
  };
}

/**
 * Hook to fetch and view detailed analysis for a specific result
 */
export function useResultAnalysis(resultId?: string) {
  const activeAnalysis = useResultStore((state) => state.activeAnalysis);
  const activeResult = useResultStore((state) => state.activeResult);
  const isLoading = useResultStore((state) => state.isLoadingAnalysis);
  const error = useResultStore((state) => state.error);
  const fetchResultAnalysis = useResultStore((state) => state.fetchResultAnalysis);
  const clearActiveAnalysis = useResultStore((state) => state.clearActiveAnalysis);

  useEffect(() => {
    if (resultId) {
      fetchResultAnalysis(resultId);
    }
    return () => {
      clearActiveAnalysis();
    };
  }, [resultId, fetchResultAnalysis, clearActiveAnalysis]);

  return {
    analysis: activeAnalysis,
    result: activeResult,
    isLoading,
    error,
    fetchAnalysis: fetchResultAnalysis,
    clearAnalysis: clearActiveAnalysis,
  };
}

/**
 * Hook to review student answers and questions for an attempt
 */
export function useAttemptAnswers(attemptId?: string) {
  const activeAnswers = useResultStore((state) => state.activeAnswers);
  const isLoading = useResultStore((state) => state.isLoadingAnswers);
  const error = useResultStore((state) => state.error);
  const fetchAttemptAnswers = useResultStore((state) => state.fetchAttemptAnswers);
  const clearActiveAnswers = useResultStore((state) => state.clearActiveAnswers);

  useEffect(() => {
    if (attemptId) {
      fetchAttemptAnswers(attemptId);
    }
    return () => {
      clearActiveAnswers();
    };
  }, [attemptId, fetchAttemptAnswers, clearActiveAnswers]);

  return {
    attemptData: activeAnswers,
    answers: activeAnswers?.answers || [],
    attempt: activeAnswers?.attempt,
    isLoading,
    error,
    fetchAnswers: fetchAttemptAnswers,
    clearAnswers: clearActiveAnswers,
  };
}

/**
 * Hook to fetch student-wide analytics: speed, improvement, practice suggestions & AI advice
 */
export function usePerformanceAnalytics() {
  const speedAnalysis = useResultStore((state) => state.speedAnalysis);
  const improvementData = useResultStore((state) => state.improvementData);
  const suggestions = useResultStore((state) => state.suggestions);
  const aiRecommendation = useResultStore((state) => state.aiRecommendation);
  const isLoading = useResultStore((state) => state.isLoadingAnalytics);
  const fetchPerformanceAnalytics = useResultStore(
    (state) => state.fetchPerformanceAnalytics
  );

  useEffect(() => {
    fetchPerformanceAnalytics();
  }, [fetchPerformanceAnalytics]);

  const refresh = useCallback(() => {
    return fetchPerformanceAnalytics();
  }, [fetchPerformanceAnalytics]);

  return {
    speedAnalysis,
    improvementData,
    suggestions,
    aiRecommendation,
    isLoading,
    refresh,
  };
}

/**
 * Hook to retrieve a single result by ID
 */
export function useResult(resultId?: string) {
  const activeResult = useResultStore((state) => state.activeResult);
  const isLoading = useResultStore((state) => state.isLoadingSingleResult);
  const error = useResultStore((state) => state.error);
  const fetchResultById = useResultStore((state) => state.fetchResultById);
  const clearActiveResult = useResultStore((state) => state.clearActiveResult);

  useEffect(() => {
    if (resultId) {
      fetchResultById(resultId);
    }
    return () => {
      clearActiveResult();
    };
  }, [resultId, fetchResultById, clearActiveResult]);

  const refresh = useCallback(() => {
    if (resultId) {
      return fetchResultById(resultId);
    }
    return Promise.resolve(null);
  }, [resultId, fetchResultById]);

  return {
    result: activeResult,
    isLoading,
    error,
    refresh,
  };
}

/**
 * Hook to retrieve results for a specific assessment
 */
export function useAssessmentResults(assessmentId?: string) {
  const assessmentResults = useResultStore((state) => state.assessmentResults);
  const isLoading = useResultStore((state) => state.isLoadingAssessmentResults);
  const error = useResultStore((state) => state.error);
  const fetchAssessmentResults = useResultStore(
    (state) => state.fetchAssessmentResults
  );

  useEffect(() => {
    if (assessmentId) {
      fetchAssessmentResults(assessmentId);
    }
  }, [assessmentId, fetchAssessmentResults]);

  const refresh = useCallback(() => {
    if (assessmentId) {
      return fetchAssessmentResults(assessmentId);
    }
    return Promise.resolve([]);
  }, [assessmentId, fetchAssessmentResults]);

  return {
    results: assessmentResults,
    isLoading,
    error,
    refresh,
  };
}

/**
 * Hook to trigger computeResult and publishResult actions
 */
export function useResultActions() {
  const computeResult = useResultStore((state) => state.computeResult);
  const publishResult = useResultStore((state) => state.publishResult);
  const isComputing = useResultStore((state) => state.isComputingResult);
  const isPublishing = useResultStore((state) => state.isPublishingResult);
  const error = useResultStore((state) => state.error);

  return {
    computeResult,
    publishResult,
    isComputing,
    isPublishing,
    error,
  };
}

