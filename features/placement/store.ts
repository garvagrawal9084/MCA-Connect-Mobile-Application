/**
 * SCIS Connect Mobile - Placement Center Zustand Store
 * Manages client state, live API synchronization, and optimistic user actions.
 */

import { create } from "zustand";
import {
  PlacementJob,
  PlacementDashboardStats,
  JobApplication,
  SavedOpportunity,
  JobReminder,
  InterviewExperience,
  PlacementQueryParams,
} from "./types";
import { placementCenterApi } from "./api";
import { jobWatcher } from "./jobWatcher";
import { logger } from "@/utils/logger";

export type PlacementFilterTab =
  | "jobs"
  | "closing_soon"
  | "internships"
  | "saved"
  | "applications"
  | "experiences";

interface PlacementCenterState {
  // Stats
  dashboardStats: PlacementDashboardStats;
  isLoadingStats: boolean;

  // Active Tab & Search
  activeTab: PlacementFilterTab;
  searchQuery: string;

  // Jobs
  jobs: PlacementJob[];
  totalJobsCount: number;
  isLoadingJobs: boolean;
  closingSoonJobs: PlacementJob[];
  isLoadingClosingSoon: boolean;

  // Applications & Saved
  applications: JobApplication[];
  isLoadingApplications: boolean;
  bookmarks: SavedOpportunity[];
  isLoadingBookmarks: boolean;
  reminders: JobReminder[];
  isLoadingReminders: boolean;

  // Experiences
  experiences: InterviewExperience[];
  isLoadingExperiences: boolean;

  // Job Drilldown Detail
  selectedJob: PlacementJob | null;
  isLoadingJobDetail: boolean;

  // Actions
  setActiveTab: (tab: PlacementFilterTab) => void;
  setSearchQuery: (query: string) => void;
  setSelectedJob: (job: PlacementJob | null) => void;

  fetchDashboardStats: () => Promise<void>;
  fetchJobs: (params?: PlacementQueryParams) => Promise<void>;
  fetchClosingSoon: () => Promise<void>;
  fetchJobDetail: (id: string) => Promise<PlacementJob | null>;
  fetchApplications: () => Promise<void>;
  fetchBookmarks: () => Promise<void>;
  fetchReminders: () => Promise<void>;
  fetchExperiences: (company?: string) => Promise<void>;

  applyToJob: (
    jobId: string,
    payload?: { resume?: string; coverLetter?: string; notes?: string }
  ) => Promise<{ success: boolean; message?: string }>;

  toggleSaveJob: (
    jobId: string
  ) => Promise<{ saved: boolean; message?: string }>;

  createReminder: (
    jobId: string,
    remindAt: string
  ) => Promise<{ success: boolean; message?: string }>;

  cancelReminder: (
    reminderId: string,
    jobId?: string
  ) => Promise<{ success: boolean }>;

  upvoteExperience: (id: string) => Promise<void>;
}

const DEFAULT_STATS: PlacementDashboardStats = {
  openJobs: 0,
  internships: 0,
  newThisWeek: 0,
  applications: 0,
  saved: 0,
  reminders: 0,
};

