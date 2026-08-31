/**
 * SCIS Connect Mobile - Placement Center API Client
 * Connects directly to backend routes under /api/placement-center/
 */

import { apiClient, ApiResponse } from "@/services/api";
import { API_CONFIG } from "@/constants/config";
import { logger } from "@/utils/logger";
import {
  PlacementJob,
  JobsListResponse,
  PlacementDashboardStats,
  JobApplication,
  SavedOpportunity,
  JobReminder,
  InterviewExperience,
  CompanyItem,
  PlacementQueryParams,
} from "./types";

const buildQueryString = (params?: PlacementQueryParams): string => {
  if (!params) return "";
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "" && val !== "all") {
      query.append(key, String(val));
    }
  });
  const str = query.toString();
  return str ? `?${str}` : "";
};

export const placementCenterApi = {
  /**
   * Fetch student placement dashboard overview & metrics
   * Endpoint: GET /api/placement-center/dashboard
   */
  async getDashboard(): Promise<
    ApiResponse<{
      stats?: PlacementDashboardStats;
      openJobs?: number;
      internships?: number;
      newThisWeek?: number;
      applications?: number;
      saved?: number;
      reminders?: number;
      latestJobs?: PlacementJob[];
      closingSoon?: PlacementJob[];
    }>
  > {
    logger.info("PLACEMENT_API", "Fetching student placement dashboard stats");
    return apiClient.get(API_CONFIG.ENDPOINTS.PLACEMENT_CENTER.DASHBOARD);
  },

  /**
   * Fetch filtered & paginated placement jobs list
   * Endpoint: GET /api/placement-center/jobs
   */
  async getJobs(
    params?: PlacementQueryParams
  ): Promise<ApiResponse<JobsListResponse>> {
    const qs = buildQueryString(params);
    logger.info("PLACEMENT_API", `Fetching jobs with query: ${qs || "all"}`);
    return apiClient.get<JobsListResponse>(
      `${API_CONFIG.ENDPOINTS.PLACEMENT_CENTER.JOBS}${qs}`
    );
  },

  /**
   * Fetch full job details by ID with student eligibility and status
   * Endpoint: GET /api/placement-center/jobs/:id
   */
  async getJobById(
    id: string
  ): Promise<ApiResponse<{ job: PlacementJob }>> {
    logger.info("PLACEMENT_API", `Fetching job detail: ${id}`);
    return apiClient.get<{ job: PlacementJob }>(
      `${API_CONFIG.ENDPOINTS.PLACEMENT_CENTER.JOBS}/${id}`
    );
  },

  /**
   * Apply to a job drive
   * Endpoint: POST /api/placement-center/jobs/:id/apply
   */
  async applyToJob(
    id: string,
    payload?: { resume?: string; coverLetter?: string; notes?: string }
  ): Promise<ApiResponse<{ application: JobApplication }>> {
    logger.info("PLACEMENT_API", `Applying to job: ${id}`);
    return apiClient.post<{ application: JobApplication }>(
      `${API_CONFIG.ENDPOINTS.PLACEMENT_CENTER.JOBS}/${id}/apply`,
      payload || {}
    );
  },

  /**
   * Bookmark / Save a job opportunity
   * Endpoint: POST /api/placement/jobs/:id/save
   */
  async saveJob(
    id: string,
    collectionId?: string
  ): Promise<ApiResponse<{ saved?: SavedOpportunity }>> {
    logger.info("PLACEMENT_API", `Saving job: ${id}`);
    try {
      return await apiClient.post<{ saved?: SavedOpportunity }>(
        `${API_CONFIG.ENDPOINTS.PLACEMENT_CENTER.JOBS}/${id}/save`,
        { collectionId }
      );
    } catch (err) {
      logger.warn("PLACEMENT_API", `POST /jobs/${id}/save failed, trying POST /bookmarks fallback`, err);
      try {
        return await apiClient.post<{ saved?: SavedOpportunity }>(
          API_CONFIG.ENDPOINTS.PLACEMENT_CENTER.BOOKMARKS,
          { jobId: id, collectionId }
        );
      } catch (fallbackErr) {
        logger.warn("PLACEMENT_API", `Fallback bookmark post also failed`, fallbackErr);
        throw err;
      }
    }
  },

  /**
   * Unsave / Remove bookmark from a job
   * Endpoint: DELETE /api/placement/jobs/:id/save
   */
  async unsaveJob(id: string): Promise<ApiResponse<unknown>> {
    logger.info("PLACEMENT_API", `Unsaving job: ${id}`);
    try {
      return await apiClient.delete(
        `${API_CONFIG.ENDPOINTS.PLACEMENT_CENTER.JOBS}/${id}/save`
      );
    } catch (err) {
      logger.warn("PLACEMENT_API", `DELETE /jobs/${id}/save failed, trying DELETE /bookmarks/${id} fallback`, err);
      try {
        return await apiClient.delete(
          `${API_CONFIG.ENDPOINTS.PLACEMENT_CENTER.BOOKMARKS}/${id}`
        );
      } catch (fallbackErr) {
        logger.warn("PLACEMENT_API", `Fallback bookmark delete also failed`, fallbackErr);
        throw err;
      }
    }
  },

  /**
   * Schedule a job deadline reminder
   * Endpoint: POST /api/placement/jobs/:id/reminder
   */
  async createReminder(
    id: string,
    remindAt: string
  ): Promise<ApiResponse<{ reminder: JobReminder }>> {
    logger.info("PLACEMENT_API", `Creating reminder for job: ${id} at ${remindAt}`);
    return apiClient.post<{ reminder: JobReminder }>(
      `${API_CONFIG.ENDPOINTS.PLACEMENT_CENTER.JOBS}/${id}/reminder`,
      { remindAt }
    );
  },

  /**
   * Fetch current student's submitted applications
   * Endpoint: GET /api/placement/applications/me
   */
  async getMyApplications(): Promise<
    ApiResponse<{ applications: JobApplication[] }>
  > {
    logger.info("PLACEMENT_API", "Fetching student applications");
    return apiClient.get<{ applications: JobApplication[] }>(
      API_CONFIG.ENDPOINTS.PLACEMENT_CENTER.APPLICATIONS
    );
  },

  /**
   * Fetch saved / bookmarked opportunities
   * Endpoint: GET /api/placement/bookmarks with fallback to /api/placement/jobs/saved
   */
  async getSavedJobs(): Promise<
    ApiResponse<{
      bookmarks?: SavedOpportunity[] | PlacementJob[];
      saved?: SavedOpportunity[] | PlacementJob[];
      savedJobs?: SavedOpportunity[] | PlacementJob[];
      jobs?: PlacementJob[];
      data?: unknown;
    }>
  > {
    logger.info("PLACEMENT_API", "Fetching saved bookmarks");
    try {
      const res = await apiClient.get<Record<string, unknown>>(
        API_CONFIG.ENDPOINTS.PLACEMENT_CENTER.BOOKMARKS
      );
      if (res && res.data) {
        return res as ApiResponse<{
          bookmarks?: SavedOpportunity[] | PlacementJob[];
          saved?: SavedOpportunity[] | PlacementJob[];
          savedJobs?: SavedOpportunity[] | PlacementJob[];
          jobs?: PlacementJob[];
          data?: unknown;
        }>;
      }
      throw new Error("Primary bookmarks endpoint returned empty data");
    } catch (err) {
      logger.warn("PLACEMENT_API", "Primary bookmarks route failed, attempting /api/placement/jobs/saved fallback", err);
      try {
        const fallbackRes = await apiClient.get<Record<string, unknown>>(
          "/api/placement/jobs/saved"
        );
        return fallbackRes as ApiResponse<{
          bookmarks?: SavedOpportunity[] | PlacementJob[];
          saved?: SavedOpportunity[] | PlacementJob[];
          savedJobs?: SavedOpportunity[] | PlacementJob[];
          jobs?: PlacementJob[];
          data?: unknown;
        }>;
      } catch (fallbackErr) {
        logger.warn("PLACEMENT_API", "Fallback saved jobs route also failed", fallbackErr);
        throw err;
      }
    }
  },

  /**
   * Fetch scheduled job reminders
   * Endpoint: GET /api/placement-center/reminders
   */
  async getMyReminders(): Promise<
    ApiResponse<{ reminders: JobReminder[] }>
  > {
    logger.info("PLACEMENT_API", "Fetching scheduled reminders");
    return apiClient.get<{ reminders: JobReminder[] }>(
      API_CONFIG.ENDPOINTS.PLACEMENT_CENTER.REMINDERS
    );
  },

  /**
   * Delete a scheduled reminder
   * Endpoint: DELETE /api/placement-center/reminders/:id
   */
  async deleteReminder(id: string): Promise<ApiResponse<unknown>> {
    logger.info("PLACEMENT_API", `Deleting reminder: ${id}`);
    return apiClient.delete(
      `${API_CONFIG.ENDPOINTS.PLACEMENT_CENTER.REMINDERS}/${id}`
    );
  },

  /**
   * Fetch interview experiences
   * Endpoint: GET /api/placement-center/experiences
   */
  async getExperiences(params?: {
    company?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ experiences: InterviewExperience[] }>> {
    const qs = params?.company ? `?company=${encodeURIComponent(params.company)}` : "";
    logger.info("PLACEMENT_API", "Fetching interview experiences");
    return apiClient.get<{ experiences: InterviewExperience[] }>(
      `${API_CONFIG.ENDPOINTS.PLACEMENT_CENTER.EXPERIENCES}${qs}`
    );
  },

  /**
   * Submit an interview experience
   * Endpoint: POST /api/placement-center/experiences
   */
  async createExperience(
    payload: Partial<InterviewExperience>
  ): Promise<ApiResponse<{ experience: InterviewExperience }>> {
    logger.info("PLACEMENT_API", "Submitting new interview experience");
    return apiClient.post<{ experience: InterviewExperience }>(
      API_CONFIG.ENDPOINTS.PLACEMENT_CENTER.EXPERIENCES,
      payload
    );
  },

  /**
   * Upvote an interview experience
   * Endpoint: POST /api/placement-center/experiences/:id/upvote
   */
  async upvoteExperience(
    id: string
  ): Promise<ApiResponse<{ upvotes: number }>> {
    logger.info("PLACEMENT_API", `Upvoting experience: ${id}`);
    return apiClient.post<{ upvotes: number }>(
      `${API_CONFIG.ENDPOINTS.PLACEMENT_CENTER.EXPERIENCES}/${id}/upvote`
    );
  },

  /**
   * Fetch registered placement companies
   * Endpoint: GET /api/placement-center/companies
   */
  async getCompanies(): Promise<
    ApiResponse<{ companies: CompanyItem[] }>
  > {
    logger.info("PLACEMENT_API", "Fetching placement companies");
    return apiClient.get<{ companies: CompanyItem[] }>(
      API_CONFIG.ENDPOINTS.PLACEMENT_CENTER.COMPANIES
    );
  },

  /**
   * Report a job posting
   * Endpoint: POST /api/placement/jobs/:id/report
   */
  async reportJob(
    id: string,
    reason: string,
    details?: string
  ): Promise<ApiResponse<unknown>> {
    logger.info("PLACEMENT_API", `Reporting job: ${id}`);
    return apiClient.post(
      `${API_CONFIG.ENDPOINTS.PLACEMENT_CENTER.JOBS}/${id}/report`,
      { reason, details }
    );
  },

  /**
   * Broadcast notifications for a published job to eligible students
   * Endpoint: POST /api/placement/jobs/:id/send-notifications
   */
  async sendJobNotifications(
    id: string,
    payload?: { batchFilter?: number[]; sendEmail?: boolean; sendWeb?: boolean }
  ): Promise<ApiResponse<{ notified: number; emails: number }>> {
    logger.info("PLACEMENT_API", `Sending job notifications for: ${id}`);
    return apiClient.post<{ notified: number; emails: number }>(
      `${API_CONFIG.ENDPOINTS.PLACEMENT_CENTER.JOBS}/${id}/send-notifications`,
      payload || {}
    );
  },
};
