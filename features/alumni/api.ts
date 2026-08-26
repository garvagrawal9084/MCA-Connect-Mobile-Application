import { apiClient, ApiResponse } from "@/services/api";
import { logger } from "@/utils/logger";
import {
  AlumniSearchFilters,
  PeopleSearchResponse,
  CompaniesResponse,
  Mentor,
  MentorshipRequest,
  MentorshipRequestPayload,
  CommunityPost,
  CommunityStats,
  ForumTopic,
} from "./types";

const buildQueryString = (params: Record<string, unknown>): string => {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      if (value.length > 0) {
        parts.push(`${key}=${encodeURIComponent(value.join(","))}`);
      }
    } else {
      parts.push(`${key}=${encodeURIComponent(String(value))}`);
    }
  }
  return parts.length > 0 ? `?${parts.join("&")}` : "";
};

export const alumniApi = {
  async searchAlumni(filters: AlumniSearchFilters = {}): Promise<ApiResponse<PeopleSearchResponse>> {
    const params: Record<string, unknown> = {
      q: filters.q,
      batch: filters.batch,
      company: filters.company,
      skills: filters.skills,
      stream: filters.stream,
      openToWork: filters.openToWork,
      availableForReferral: filters.availableForReferral,
      availableForMentorship: filters.availableForMentorship,
      page: filters.page || 1,
      limit: filters.limit || 50,
    };

    if (filters.accountType) {
      params.accountType = filters.accountType;
    }

    const query = buildQueryString(params);
    logger.info("ALUMNI_API", `Searching people: ${query}`);
    return apiClient.get<PeopleSearchResponse>(`/api/people/search${query}`);
  },

  async getCompanyGroups(): Promise<ApiResponse<CompaniesResponse>> {
    logger.info("ALUMNI_API", "Fetching company groups");
    return apiClient.get<CompaniesResponse>("/api/people/companies");
  },

  async getMentors(
    page: number = 1,
    limit: number = 20,
    skills?: string[]
  ): Promise<ApiResponse<{ mentors: Mentor[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>> {
    const query = buildQueryString({ page, limit, skills });
    logger.info("ALUMNI_API", `Fetching mentors: ${query}`);
    return apiClient.get(`/api/mentorship/mentors${query}`);
  },

  async createMentorshipRequest(
    payload: MentorshipRequestPayload
  ): Promise<ApiResponse<{ request: MentorshipRequest }>> {
    logger.info("ALUMNI_API", "Creating mentorship request", { toUserId: payload.toUserId });
    return apiClient.post("/api/mentorship", payload);
  },

  async getMyMentorshipRequests(
    page: number = 1,
    limit: number = 20,
    status?: string
  ): Promise<ApiResponse<{ requests: MentorshipRequest[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>> {
    const query = buildQueryString({ page, limit, status });
    logger.info("ALUMNI_API", "Fetching my mentorship requests");
    return apiClient.get(`/api/mentorship/mine${query}`);
  },

  async respondToMentorshipRequest(
    requestId: string,
    status: "ACCEPTED" | "DECLINED"
  ): Promise<ApiResponse<{ request: MentorshipRequest }>> {
    logger.info("ALUMNI_API", `Responding to mentorship request: ${status}`);
    return apiClient.post(`/api/mentorship/${requestId}/respond`, { status });
  },

  async cancelMentorshipRequest(requestId: string): Promise<ApiResponse<{ message: string }>> {
    logger.info("ALUMNI_API", `Cancelling mentorship request: ${requestId}`);
    return apiClient.post(`/api/mentorship/${requestId}/cancel`);
  },

  async getPosts(
    page: number = 1,
    limit: number = 20,
    type?: string,
    tag?: string,
    authorId?: string
  ): Promise<ApiResponse<{ posts: CommunityPost[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>> {
    const query = buildQueryString({ page, limit, type, tag, authorId });
    logger.info("ALUMNI_API", "Fetching community posts");
    return apiClient.get(`/api/posts${query}`);
  },

  async createPost(payload: {
    content: string;
    type?: string;
    tags?: string[];
    company?: string;
    position?: string;
    location?: string;
    link?: string;
  }): Promise<ApiResponse<{ post: CommunityPost }>> {
    logger.info("ALUMNI_API", "Creating community post");
    return apiClient.post("/api/posts", payload);
  },

  async toggleLikePost(postId: string): Promise<ApiResponse<{ likeCount: number; isLiked: boolean }>> {
    logger.info("ALUMNI_API", `Toggling like on post: ${postId}`);
    return apiClient.post(`/api/posts/${postId}/like`);
  },

  async addComment(postId: string, text: string): Promise<ApiResponse<{ comments: CommunityPost["comments"] }>> {
    logger.info("ALUMNI_API", `Adding comment to post: ${postId}`);
    return apiClient.post(`/api/posts/${postId}/comment`, { text });
  },

  async getCommunityStats(): Promise<ApiResponse<{ stats: CommunityStats }>> {
    logger.info("ALUMNI_API", "Fetching community stats");
    return apiClient.get("/api/community/stats");
  },

  async getForums(
    page: number = 1,
    limit: number = 20,
    tag?: string,
    search?: string
  ): Promise<ApiResponse<{ topics: ForumTopic[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>> {
    const query = buildQueryString({ page, limit, tag, search });
    logger.info("ALUMNI_API", "Fetching forums");
    return apiClient.get(`/api/forums${query}`);
  },

  async followUser(userId: string): Promise<ApiResponse<{ message: string }>> {
    logger.info("ALUMNI_API", `Following user: ${userId}`);
    return apiClient.post(`/api/follow/${userId}/follow`);
  },
};

export default alumniApi;
