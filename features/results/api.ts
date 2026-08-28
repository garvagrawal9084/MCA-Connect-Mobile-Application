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
      // Fallback in case endpoint is mounted at /api/results
      return apiClient.get<{ results: ResultItem[] }>("/api/results");
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
    return apiClient.get<{ result: ResultItem }>(
      `${API_CONFIG.ENDPOINTS.RESULTS.MY_RESULT}/${assessmentId}`
    );
  },

  /**
   * Fetch all attempts and score history for a specific assessment
   * Endpoint: GET /api/results/my-all-results/:assessmentId
   */
  async getMyAllResults(
    assessmentId: string
  ): Promise<ApiResponse<{ results: ResultItem[] }>> {
    logger.info("RESULTS_API", `Fetching all attempts for assessment: ${assessmentId}`);
    return apiClient.get<{ results: ResultItem[] }>(
      `${API_CONFIG.ENDPOINTS.RESULTS.MY_ALL_RESULTS}/${assessmentId}`
    );
  },

  /**
   * Fetch comprehensive analysis (trends, mastery, speed, improvement, suggestions) for a result
   * Endpoint: GET /api/results/analysis/:resultId
   */
  async getResultAnalysis(
    resultId: string
  ): Promise<ApiResponse<ResultAnalysisResponse>> {
    logger.info("RESULTS_API", `Fetching result analysis for: ${resultId}`);
    return apiClient.get<ResultAnalysisResponse>(
      `${API_CONFIG.ENDPOINTS.RESULTS.ANALYSIS}/${resultId}`
    );
  },

  /**
   * Fetch question-by-question student answers and review for an attempt
   * Endpoint: GET /api/results/attempt/:attemptId/answers
   */
  async getAttemptAnswers(
    attemptId: string
  ): Promise<ApiResponse<AttemptAnswersResponse>> {
    logger.info("RESULTS_API", `Fetching attempt answers review for: ${attemptId}`);
    return apiClient.get<AttemptAnswersResponse>(
      `${API_CONFIG.ENDPOINTS.RESULTS.ATTEMPT_ANSWERS}/${attemptId}/answers`
    );
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
    return apiClient.get<{ speed: SpeedAnalysisResponse | any }>(
      API_CONFIG.ENDPOINTS.RESULTS.SPEED_ANALYSIS
    );
  },

  /**
   * Fetch student's improvement score trajectory
   * Endpoint: GET /api/results/improvement
   */
  async getImprovement(): Promise<
    ApiResponse<{ improvement: StudentImprovementResponse | any }>
  > {
    logger.info("RESULTS_API", "Fetching student improvement metrics");
    return apiClient.get<{ improvement: StudentImprovementResponse | any }>(
      API_CONFIG.ENDPOINTS.RESULTS.IMPROVEMENT
    );
  },

  /**
   * Fetch practice and study suggestions
   * Endpoint: GET /api/results/suggestions
   */
  async getSuggestions(): Promise<
    ApiResponse<{ suggestions: PracticeSuggestion[] | any }>
  > {
    logger.info("RESULTS_API", "Fetching practice suggestions");
    return apiClient.get<{ suggestions: PracticeSuggestion[] | any }>(
      API_CONFIG.ENDPOINTS.RESULTS.SUGGESTIONS
    );
  },

  /**
   * Fetch AI recommendation for student preparation
   * Endpoint: GET /api/results/ai-recommendation
   */
  async getAIRecommendation(): Promise<
    ApiResponse<{ recommendation: AIRecommendationData | any }>
  > {
    logger.info("RESULTS_API", "Fetching AI recommendation");
    return apiClient.get<{ recommendation: AIRecommendationData | any }>(
      API_CONFIG.ENDPOINTS.RESULTS.AI_RECOMMENDATION
    );
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