export const usePlacementCenterStore = create<PlacementCenterState>(
  (set, get) => ({
    dashboardStats: DEFAULT_STATS,
    isLoadingStats: false,

    activeTab: "jobs",
    searchQuery: "",

    jobs: [],
    totalJobsCount: 0,
    isLoadingJobs: false,
    closingSoonJobs: [],
    isLoadingClosingSoon: false,

    applications: [],
    isLoadingApplications: false,
    bookmarks: [],
    isLoadingBookmarks: false,
    reminders: [],
    isLoadingReminders: false,

    experiences: [],
    isLoadingExperiences: false,

    selectedJob: null,
    isLoadingJobDetail: false,

    setActiveTab: (tab) => {
      set({ activeTab: tab });
      // Trigger data fetch for specific tabs if needed
      if (tab === "applications") {
        get().fetchApplications();
      } else if (tab === "saved") {
        get().fetchBookmarks();
      } else if (tab === "experiences") {
        get().fetchExperiences();
      } else if (tab === "closing_soon") {
        get().fetchJobs({ deadline: "closing_soon" });
        get().fetchClosingSoon();
      } else if (tab === "internships") {
        get().fetchJobs({ jobType: "internship" });
      } else if (tab === "jobs") {
        get().fetchJobs({ jobType: "all" });
      }
    },

    setSearchQuery: (searchQuery) => {
      set({ searchQuery });
    },

    setSelectedJob: (selectedJob) => {
      set({ selectedJob });
    },

    fetchDashboardStats: async () => {
      set({ isLoadingStats: true });
      try {
        const res = await placementCenterApi.getDashboard();
        const raw = (res.data || {}) as Record<string, unknown>;
        const dataObj = (raw.stats || raw.data || raw) as Record<string, unknown>;

        // Fetch auxiliary counts in parallel to ensure accurate badge and card values
        const [appsRes, savedRes, remindersRes] = await Promise.allSettled([
          placementCenterApi.getMyApplications(),
          placementCenterApi.getSavedJobs(),
          placementCenterApi.getMyReminders(),
        ]);

        const appsCount =
          appsRes.status === "fulfilled"
            ? appsRes.value.data?.applications?.length ?? 0
            : 0;
        const savedCount =
          savedRes.status === "fulfilled"
            ? (savedRes.value.data?.bookmarks || savedRes.value.data?.saved)?.length ?? 0
            : 0;
        const remindersCount =
          remindersRes.status === "fulfilled"
            ? remindersRes.value.data?.reminders?.length ?? 0
            : 0;

        const openJobs = Number(
          dataObj.openJobs ??
          dataObj.totalJobs ??
          dataObj.publishedJobs ??
          raw.openJobs ??
          0
        );
        const internships = Number(
          dataObj.internships ??
          dataObj.totalInternships ??
          raw.internships ??
          0
        );
        const newThisWeek = Number(
          dataObj.newThisWeek ??
          dataObj.newJobs ??
          dataObj.recentJobs ??
          raw.newThisWeek ??
          0
        );

        const stats: PlacementDashboardStats = {
          openJobs,
          internships,
          newThisWeek,
          applications: Number(dataObj.applications ?? dataObj.totalApplications ?? appsCount),
          saved: Number(dataObj.saved ?? dataObj.totalSaved ?? savedCount),
          reminders: Number(dataObj.reminders ?? dataObj.totalReminders ?? remindersCount),
        };

        set({
          dashboardStats: stats,
          isLoadingStats: false,
        });
      } catch (err) {
        logger.warn("PLACEMENT_STORE", "Failed to fetch dashboard stats", err);
        set({ isLoadingStats: false });
      }
    },

    fetchJobs: async (params) => {
      set({ isLoadingJobs: true });
      try {
        const searchToUse =
          params?.search !== undefined ? params.search : get().searchQuery;

        const queryParams: PlacementQueryParams = {
          limit: 20,
          ...params,
          search: searchToUse || undefined,
        };

        const res = await placementCenterApi.getJobs(queryParams);
        const rawJobs = res.data?.jobs || [];
        const jobs = rawJobs.filter((j) => j.hiddenFromUsers !== true);
        const total = res.data?.pagination?.total || jobs.length;

        // Inspect fetched jobs and notify for newly discovered opportunities
        jobWatcher.inspectAndNotifyNewJobs(jobs);

        set({
          jobs,
          totalJobsCount: total,
          isLoadingJobs: false,
        });
      } catch (err) {
        logger.error("PLACEMENT_STORE", "Failed to fetch jobs list", err);
        set({ isLoadingJobs: false });
      }
    },

    fetchClosingSoon: async () => {
      set({ isLoadingClosingSoon: true });
      try {
        const res = await placementCenterApi.getJobs({
          deadline: "closing_soon",
          limit: 8,
        });
        const rawClosing = res.data?.jobs || [];
        const closingSoonJobs = rawClosing.filter((j) => j.hiddenFromUsers !== true);
        set({
          closingSoonJobs,
          isLoadingClosingSoon: false,
        });
      } catch (err) {
        logger.warn("PLACEMENT_STORE", "Failed to fetch closing soon jobs", err);
        set({ isLoadingClosingSoon: false });
      }
    },

    fetchJobDetail: async (id: string) => {
      set({ isLoadingJobDetail: true });
      try {
        const res = await placementCenterApi.getJobById(id);
        const job = res.data?.job || null;
        if (job) {
          set({ selectedJob: job, isLoadingJobDetail: false });
        }
        return job;
      } catch (err) {
        logger.error("PLACEMENT_STORE", `Failed to fetch job: ${id}`, err);
        set({ isLoadingJobDetail: false });
        return null;
      }
    },

    fetchApplications: async () => {
      set({ isLoadingApplications: true });
      try {
        const res = await placementCenterApi.getMyApplications();
        const applications = res.data?.applications || [];
        set({
          applications,
          isLoadingApplications: false,
          dashboardStats: {
            ...get().dashboardStats,
            applications: applications.length,
          },
        });
      } catch (err) {
        logger.warn("PLACEMENT_STORE", "Failed to fetch applications", err);
        set({ isLoadingApplications: false });
      }
    },

    fetchBookmarks: async () => {
      set({ isLoadingBookmarks: true });
      try {
        const res = await placementCenterApi.getSavedJobs();
        const bookmarks = res.data?.bookmarks || res.data?.saved || [];
        set({
          bookmarks,
          isLoadingBookmarks: false,
          dashboardStats: {
            ...get().dashboardStats,
            saved: bookmarks.length,
          },
        });
      } catch (err) {
        logger.warn("PLACEMENT_STORE", "Failed to fetch bookmarks", err);
        set({ isLoadingBookmarks: false });
      }
    },

    fetchReminders: async () => {
      set({ isLoadingReminders: true });
      try {
        const res = await placementCenterApi.getMyReminders();
        const reminders = res.data?.reminders || [];
        set({
          reminders,
          isLoadingReminders: false,
          dashboardStats: {
            ...get().dashboardStats,
            reminders: reminders.length,
          },
        });
      } catch (err) {
        logger.warn("PLACEMENT_STORE", "Failed to fetch reminders", err);
        set({ isLoadingReminders: false });
      }
    },

    fetchExperiences: async (company) => {
      set({ isLoadingExperiences: true });
      try {
        const res = await placementCenterApi.getExperiences({ company });
        set({
          experiences: res.data?.experiences || [],
          isLoadingExperiences: false,
        });
      } catch (err) {
        logger.warn("PLACEMENT_STORE", "Failed to fetch experiences", err);
        set({ isLoadingExperiences: false });
      }
    },

    applyToJob: async (jobId, payload) => {
      // Optimistic update for jobs list
      const previousJobs = get().jobs;
      set({
        jobs: previousJobs.map((j) =>
          j._id === jobId
            ? {
                ...j,
                userState: {
                  ...j.userState,
                  applied: true,
                  applicationStatus: "submitted",
                  saved: j.userState?.saved || false,
                  collectionId: j.userState?.collectionId || null,
                  reminder: j.userState?.reminder || false,
                  reminderAt: j.userState?.reminderAt || null,
                },
              }
            : j
        ),
      });

      try {
        const res = await placementCenterApi.applyToJob(jobId, payload);
        if (res.success) {
          get().fetchApplications();
          return { success: true, message: res.message || "Applied successfully!" };
        }
        return { success: false, message: res.message || "Failed to apply" };
      } catch (err: unknown) {
        // Rollback
        set({ jobs: previousJobs });
        const errMsg = err instanceof Error ? err.message : "Could not submit application";
        return { success: false, message: errMsg };
      }
    },

    toggleSaveJob: async (jobId) => {
      const job = get().jobs.find((j) => j._id === jobId);
      const isCurrentlySaved = job?.userState?.saved ?? false;
      const targetState = !isCurrentlySaved;

      // Optimistic update
      const previousJobs = get().jobs;
      set({
        jobs: previousJobs.map((j) =>
          j._id === jobId
            ? {
                ...j,
                userState: {
                  applied: j.userState?.applied || false,
                  applicationStatus: j.userState?.applicationStatus || null,
                  saved: targetState,
                  collectionId: j.userState?.collectionId || null,
                  reminder: j.userState?.reminder || false,
                  reminderAt: j.userState?.reminderAt || null,
                },
              }
            : j
        ),
        dashboardStats: {
          ...get().dashboardStats,
          saved: Math.max(
            0,
            get().dashboardStats.saved + (targetState ? 1 : -1)
          ),
        },
      });

      try {
        if (targetState) {
          await placementCenterApi.saveJob(jobId);
        } else {
          await placementCenterApi.unsaveJob(jobId);
        }
        return {
          saved: targetState,
          message: targetState ? "Saved to your bookmarks" : "Removed from bookmarks",
        };
      } catch (err) {
        // Rollback on failure
        set({ jobs: previousJobs });
        logger.warn("PLACEMENT_STORE", `Failed to toggle save for job: ${jobId}`, err);
        return { saved: isCurrentlySaved, message: "Action failed. Please try again." };
      }
    },

    createReminder: async (jobId, remindAt) => {
      try {
        const res = await placementCenterApi.createReminder(jobId, remindAt);
        if (res.success) {
          // Optimistically update
          set({
            jobs: get().jobs.map((j) =>
              j._id === jobId
                ? {
                    ...j,
                    userState: {
                      applied: j.userState?.applied || false,
                      applicationStatus: j.userState?.applicationStatus || null,
                      saved: j.userState?.saved || false,
                      collectionId: j.userState?.collectionId || null,
                      reminder: true,
                      reminderAt: remindAt,
                    },
                  }
                : j
            ),
            dashboardStats: {
              ...get().dashboardStats,
              reminders: get().dashboardStats.reminders + 1,
            },
          });
          get().fetchReminders();
          return { success: true, message: "Reminder scheduled successfully!" };
        }
        return { success: false, message: "Could not set reminder" };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error setting reminder";
        return { success: false, message: msg };
      }
    },

    cancelReminder: async (reminderId, jobId) => {
      try {
        await placementCenterApi.deleteReminder(reminderId);
        set({
          reminders: get().reminders.filter((r) => r._id !== reminderId),
          jobs: jobId
            ? get().jobs.map((j) =>
                j._id === jobId
                  ? {
                      ...j,
                      userState: {
                        applied: j.userState?.applied || false,
                        applicationStatus: j.userState?.applicationStatus || null,
                        saved: j.userState?.saved || false,
                        collectionId: j.userState?.collectionId || null,
                        reminder: false,
                        reminderAt: null,
                      },
                    }
                  : j
              )
            : get().jobs,
          dashboardStats: {
            ...get().dashboardStats,
            reminders: Math.max(0, get().dashboardStats.reminders - 1),
          },
        });
        return { success: true };
      } catch {
        return { success: false };
      }
    },

    upvoteExperience: async (id) => {
      // Optimistic update
      set({
        experiences: get().experiences.map((e) =>
          e._id === id
            ? {
                ...e,
                upvotes: (e.upvotes || 0) + (e.hasUpvoted ? -1 : 1),
                hasUpvoted: !e.hasUpvoted,
              }
            : e
        ),
      });

      try {
        await placementCenterApi.upvoteExperience(id);
      } catch (err) {
        logger.warn("PLACEMENT_STORE", `Failed to upvote experience: ${id}`, err);
      }
    },
  })
);
