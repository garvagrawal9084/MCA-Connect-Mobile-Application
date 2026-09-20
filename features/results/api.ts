/**
 * SCIS Connect Mobile - Results & Assessments API Client
 * Connects directly to backend resultRoutes.js endpoints.
 */

import { apiClient, ApiResponse } from "@/services/api";
import { API_CONFIG } from "@/constants/config";
import { logger } from "@/utils/logger";
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

export const resultsApi = {
  /**
   * Fetch all assessment results for the logged-in student (best attempt per assessment)
   * Endpoint: GET /api/results/my (or /api/results/)
   */
  async getMyResults(): Promise<ApiResponse<{ results: ResultItem[] }>> {
    logger.info("RESULTS_API", "Fetching student assessment results");
    try {
      return await apiClient.get<{ results: ResultItem[] }>(
        API_CONFIG.ENDPOINTS.RESULTS.MY_RESULTS
      );
    } catch {
      try {
        return await apiClient.get<{ results: ResultItem[] }>("/api/results/my");
      } catch {
        return apiClient.get<{ results: ResultItem[] }>("/api/results");
      }
    }
  },

  /**
   * Fetch a specific result by Result ID
   * Endpoint: GET /api/results/:id
   */
  async getResult(id: string): Promise<ApiResponse<{ result: ResultItem }>> {
    logger.info("RESULTS_API", `Fetching single result by ID: ${id}`);
    try {
      return await apiClient.get<{ result: ResultItem }>(
        `${API_CONFIG.ENDPOINTS.RESULTS.BASE}/${id}`
      );
    } catch {
      return apiClient.get<{ result: ResultItem }>(
        `/api/assessments/results/${id}`
      );
    }
  },

  /**
   * Fetch all results for a specific assessment
   * Endpoint: GET /api/results/:assessmentId/results (or /api/assessments/:assessmentId/results)
   */
  async getAssessmentResults(
    assessmentId: string
  ): Promise<ApiResponse<{ results: ResultItem[] }>> {
    logger.info("RESULTS_API", `Fetching assessment results for: ${assessmentId}`);
    try {
      return await apiClient.get<{ results: ResultItem[] }>(
        `${API_CONFIG.ENDPOINTS.RESULTS.BASE}/${assessmentId}/results`
      );
    } catch {
      // Fallback in case endpoint is mounted under /api/assessments/:assessmentId/results
      return apiClient.get<{ results: ResultItem[] }>(
        `/api/assessments/${assessmentId}/results`
      );
    }
  },

  /**
   * Compute result for an assessment attempt (Admin / Faculty / Owner)
   * Endpoint: POST /api/results/compute/:attemptId
   */
  async computeResult(
    attemptId: string
  ): Promise<ApiResponse<{ result: ResultItem; message?: string }>> {
    logger.info("RESULTS_API", `Computing result for attempt: ${attemptId}`);
    try {
      return await apiClient.post<{ result: ResultItem; message?: string }>(
        `${API_CONFIG.ENDPOINTS.RESULTS.COMPUTE}/${attemptId}`
      );
    } catch {
      return apiClient.post<{ result: ResultItem; message?: string }>(
        `/api/assessments/results/compute/${attemptId}`
      );
    }
  },

  /**
   * Publish a result by Result ID (Admin / Faculty / Owner)
   * Endpoint: POST /api/results/:id/publish
   */
  async publishResult(
    id: string
  ): Promise<ApiResponse<{ result: ResultItem; message?: string }>> {
    logger.info("RESULTS_API", `Publishing result ID: ${id}`);
    try {
      return await apiClient.post<{ result: ResultItem; message?: string }>(
        `${API_CONFIG.ENDPOINTS.RESULTS.PUBLISH}/${id}/publish`
      );
    } catch {
      return apiClient.post<{ result: ResultItem; message?: string }>(
        `/api/assessments/results/${id}/publish`
      );
    }
  },

  /**
   * Fetch student's highest score result for a specific assessment
   * Endpoint: GET /api/results/my-result/:assessmentId
   */
  async getMyResult(
    assessmentId: string
  ): Promise<ApiResponse<{ result: ResultItem }>> {
    logger.info("RESULTS_API", `Fetching my result for assessment: ${assessmentId}`);
    try {
      return await apiClient.get<{ result: ResultItem }>(
        `${API_CONFIG.ENDPOINTS.RESULTS.MY_RESULT}/${assessmentId}`
      );
    } catch {
      return apiClient.get<{ result: ResultItem }>(
        `/api/assessments/results/my-result/${assessmentId}`
      );
    }
  },

  /**
   * Fetch all attempts and score history for a specific assessment
   * Endpoint: GET /api/results/my-all-results/:assessmentId
   */
  async getMyAllResults(
    assessmentId: string
  ): Promise<ApiResponse<{ results: ResultItem[] }>> {
    logger.info("RESULTS_API", `Fetching all attempts for assessment: ${assessmentId}`);
    try {
      return await apiClient.get<{ results: ResultItem[] }>(
        `${API_CONFIG.ENDPOINTS.RESULTS.MY_ALL_RESULTS}/${assessmentId}`
      );
    } catch {
      return apiClient.get<{ results: ResultItem[] }>(
        `/api/assessments/results/my-all-results/${assessmentId}`
      );
    }
  },

  /**
   * Fetch comprehensive analysis (trends, mastery, speed, improvement, suggestions) for a result
   * Endpoint: GET /api/results/analysis/:resultId
   */
  async getResultAnalysis(
    resultId: string
  ): Promise<ApiResponse<ResultAnalysisResponse>> {
    logger.info("RESULTS_API", `Fetching result analysis for: ${resultId}`);
    try {
      return await apiClient.get<ResultAnalysisResponse>(
        `${API_CONFIG.ENDPOINTS.RESULTS.ANALYSIS}/${resultId}`
      );
    } catch {
      return apiClient.get<ResultAnalysisResponse>(
        `/api/assessments/results/analysis/${resultId}`
      );
    }
  },

  /**
   * Fetch question-by-question student answers and review for an attempt
   * Endpoint: GET /api/results/attempt/:attemptId/answers
   */
  async getAttemptAnswers(
    attemptId: string
  ): Promise<ApiResponse<AttemptAnswersResponse>> {
    logger.info("RESULTS_API", `Fetching attempt answers review for: ${attemptId}`);
    try {
      return await apiClient.get<AttemptAnswersResponse>(
        `${API_CONFIG.ENDPOINTS.RESULTS.ATTEMPT_ANSWERS}/${attemptId}/answers`
      );
    } catch {
      try {
        return await apiClient.get<AttemptAnswersResponse>(
          `/api/assessments/attempts/${attemptId}/answers`
        );
      } catch {
        return apiClient.get<AttemptAnswersResponse>(
          `/api/assessments/results/${attemptId}/answers`
        );
      }
    }
  },

  /**
   * Fetch global assessment leaderboard
   * Endpoint: GET /api/results/leaderboard/global?assessmentId=...
   */
  async getGlobalLeaderboard(
    assessmentId?: string
  ): Promise<ApiResponse<{ rankings: AssessmentRanking[] }>> {
    logger.info("RESULTS_API", "Fetching global assessment leaderboard", { assessmentId });
    const query = assessmentId ? `?assessmentId=${assessmentId}` : "";
    return apiClient.get<{ rankings: AssessmentRanking[] }>(
      `${API_CONFIG.ENDPOINTS.RESULTS.GLOBAL_LEADERBOARD}${query}`
    );
  },

  /**
   * Fetch filtered assessment leaderboard (dimension = batch | department | program)
   * Endpoint: GET /api/results/leaderboard/filtered?dimension=...&value=...&assessmentId=...
   */
  async getFilteredLeaderboard(
    dimension: string,
    value: string,
    assessmentId?: string
  ): Promise<ApiResponse<{ rankings: AssessmentRanking[] }>> {
    logger.info("RESULTS_API", `Fetching filtered leaderboard by ${dimension}=${value}`);
    let url = `${API_CONFIG.ENDPOINTS.RESULTS.FILTERED_LEADERBOARD}?dimension=${encodeURIComponent(
      dimension
    )}&value=${encodeURIComponent(value)}`;
    if (assessmentId) {
      url += `&assessmentId=${encodeURIComponent(assessmentId)}`;
    }
    return apiClient.get<{ rankings: AssessmentRanking[] }>(url);
  },

  /**
   * Fetch student's speed and pacing analytics across tests
   * Endpoint: GET /api/results/speed-analysis
   */
  async getSpeedAnalysis(): Promise<ApiResponse<{ speed: SpeedAnalysisResponse | any }>> {
    logger.info("RESULTS_API", "Fetching student speed analysis");
    try {
      return await apiClient.get<{ speed: SpeedAnalysisResponse | any }>(
        API_CONFIG.ENDPOINTS.RESULTS.SPEED_ANALYSIS
      );
    } catch {
      return apiClient.get<{ speed: SpeedAnalysisResponse | any }>(
        "/api/results/speed-analysis"
      );
    }
  },

  /**
   * Fetch student's improvement score trajectory
   * Endpoint: GET /api/results/improvement
   */
  async getImprovement(): Promise<
    ApiResponse<{ improvement: StudentImprovementResponse | any }>
  > {
    logger.info("RESULTS_API", "Fetching student improvement metrics");
    try {
      return await apiClient.get<{ improvement: StudentImprovementResponse | any }>(
        API_CONFIG.ENDPOINTS.RESULTS.IMPROVEMENT
      );
    } catch {
      return apiClient.get<{ improvement: StudentImprovementResponse | any }>(
        "/api/results/improvement"
      );
    }
  },

  /**
   * Fetch practice and study suggestions
   * Endpoint: GET /api/results/suggestions
   */
  async getSuggestions(): Promise<
    ApiResponse<{ suggestions: PracticeSuggestion[] | any }>
  > {
    logger.info("RESULTS_API", "Fetching practice suggestions");
    try {
      return await apiClient.get<{ suggestions: PracticeSuggestion[] | any }>(
        API_CONFIG.ENDPOINTS.RESULTS.SUGGESTIONS
      );
    } catch {
      return apiClient.get<{ suggestions: PracticeSuggestion[] | any }>(
        "/api/results/suggestions"
      );
    }
  },

  /**
   * Fetch AI recommendation for student preparation
   * Endpoint: GET /api/results/ai-recommendation
   */
  async getAIRecommendation(): Promise<
    ApiResponse<{ recommendation: AIRecommendationData | any }>
  > {
    logger.info("RESULTS_API", "Fetching AI recommendation");
    try {
      return await apiClient.get<{ recommendation: AIRecommendationData | any }>(
        API_CONFIG.ENDPOINTS.RESULTS.AI_RECOMMENDATION
      );
    } catch {
      return apiClient.get<{ recommendation: AIRecommendationData | any }>(
        "/api/results/ai-recommendation"
      );
    }
  },

  /**
   * Compare performance across multiple assessments
   * Endpoint: GET /api/results/compare?assessmentIds=id1,id2
   */
  async compareResults(
    assessmentIds: string[]
  ): Promise<ApiResponse<{ results: any }>> {
    logger.info("RESULTS_API", "Comparing results for assessments", { assessmentIds });
    const ids = assessmentIds.join(",");
    return apiClient.get<{ results: any }>(
      `${API_CONFIG.ENDPOINTS.RESULTS.COMPARE}?assessmentIds=${encodeURIComponent(ids)}`
    );
  },

  /**
   * Get PDF report URL or fetch HTML report
   * Endpoint: GET /api/results/report/pdf/:resultId
   */
  getPDFReportUrl(resultId: string): string {
    return `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.RESULTS.REPORT_PDF}/${resultId}`;
  },
};
