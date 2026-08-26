import { create } from "zustand";
import { logger } from "@/utils/logger";
import alumniApi from "./api";
import {
  AlumniUser,
  AlumniSearchFilters,
  CompanyGroup,
  Mentor,
  MentorshipRequest,
  CommunityPost,
  CommunityStats,
  ForumTopic,
} from "./types";

export interface AlumniState {
  alumni: AlumniUser[];
  alumniPagination: { page: number; limit: number; total: number; totalPages: number } | null;
  isLoadingAlumni: boolean;

  companies: CompanyGroup[];
  isLoadingCompanies: boolean;

  mentors: Mentor[];
  mentorsPagination: { page: number; limit: number; total: number; totalPages: number } | null;
  isLoadingMentors: boolean;

  myRequests: MentorshipRequest[];
  isLoadingRequests: boolean;

  posts: CommunityPost[];
  postsPagination: { page: number; limit: number; total: number; totalPages: number } | null;
  isLoadingPosts: boolean;

  forums: ForumTopic[];
  forumsPagination: { page: number; limit: number; total: number; totalPages: number } | null;
  isLoadingForums: boolean;

  stats: CommunityStats | null;
  isLoadingStats: boolean;

  activeFilters: AlumniSearchFilters;
  searchQuery: string;

  error: string | null;

  fetchAlumni: (filters?: AlumniSearchFilters, append?: boolean) => Promise<void>;
  fetchMoreAlumni: () => Promise<void>;
  fetchCompanies: () => Promise<void>;
  fetchMentors: (page?: number, skills?: string[]) => Promise<void>;
  fetchMyRequests: () => Promise<void>;
  createMentorshipRequest: (toUserId: string, areas: string[], message: string) => Promise<boolean>;
  respondToRequest: (requestId: string, status: "ACCEPTED" | "DECLINED") => Promise<boolean>;
  fetchPosts: (page?: number, type?: string) => Promise<void>;
  createPost: (content: string, type?: string, tags?: string[]) => Promise<boolean>;
  toggleLike: (postId: string) => Promise<void>;
  fetchForums: (page?: number, search?: string) => Promise<void>;
  createForumTopic: (title: string, content: string, tags?: string[]) => Promise<boolean>;
  addForumReply: (topicId: string, text: string) => Promise<boolean>;
  toggleForumLike: (topicId: string) => Promise<void>;
  fetchStats: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  setActiveFilters: (filters: AlumniSearchFilters) => void;
  clearFilters: () => void;
  clearError: () => void;
}

