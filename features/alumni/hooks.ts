import { useCallback, useEffect, useRef } from "react";
import { useAlumniStore } from "./store";
import { AlumniSearchFilters } from "./types";

export function useAlumniSearch() {
  const fetchAlumni = useAlumniStore((s) => s.fetchAlumni);
  const fetchMoreAlumni = useAlumniStore((s) => s.fetchMoreAlumni);
  const alumni = useAlumniStore((s) => s.alumni);
  const isLoading = useAlumniStore((s) => s.isLoadingAlumni);
  const pagination = useAlumniStore((s) => s.alumniPagination);
  const searchQuery = useAlumniStore((s) => s.searchQuery);
  const setSearchQuery = useAlumniStore((s) => s.setSearchQuery);
  const activeFilters = useAlumniStore((s) => s.activeFilters);
  const setActiveFilters = useAlumniStore((s) => s.setActiveFilters);
  const clearFilters = useAlumniStore((s) => s.clearFilters);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(
    (query: string) => {
      setSearchQuery(query);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        fetchAlumni({ q: query } as AlumniSearchFilters);
      }, 400);
    },
    [fetchAlumni, setSearchQuery]
  );

  const applyFilters = useCallback(
    (filters: AlumniSearchFilters) => {
      setActiveFilters(filters);
      fetchAlumni(filters);
    },
    [fetchAlumni, setActiveFilters]
  );

  const hasMore = pagination ? pagination.page < pagination.totalPages : false;

  return {
    alumni,
    isLoading,
    hasMore,
    pagination,
    search,
    searchQuery,
    fetchMore: fetchMoreAlumni,
    applyFilters,
    activeFilters,
    clearFilters,
    refetch: () => fetchAlumni(),
  };
}

export function useAlumniCompanies() {
  const fetchCompanies = useAlumniStore((s) => s.fetchCompanies);
  const companies = useAlumniStore((s) => s.companies);
  const isLoading = useAlumniStore((s) => s.isLoadingCompanies);

  useEffect(() => {
    if (companies.length === 0) {
      fetchCompanies();
    }
  }, []);

  return { companies, isLoading, refetch: fetchCompanies };
}

export function useMentors() {
  const fetchMentors = useAlumniStore((s) => s.fetchMentors);
  const mentors = useAlumniStore((s) => s.mentors);
  const isLoading = useAlumniStore((s) => s.isLoadingMentors);
  const pagination = useAlumniStore((s) => s.mentorsPagination);

  useEffect(() => {
    if (mentors.length === 0) {
      fetchMentors();
    }
  }, []);

  const hasMore = pagination ? pagination.page < pagination.totalPages : false;

  return {
    mentors,
    isLoading,
    hasMore,
    fetchMore: () => {
      if (pagination && hasMore) {
        fetchMentors(pagination.page + 1);
      }
    },
    refetch: () => fetchMentors(1),
  };
}

export function useMentorshipRequests() {
  const fetchMyRequests = useAlumniStore((s) => s.fetchMyRequests);
  const myRequests = useAlumniStore((s) => s.myRequests);
  const isLoading = useAlumniStore((s) => s.isLoadingRequests);
  const createMentorshipRequest = useAlumniStore((s) => s.createMentorshipRequest);
  const respondToRequest = useAlumniStore((s) => s.respondToRequest);

  useEffect(() => {
    fetchMyRequests();
  }, []);

  return {
    myRequests,
    isLoading,
    createRequest: createMentorshipRequest,
    respondToRequest,
    refetch: fetchMyRequests,
  };
}

export function useAlumniPosts(type?: string) {
  const fetchPosts = useAlumniStore((s) => s.fetchPosts);
  const posts = useAlumniStore((s) => s.posts);
  const isLoading = useAlumniStore((s) => s.isLoadingPosts);
  const pagination = useAlumniStore((s) => s.postsPagination);
  const createPost = useAlumniStore((s) => s.createPost);
  const toggleLike = useAlumniStore((s) => s.toggleLike);

  useEffect(() => {
    fetchPosts(1, type);
  }, [type]);

  const hasMore = pagination ? pagination.page < pagination.totalPages : false;

  return {
    posts,
    isLoading,
    hasMore,
    fetchMore: () => {
      if (pagination && hasMore) {
        fetchPosts(pagination.page + 1, type);
      }
    },
    createPost,
    toggleLike,
    refetch: () => fetchPosts(1, type),
  };
}

export function useAlumniStats() {
  const fetchStats = useAlumniStore((s) => s.fetchStats);
  const stats = useAlumniStore((s) => s.stats);
  const isLoading = useAlumniStore((s) => s.isLoadingStats);

  useEffect(() => {
    if (!stats) {
      fetchStats();
    }
  }, []);

  return { stats, isLoading, refetch: fetchStats };
}

export function useAlumniForums() {
  const fetchForums = useAlumniStore((s) => s.fetchForums);
  const forums = useAlumniStore((s) => s.forums);
  const isLoading = useAlumniStore((s) => s.isLoadingForums);
  const pagination = useAlumniStore((s) => s.forumsPagination);

  useEffect(() => {
    fetchForums();
  }, []);

  const hasMore = pagination ? pagination.page < pagination.totalPages : false;

  return {
    forums,
    isLoading,
    hasMore,
    fetchMore: () => {
      if (pagination && hasMore) {
        fetchForums(pagination.page + 1);
      }
    },
    refetch: fetchForums,
  };
}
