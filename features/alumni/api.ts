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

  async getFamilyCounts(): Promise<ApiResponse<{ counts: Record<string, number> }>> {
    logger.info("ALUMNI_API", "Fetching SCIS family counts");
    return apiClient.get("/api/mca-family/family-counts");
  },

  async getEvents(params: { startDate?: string; endDate?: string; eventType?: string; page?: number; limit?: number } = {}): Promise<ApiResponse<{ events: Array<{
    _id: string;
    title: string;
    description: string;
    fromDate: string;
    toDate: string | null;
    eventType: string;
    color: string;
    targetAudience: string;
    isAllDay: boolean;
    startTime: string | null;
    endTime: string | null;
    createdBy: { id: string; name: string; email: string } | null;
    createdAt: string;
  }>; pagination?: { page: number; limit: number; total: number; totalPages: number } }>> {
    const query = buildQueryString({ startDate: params.startDate, endDate: params.endDate, eventType: params.eventType, page: params.page || 1, limit: params.limit || 50 });
    logger.info("ALUMNI_API", `Fetching events: ${query}`);
    return apiClient.get(`/api/calendar${query}`);
  },

  async getFamilyBatchMembers(
    program: string,
    params: { batch?: string; q?: string; page?: number; limit?: number } = {}
  ): Promise<ApiResponse<{ members: Array<Record<string, unknown>>; pagination: { page: number; limit: number; total: number; totalPages: number } }>> {
    const query = buildQueryString({ program, batch: params.batch || "all", q: params.q, page: params.page || 1, limit: params.limit || 50 });
    logger.info("ALUMNI_API", `Fetching family batch members: ${query}`);
    return apiClient.get(`/api/mca-family/batch-members${query}`);
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

  async getForumTopic(topicId: string): Promise<ApiResponse<{ topic: ForumTopic }>> {
    logger.info("ALUMNI_API", `Fetching forum topic: ${topicId}`);
    return apiClient.get(`/api/forums/${topicId}`);
  },

  async createForumTopic(payload: {
    title: string;
    content: string;
    tags?: string[];
  }): Promise<ApiResponse<{ topic: ForumTopic }>> {
    logger.info("ALUMNI_API", "Creating forum topic");
    return apiClient.post("/api/forums", payload);
  },

  async addForumReply(topicId: string, text: string): Promise<ApiResponse<{ replies: ForumTopic["replies"] }>> {
    logger.info("ALUMNI_API", `Adding reply to forum topic: ${topicId}`);
    return apiClient.post(`/api/forums/${topicId}/reply`, { text });
  },

  async toggleForumLike(topicId: string): Promise<ApiResponse<{ likeCount: number; isLiked: boolean }>> {
    logger.info("ALUMNI_API", `Toggling like on forum topic: ${topicId}`);
    return apiClient.post(`/api/forums/${topicId}/like`);
  },

  async closeForumTopic(topicId: string): Promise<ApiResponse<{ message: string }>> {
    logger.info("ALUMNI_API", `Closing forum topic: ${topicId}`);
    return apiClient.patch(`/api/forums/${topicId}/close`);
  },

  async followUser(userId: string): Promise<ApiResponse<{ message: string }>> {
    logger.info("ALUMNI_API", `Following user: ${userId}`);
    return apiClient.post(`/api/follow/${userId}/follow`);
  },
};

export default alumniApi;
