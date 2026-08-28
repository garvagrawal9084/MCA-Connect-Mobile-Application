/**
 * SCIS Connect Mobile - Placement Center Custom Hooks
 */

import { useEffect, useCallback } from "react";
import { usePlacementCenterStore } from "./store";
import { PlacementFilterTab } from "./store";

export function usePlacementDashboard(autoFetch: boolean = true) {
  const stats = usePlacementCenterStore((state) => state.dashboardStats);
  const isLoadingStats = usePlacementCenterStore((state) => state.isLoadingStats);
  const closingSoonJobs = usePlacementCenterStore((state) => state.closingSoonJobs);
  const isLoadingClosingSoon = usePlacementCenterStore((state) => state.isLoadingClosingSoon);
  const fetchDashboardStats = usePlacementCenterStore((state) => state.fetchDashboardStats);
  const fetchClosingSoon = usePlacementCenterStore((state) => state.fetchClosingSoon);

  const refresh = useCallback(async () => {
    await Promise.all([fetchDashboardStats(), fetchClosingSoon()]);
  }, [fetchDashboardStats, fetchClosingSoon]);

  useEffect(() => {
    if (autoFetch) {
      refresh();
    }
  }, [autoFetch, refresh]);

  return {
    stats,
    isLoadingStats,
    closingSoonJobs,
    isLoadingClosingSoon,
    refresh,
  };
}

export function usePlacementJobs(tab: PlacementFilterTab = "jobs", autoFetch: boolean = true) {
  const jobs = usePlacementCenterStore((state) => state.jobs);
  const totalCount = usePlacementCenterStore((state) => state.totalJobsCount);
  const isLoadingJobs = usePlacementCenterStore((state) => state.isLoadingJobs);
  const searchQuery = usePlacementCenterStore((state) => state.searchQuery);
  const fetchJobs = usePlacementCenterStore((state) => state.fetchJobs);
  const setSearchQuery = usePlacementCenterStore((state) => state.setSearchQuery);

  const refresh = useCallback(async () => {
    if (tab === "internships") {
      await fetchJobs({ jobType: "internship" });
    } else {
      await fetchJobs({ jobType: "all" });
    }
  }, [tab, fetchJobs]);

  useEffect(() => {
    if (autoFetch && (tab === "jobs" || tab === "internships")) {
      refresh();
    }
  }, [tab, autoFetch, refresh]);

  return {
    jobs,
    totalCount,
    isLoading: isLoadingJobs,
    searchQuery,
    setSearchQuery,
    refresh,
  };
}

export function useJobActions() {
  const applyToJob = usePlacementCenterStore((state) => state.applyToJob);
  const toggleSaveJob = usePlacementCenterStore((state) => state.toggleSaveJob);
  const createReminder = usePlacementCenterStore((state) => state.createReminder);
  const cancelReminder = usePlacementCenterStore((state) => state.cancelReminder);
  const fetchJobDetail = usePlacementCenterStore((state) => state.fetchJobDetail);
  const selectedJob = usePlacementCenterStore((state) => state.selectedJob);
  const setSelectedJob = usePlacementCenterStore((state) => state.setSelectedJob);
  const isLoadingJobDetail = usePlacementCenterStore((state) => state.isLoadingJobDetail);

  return {
    applyToJob,
    toggleSaveJob,
    createReminder,
    cancelReminder,
    fetchJobDetail,
    selectedJob,
    setSelectedJob,
    isLoadingJobDetail,
  };
}
