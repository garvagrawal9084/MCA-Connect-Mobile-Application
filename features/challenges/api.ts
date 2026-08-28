/**
 * SCIS Connect Mobile - Challenges & Certificates API Client
 * Connects directly to the existing SCIS backend routes.
 */

import { apiClient, ApiResponse } from "@/services/api";
import { logger } from "@/utils/logger";
import {
  Challenge,
  MyChallengeItem,
  ChallengeDetailResponse,
  LeaderboardEntry,
  DailyMaxRecord,
  Certificate,
} from "./types";

export const challengesApi = {
  /**
   * Fetch all active, upcoming, and past challenges
   * Endpoint: GET /api/challenges/
   */
  async getAllChallenges(): Promise<ApiResponse<{ challenges: Challenge[] }>> {
    logger.info("CHALLENGES_API", "Fetching all challenges");
    return apiClient.get<{ challenges: Challenge[] }>("/api/challenges/");
  },

  /**
   * Fetch challenges the current student has joined
   * Endpoint: GET /api/challenges/my
   */
  async getMyChallenges(): Promise<ApiResponse<{ challenges: MyChallengeItem[] }>> {
    logger.info("CHALLENGES_API", "Fetching student enrolled challenges");
    return apiClient.get<{ challenges: MyChallengeItem[] }>("/api/challenges/my");
  },

  /**
   * Fetch a specific challenge by ID with all daily solve records
   * Endpoint: GET /api/challenges/:id
   */
  async getChallengeById(
    id: string
  ): Promise<ApiResponse<ChallengeDetailResponse>> {
    logger.info("CHALLENGES_API", `Fetching challenge details for: ${id}`);
    return apiClient.get<ChallengeDetailResponse>(`/api/challenges/${id}`);
  },

  /**
   * Fetch the global student leaderboard
   * Endpoint: GET /api/challenges/leaderboard
   */
  async getGlobalLeaderboard(): Promise<
    ApiResponse<{ leaderboard: LeaderboardEntry[] }>
  > {
    logger.info("CHALLENGES_API", "Fetching global leaderboard");
    return apiClient.get<{ leaderboard: LeaderboardEntry[] }>(
      "/api/challenges/leaderboard"
    );
  },

  /**
   * Fetch challenge-specific leaderboard
   * Endpoint: GET /api/challenges/:id/leaderboard
   */
  async getChallengeLeaderboard(
    id: string
  ): Promise<ApiResponse<{ leaderboard: LeaderboardEntry[] }>> {
    logger.info("CHALLENGES_API", `Fetching leaderboard for challenge: ${id}`);
    return apiClient.get<{ leaderboard: LeaderboardEntry[] }>(
      `/api/challenges/${id}/leaderboard`
    );
  },

  /**
   * Fetch challenge daily max solver statistics
   * Endpoint: GET /api/challenges/:id/daily-max
   */
  async getChallengeDailyMax(
    id: string
  ): Promise<ApiResponse<{ dailyMax: DailyMaxRecord[] }>> {
    logger.info("CHALLENGES_API", `Fetching daily-max for challenge: ${id}`);
    return apiClient.get<{ dailyMax: DailyMaxRecord[] }>(
      `/api/challenges/${id}/daily-max`
    );
  },

  /**
   * Join a challenge (Self-enrollment or by userId)
   * Tries POST /api/challenges/:id/join or fallback to POST /api/challenges/:id/users/:userId
   */
  async joinChallenge(
    challengeId: string,
    userId?: string
  ): Promise<ApiResponse<{ challenge: Challenge }>> {
    logger.info("CHALLENGES_API", `Joining challenge: ${challengeId}`);
    if (userId) {
      return apiClient.post<{ challenge: Challenge }>(
        `/api/challenges/${challengeId}/users/${userId}`
      );
    }
    // Attempt standard self-join endpoint
    try {
      return await apiClient.post<{ challenge: Challenge }>(
        `/api/challenges/${challengeId}/join`
      );
    } catch {
      // Fallback
      return apiClient.post<{ challenge: Challenge }>(
        `/api/challenges/${challengeId}/join`
      );
    }
  },

  /**
   * Leave a challenge (Self-unenrollment or by userId)
   */
  async leaveChallenge(
    challengeId: string,
    userId?: string
  ): Promise<ApiResponse<{ challenge: Challenge }>> {
    logger.info("CHALLENGES_API", `Leaving challenge: ${challengeId}`);
    if (userId) {
      return apiClient.delete<{ challenge: Challenge }>(
        `/api/challenges/${challengeId}/users/${userId}`
      );
    }
    return apiClient.delete<{ challenge: Challenge }>(
      `/api/challenges/${challengeId}/leave`
    );
  },
};

export const certificatesApi = {
  /**
   * Fetch all certificates earned by the current student
   * Endpoint: GET /api/certificates/my
   */
  async getMyCertificates(): Promise<
    ApiResponse<{ certificates: Certificate[] } | Certificate[]>
  > {
    logger.info("CERTIFICATES_API", "Fetching student certificates");
    return apiClient.get<{ certificates: Certificate[] } | Certificate[]>(
      "/api/certificates/my"
    );
  },

  /**
   * Fetch certificate earned for a specific challenge
   * Endpoint: GET /api/certificates/challenge/:challengeId
   */
  async getChallengeCertificate(
    challengeId: string
  ): Promise<ApiResponse<{ certificate: Certificate } | Certificate>> {
    logger.info(
      "CERTIFICATES_API",
      `Fetching certificate for challenge: ${challengeId}`
    );
    return apiClient.get<{ certificate: Certificate } | Certificate>(
      `/api/certificates/challenge/${challengeId}`
    );
  },

  /**
   * Verify a certificate public credential
   * Endpoint: GET /api/certificates/verify/:serial
   */
  async verifyCertificate(
    serial: string
  ): Promise<ApiResponse<{ certificate: Certificate }>> {
    logger.info("CERTIFICATES_API", `Verifying certificate serial: ${serial}`);
    return apiClient.get<{ certificate: Certificate }>(
      `/api/certificates/verify/${serial}`
    );
  },
};