export const useAlumniStore = create<AlumniState>((set, get) => ({
  alumni: [],
  alumniPagination: null,
  isLoadingAlumni: false,

  companies: [],
  isLoadingCompanies: false,

  mentors: [],
  mentorsPagination: null,
  isLoadingMentors: false,

  myRequests: [],
  isLoadingRequests: false,

  posts: [],
  postsPagination: null,
  isLoadingPosts: false,

  forums: [],
  forumsPagination: null,
  isLoadingForums: false,

  stats: null,
  isLoadingStats: false,

  activeFilters: {},
  searchQuery: "",
  error: null,

  fetchAlumni: async (filters?: AlumniSearchFilters, append = false) => {
    set({ isLoadingAlumni: true, error: null });
    try {
      const incomingFilters = filters || {};
      const page = append && get().alumniPagination ? get().alumniPagination!.page + 1 : (incomingFilters.page || 1);

      const response = await alumniApi.searchAlumni({
        ...incomingFilters,
        page,
        limit: incomingFilters.limit || 50,
      });

      if (response.data) {
        const newAlumni = response.data.people || [];
        set({
          alumni: append ? [...get().alumni, ...newAlumni] : newAlumni,
          alumniPagination: response.data.pagination,
          isLoadingAlumni: false,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch alumni";
      logger.error("ALUMNI_STORE", message, err);
      set({ isLoadingAlumni: false, error: message });
    }
  },

  fetchMoreAlumni: async () => {
    const { alumniPagination, isLoadingAlumni } = get();
    if (isLoadingAlumni || !alumniPagination) return;
    if (alumniPagination.page >= alumniPagination.totalPages) return;
    await get().fetchAlumni(undefined, true);
  },

  fetchCompanies: async () => {
    set({ isLoadingCompanies: true, error: null });
    try {
      const response = await alumniApi.getCompanyGroups();
      if (response.data) {
        set({ companies: response.data.companies || [], isLoadingCompanies: false });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch companies";
      logger.error("ALUMNI_STORE", message, err);
      set({ isLoadingCompanies: false, error: message });
    }
  },

  fetchMentors: async (page = 1, skills?: string[]) => {
    set({ isLoadingMentors: true, error: null });
    try {
      const response = await alumniApi.getMentors(page, 20, skills);
      if (response.data) {
        set({
          mentors: page === 1 ? (response.data.mentors || []) : [...get().mentors, ...(response.data.mentors || [])],
          mentorsPagination: response.data.pagination,
          isLoadingMentors: false,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch mentors";
      logger.error("ALUMNI_STORE", message, err);
      set({ isLoadingMentors: false, error: message });
    }
  },

  fetchMyRequests: async () => {
    set({ isLoadingRequests: true, error: null });
    try {
      const response = await alumniApi.getMyMentorshipRequests();
      if (response.data) {
        set({ myRequests: response.data.requests || [], isLoadingRequests: false });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch requests";
      logger.error("ALUMNI_STORE", message, err);
      set({ isLoadingRequests: false, error: message });
    }
  },

  createMentorshipRequest: async (toUserId, areas, message) => {
    set({ error: null });
    try {
      await alumniApi.createMentorshipRequest({ toUserId, areas, message });
      await get().fetchMyRequests();
      return true;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Failed to send request";
      logger.error("ALUMNI_STORE", errMsg, err);
      set({ error: errMsg });
      return false;
    }
  },

  respondToRequest: async (requestId, status) => {
    set({ error: null });
    try {
      await alumniApi.respondToMentorshipRequest(requestId, status);
      await get().fetchMyRequests();
      return true;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Failed to respond";
      logger.error("ALUMNI_STORE", errMsg, err);
      set({ error: errMsg });
      return false;
    }
  },

  fetchPosts: async (page = 1, type?: string) => {
    set({ isLoadingPosts: true, error: null });
    try {
      const response = await alumniApi.getPosts(page, 20, type);
      if (response.data) {
        set({
          posts: page === 1 ? (response.data.posts || []) : [...get().posts, ...(response.data.posts || [])],
          postsPagination: response.data.pagination,
          isLoadingPosts: false,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch posts";
      logger.error("ALUMNI_STORE", message, err);
      set({ isLoadingPosts: false, error: message });
    }
  },

  createPost: async (content, type = "post", tags = []) => {
    set({ error: null });
    try {
      await alumniApi.createPost({ content, type, tags });
      await get().fetchPosts(1, undefined);
      return true;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Failed to create post";
      logger.error("ALUMNI_STORE", errMsg, err);
      set({ error: errMsg });
      return false;
    }
  },

  toggleLike: async (postId) => {
    try {
      const response = await alumniApi.toggleLikePost(postId);
      if (response.data) {
        set((state) => ({
          posts: state.posts.map((p) =>
            p._id === postId
              ? { ...p, likeCount: response.data!.likeCount, isLiked: response.data!.isLiked }
              : p
          ),
        }));
      }
    } catch (err) {
      logger.error("ALUMNI_STORE", "Failed to toggle like", err);
    }
  },

  fetchForums: async (page = 1, search?: string) => {
    set({ isLoadingForums: true, error: null });
    try {
      const response = await alumniApi.getForums(page, 20, undefined, search);
      if (response.data) {
        set({
          forums: page === 1 ? (response.data.topics || []) : [...get().forums, ...(response.data.topics || [])],
          forumsPagination: response.data.pagination,
          isLoadingForums: false,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch forums";
      logger.error("ALUMNI_STORE", message, err);
      set({ isLoadingForums: false, error: message });
    }
  },

  createForumTopic: async (title, content, tags = []) => {
    set({ error: null });
    try {
      await alumniApi.createForumTopic({ title, content, tags });
      await get().fetchForums(1);
      return true;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Failed to create topic";
      logger.error("ALUMNI_STORE", errMsg, err);
      set({ error: errMsg });
      return false;
    }
  },

  addForumReply: async (topicId, text) => {
    set({ error: null });
    try {
      const response = await alumniApi.addForumReply(topicId, text);
      if (response.data) {
        set((state) => ({
          forums: state.forums.map((t) =>
            t._id === topicId ? { ...t, replies: response.data!.replies } : t
          ),
        }));
      }
      return true;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Failed to add reply";
      logger.error("ALUMNI_STORE", errMsg, err);
      set({ error: errMsg });
      return false;
    }
  },

  toggleForumLike: async (topicId) => {
    try {
      const response = await alumniApi.toggleForumLike(topicId);
      if (response.data) {
        set((state) => ({
          forums: state.forums.map((t) =>
            t._id === topicId
              ? { ...t, likeCount: response.data!.likeCount, isLiked: response.data!.isLiked }
              : t
          ),
        }));
      }
    } catch (err) {
      logger.error("ALUMNI_STORE", "Failed to toggle forum like", err);
    }
  },

  fetchStats: async () => {
    set({ isLoadingStats: true });
    try {
      const response = await alumniApi.getCommunityStats();
      if (response.data) {
        set({ stats: response.data.stats || null, isLoadingStats: false });
      }
    } catch (err) {
      logger.error("ALUMNI_STORE", "Failed to fetch stats", err);
      set({ isLoadingStats: false });
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setActiveFilters: (filters) => set({ activeFilters: filters }),
  clearFilters: () => set({ activeFilters: {}, searchQuery: "" }),
  clearError: () => set({ error: null }),
}));

export default useAlumniStore;
