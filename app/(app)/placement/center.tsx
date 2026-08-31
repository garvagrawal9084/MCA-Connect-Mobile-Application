/**
 * SCIS Connect Mobile - Placement Center Main Screen
 * Faithfully reproduces the Placement Center dashboard, metric cards,
 * latest jobs grid, dedicated Closing Soon tab, and live debounced search.
 */

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

import { PlacementCenterHeader } from "@/components/placement/PlacementCenterHeader";
import { PlacementMetricGrid } from "@/components/placement/PlacementMetricGrid";
import { PlacementFilterTabs } from "@/components/placement/PlacementFilterTabs";
import { PlacementSearchBar } from "@/components/placement/PlacementSearchBar";
import { PlacementJobCard } from "@/components/placement/PlacementJobCard";
import { PlacementClosingSoonCard } from "@/components/placement/PlacementClosingSoonCard";
import { PlacementJobDetailModal } from "@/components/placement/PlacementJobDetailModal";

import {
  usePlacementCenterStore,
  PlacementFilterTab,
  normalizeSavedJobItem,
} from "@/features/placement/store";
import { useNotificationsStore } from "@/features/notifications/store";
import { PlacementJob, JobApplication, InterviewExperience } from "@/features/placement/types";
import { logger } from "@/utils/logger";

export default function PlacementCenterScreen() {
  const router = useRouter();

  // Store state
  const dashboardStats = usePlacementCenterStore((state) => state.dashboardStats);
  const isLoadingStats = usePlacementCenterStore((state) => state.isLoadingStats);
  const activeTab = usePlacementCenterStore((state) => state.activeTab);
  const searchQuery = usePlacementCenterStore((state) => state.searchQuery);
  const jobs = usePlacementCenterStore((state) => state.jobs);
  const isLoadingJobs = usePlacementCenterStore((state) => state.isLoadingJobs);
  const closingSoonJobs = usePlacementCenterStore((state) => state.closingSoonJobs);
  const isLoadingClosingSoon = usePlacementCenterStore((state) => state.isLoadingClosingSoon);
  const applications = usePlacementCenterStore((state) => state.applications);
  const bookmarks = usePlacementCenterStore((state) => state.bookmarks);
  const isLoadingBookmarks = usePlacementCenterStore((state) => state.isLoadingBookmarks);
  const experiences = usePlacementCenterStore((state) => state.experiences);
  const selectedJob = usePlacementCenterStore((state) => state.selectedJob);

  // Notification alerts state
  const jobAlertsEnabled = useNotificationsStore((state) => state.jobAlertsEnabled);
  const toggleJobAlerts = useNotificationsStore((state) => state.toggleJobAlerts);

  // Store actions
  const setActiveTab = usePlacementCenterStore((state) => state.setActiveTab);
  const setSearchQuery = usePlacementCenterStore((state) => state.setSearchQuery);
  const setSelectedJob = usePlacementCenterStore((state) => state.setSelectedJob);
  const fetchDashboardStats = usePlacementCenterStore((state) => state.fetchDashboardStats);
  const fetchJobs = usePlacementCenterStore((state) => state.fetchJobs);
  const fetchClosingSoon = usePlacementCenterStore((state) => state.fetchClosingSoon);
  const toggleSaveJob = usePlacementCenterStore((state) => state.toggleSaveJob);
  const upvoteExperience = usePlacementCenterStore((state) => state.upvoteExperience);

  const [localSearch, setLocalSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [activeJobModal, setActiveJobModal] = useState<PlacementJob | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial fetch
  useEffect(() => {
    logger.info("PLACEMENT_CENTER", "Mounting Placement Center screen");
    fetchDashboardStats();
    fetchClosingSoon();
    fetchJobs({
      jobType: activeTab === "internships" ? "internship" : "all",
      deadline: activeTab === "closing_soon" ? "closing_soon" : undefined,
    });
  }, [fetchDashboardStats, fetchClosingSoon, fetchJobs, activeTab]);

  // Deep-link auto-open if selectedJob is set (e.g. from notification banner or notifications screen)
  useEffect(() => {
    if (selectedJob) {
      setActiveJobModal(selectedJob);
    }
  }, [selectedJob]);

  // Debounced search handler
  const handleSearchChange = (text: string) => {
    setLocalSearch(text);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setSearchQuery(text);
      logger.info("PLACEMENT_CENTER", `Executing search query: "${text}"`);
      fetchJobs({
        search: text.trim(),
        jobType: activeTab === "internships" ? "internship" : "all",
        deadline: activeTab === "closing_soon" ? "closing_soon" : undefined,
      });
    }, 350);
  };

  const handleSearchSubmit = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setSearchQuery(localSearch);
    fetchJobs({
      search: localSearch.trim(),
      jobType: activeTab === "internships" ? "internship" : "all",
      deadline: activeTab === "closing_soon" ? "closing_soon" : undefined,
    });
  };

  const handleClearSearch = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setLocalSearch("");
    setSearchQuery("");
    fetchJobs({
      search: "",
      jobType: activeTab === "internships" ? "internship" : "all",
      deadline: activeTab === "closing_soon" ? "closing_soon" : undefined,
    });
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Promise.all([
      fetchDashboardStats(),
      fetchClosingSoon(),
      fetchJobs({
        search: localSearch.trim(),
        jobType: activeTab === "internships" ? "internship" : "all",
        deadline: activeTab === "closing_soon" ? "closing_soon" : undefined,
      }),
    ]);
    setRefreshing(false);
  }, [fetchDashboardStats, fetchClosingSoon, fetchJobs, activeTab, localSearch]);

  const handleBrowseAll = () => {
    setLocalSearch("");
    setSearchQuery("");
    setActiveTab("jobs");
    fetchJobs({ search: "", jobType: "all" });
  };

  const handleTabSelect = (tab: PlacementFilterTab) => {
    setActiveTab(tab);
  };

  const handleJobCardPress = (job: PlacementJob) => {
    setSelectedJob(job);
    setActiveJobModal(job);
  };

  // Filter closing soon by search if on closing soon tab
  const filteredClosingSoon = closingSoonJobs.filter((j) => {
    if (!localSearch.trim()) return true;
    const q = localSearch.toLowerCase();
    return (
      j.title.toLowerCase().includes(q) ||
      j.companyName.toLowerCase().includes(q) ||
      (j.location && j.location.toLowerCase().includes(q))
    );
  });

  // Normalize and resolve bookmarks from server list + in-memory saved jobs
  const savedJobItems: PlacementJob[] = (() => {
    const knownJobs = [...jobs, ...closingSoonJobs];
    const savedMap = new Map<string, PlacementJob>();

    // 1. Process server bookmarks
    bookmarks.forEach((b) => {
      const normalized = normalizeSavedJobItem(b, knownJobs);
      if (normalized) {
        savedMap.set(normalized._id, normalized);
      }
    });

    // 2. Merge jobs marked as saved in memory
    knownJobs.forEach((job) => {
      if (job.userState?.saved && !savedMap.has(job._id)) {
        savedMap.set(job._id, {
          ...job,
          userState: {
            ...job.userState,
            applied: job.userState?.applied || false,
            applicationStatus: job.userState?.applicationStatus || null,
            saved: true,
            collectionId: job.userState?.collectionId || null,
            reminder: job.userState?.reminder || false,
            reminderAt: job.userState?.reminderAt || null,
          },
        });
      }
    });

    const allSaved = Array.from(savedMap.values());
    if (!localSearch.trim()) return allSaved;

    const q = localSearch.toLowerCase();
    return allSaved.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        j.companyName.toLowerCase().includes(q) ||
        (j.location && j.location.toLowerCase().includes(q))
    );
  })();

  // Filter applications by search
  const filteredApplications = applications.filter((app) => {
    if (!localSearch.trim()) return true;
    const q = localSearch.toLowerCase();
    const jobObj = typeof app.job === "object" ? (app.job as PlacementJob) : null;
    return (
      (jobObj?.title && jobObj.title.toLowerCase().includes(q)) ||
      (jobObj?.companyName && jobObj.companyName.toLowerCase().includes(q)) ||
      (app.currentStatus && app.currentStatus.toLowerCase().includes(q))
    );
  });

  // Filter experiences by search
  const filteredExperiences = experiences.filter((exp) => {
    if (!localSearch.trim()) return true;
    const q = localSearch.toLowerCase();
    return (
      exp.company.toLowerCase().includes(q) ||
      exp.role.toLowerCase().includes(q) ||
      (exp.authorName && exp.authorName.toLowerCase().includes(q))
    );
  });

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAFA] dark:bg-slate-950">
      <StatusBar style="auto" />

      {/* Top Header */}
      <PlacementCenterHeader
        onBack={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#8B0000"
          />
        }
      >
        {/* Metric Summary Cards Grid (6 Cards) */}
        <PlacementMetricGrid
          stats={dashboardStats}
          onSelectTab={handleTabSelect}
        />

        {/* Filter Category Pills with Closing Soon tab */}
        <View className="mt-2 mb-2">
          <PlacementFilterTabs
            activeTab={activeTab}
            onTabChange={handleTabSelect}
            counts={{
              jobs: dashboardStats.openJobs,
              closingSoon: closingSoonJobs.length,
              internships: dashboardStats.internships,
              saved: dashboardStats.saved,
              applications: dashboardStats.applications,
              experiences: experiences.length,
            }}
          />
        </View>

        {/* Instant New Job Alerts Banner */}
        <View className="px-4 mb-2">
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              toggleJobAlerts(!jobAlertsEnabled);
            }}
            activeOpacity={0.85}
            className={`p-3 rounded-2xl border flex-row items-center justify-between ${
              jobAlertsEnabled
                ? "bg-rose-50/70 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-900/60"
                : "bg-slate-100/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800"
            }`}
          >
            <View className="flex-row items-center flex-1 mr-2">
              <View
                className={`w-8 h-8 rounded-xl items-center justify-center mr-2.5 ${
                  jobAlertsEnabled ? "bg-[#8B0000]" : "bg-slate-300 dark:bg-slate-700"
                }`}
              >
                <Ionicons
                  name={jobAlertsEnabled ? "notifications" : "notifications-off"}
                  size={15}
                  color="#FFFFFF"
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-slate-900 dark:text-white">
                  {jobAlertsEnabled ? "New Job Alerts Active" : "New Job Alerts Muted"}
                </Text>
                <Text className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5" numberOfLines={1}>
                  {jobAlertsEnabled
                    ? "You'll be notified immediately when new recruitment drives publish."
                    : "Tap to enable notifications when new jobs publish."}
                </Text>
              </View>
            </View>

            <View
              className={`px-2 py-0.5 rounded-full ${
                jobAlertsEnabled
                  ? "bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300"
                  : "bg-slate-200 dark:bg-slate-800"
              }`}
            >
              <Text
                className={`text-[10px] font-bold ${
                  jobAlertsEnabled
                    ? "text-emerald-800 dark:text-emerald-300"
                    : "text-slate-500"
                }`}
              >
                {jobAlertsEnabled ? "ON" : "OFF"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Search Bar for Opportunities */}
        <PlacementSearchBar
          value={localSearch}
          onChangeText={handleSearchChange}
          onClear={handleClearSearch}
          onSubmit={handleSearchSubmit}
          isLoading={isLoadingJobs && localSearch.length > 0}
          placeholder={
            activeTab === "closing_soon"
              ? "Search closing soon opportunities..."
              : activeTab === "internships"
              ? "Search internships by role, company, skills..."
              : activeTab === "saved"
              ? "Search saved jobs..."
              : activeTab === "applications"
              ? "Search applications by company, status..."
              : activeTab === "experiences"
              ? "Search experiences by company, role..."
              : "Search companies, roles, locations, skills..."
          }
        />

        {/* Active Search Filter Badge */}
        {localSearch.trim().length > 0 && (
          <View className="px-4 mb-3 flex-row items-center justify-between">
            <View className="flex-row items-center bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 px-3 py-1.5 rounded-full">
              <Ionicons name="search" size={12} color="#8B0000" />
              <Text className="text-[11px] font-bold text-[#8B0000] dark:text-red-400 ml-1.5">
                {`Results for "${localSearch.trim()}"`}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleClearSearch}
              className="flex-row items-center"
            >
              <Text className="text-xs font-semibold text-slate-500 mr-1">
                Clear search
              </Text>
              <Ionicons name="close" size={14} color="#64748B" />
            </TouchableOpacity>
          </View>
        )}

        {/* ── TAB 1 & 2: JOBS & INTERNSHIPS ── */}
        {(activeTab === "jobs" || activeTab === "internships") && (
          <View className="px-4">
            {/* Quick 1-row Closing Soon Banner on Jobs tab without blocking vertical view */}
            {activeTab === "jobs" && !localSearch.trim() && closingSoonJobs.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveTab("closing_soon");
                }}
                activeOpacity={0.85}
                className="bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 px-3.5 py-2.5 rounded-2xl mb-3 flex-row items-center justify-between shadow-xs"
              >
                <View className="flex-row items-center flex-1 mr-2">
                  <View className="w-2 h-2 rounded-full bg-rose-500 mr-2" />
                  <Text className="text-xs font-bold text-rose-900 dark:text-rose-200">
                    {closingSoonJobs.length} recruitment drives closing soon
                  </Text>
                </View>
                <View className="flex-row items-center bg-rose-100 dark:bg-rose-900/60 px-2 py-0.5 rounded-md">
                  <Text className="text-[11px] font-bold text-rose-700 dark:text-rose-300 mr-0.5">
                    View
                  </Text>
                  <Ionicons name="chevron-forward" size={12} color="#BE123C" />
                </View>
              </TouchableOpacity>
            )}

            {/* Section Header */}
            <View className="flex-row items-center justify-between mb-2.5">
              <Text className="text-sm font-black text-slate-900 dark:text-white">
                {localSearch.trim()
                  ? `Matching Opportunities (${jobs.length})`
                  : activeTab === "internships"
                  ? "Internship Opportunities"
                  : "Latest Jobs"}
              </Text>
              <TouchableOpacity onPress={handleBrowseAll}>
                <Text className="text-xs font-bold text-[#8B0000] dark:text-red-400">
                  View all
                </Text>
              </TouchableOpacity>
            </View>

            {/* Jobs List */}
            {isLoadingJobs && jobs.length === 0 ? (
              <View className="py-12 items-center justify-center">
                <ActivityIndicator size="small" color="#8B0000" />
                <Text className="text-xs text-slate-400 mt-2 font-medium">
                  Loading opportunities from placement cell...
                </Text>
              </View>
            ) : jobs.length === 0 ? (
              <View className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-8 items-center justify-center my-2">
                <View className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 items-center justify-center mb-3">
                  <Ionicons name="search-outline" size={26} color="#8B0000" />
                </View>
                <Text className="text-sm font-bold text-slate-800 dark:text-slate-200 text-center">
                  {localSearch.trim()
                    ? `No jobs match "${localSearch}"`
                    : "No opportunities found"}
                </Text>
                <Text className="text-xs text-slate-400 text-center mt-1">
                  {localSearch.trim()
                    ? "Try searching with different keywords, company name, or skills."
                    : "Try checking back soon for new drives."}
                </Text>
                {localSearch.trim() ? (
                  <TouchableOpacity
                    onPress={handleClearSearch}
                    className="mt-4 bg-[#8B0000] px-4 py-2 rounded-xl"
                  >
                    <Text className="text-xs font-bold text-white">
                      Clear Search
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : (
              jobs.map((job, index) => (
                <PlacementJobCard
                  key={job._id || `job-${index}`}
                  job={job}
                  delay={80 + index * 25}
                  onPress={() => handleJobCardPress(job)}
                  onToggleSave={() => toggleSaveJob(job._id)}
                />
              ))
            )}
          </View>
        )}

        {/* ── TAB: DEDICATED CLOSING SOON VIEW ── */}
        {activeTab === "closing_soon" && (
          <View className="px-4">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Ionicons name="alarm-outline" size={17} color="#8B0000" />
                <Text className="text-sm font-black text-slate-900 dark:text-white ml-1.5">
                  Closing Soon Opportunities ({filteredClosingSoon.length})
                </Text>
              </View>
            </View>

            {isLoadingClosingSoon && closingSoonJobs.length === 0 ? (
              <View className="py-12 items-center justify-center">
                <ActivityIndicator size="small" color="#8B0000" />
                <Text className="text-xs text-slate-400 mt-2 font-medium">
                  Loading urgent deadlines...
                </Text>
              </View>
            ) : filteredClosingSoon.length === 0 ? (
              <View className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-8 items-center justify-center my-2">
                <View className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 items-center justify-center mb-3">
                  <Ionicons name="checkmark-done-circle-outline" size={26} color="#059669" />
                </View>
                <Text className="text-sm font-bold text-slate-800 dark:text-slate-200 text-center">
                  No urgent deadlines right now
                </Text>
                <Text className="text-xs text-slate-400 text-center mt-1">
                  All active drives have comfortable application windows.
                </Text>
              </View>
            ) : (
              filteredClosingSoon.map((job, idx) => (
                <PlacementJobCard
                  key={job._id || `closing-soon-${idx}`}
                  job={job}
                  delay={80 + idx * 25}
                  onPress={() => handleJobCardPress(job)}
                  onToggleSave={() => toggleSaveJob(job._id)}
                />
              ))
            )}
          </View>
        )}

        {/* ── TAB 3: SAVED JOBS ── */}
        {activeTab === "saved" && (
          <View className="px-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sm font-black text-slate-900 dark:text-white">
                Saved Bookmarks ({savedJobItems.length})
              </Text>
            </View>

            {isLoadingBookmarks && savedJobItems.length === 0 ? (
              <View className="py-12 items-center justify-center">
                <ActivityIndicator size="small" color="#D97706" />
                <Text className="text-xs text-slate-400 mt-2 font-medium">
                  Loading your saved opportunities...
                </Text>
              </View>
            ) : savedJobItems.length === 0 ? (
              <View className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-8 items-center justify-center my-2">
                <View className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 items-center justify-center mb-3">
                  <Ionicons name="bookmark-outline" size={26} color="#D97706" />
                </View>
                <Text className="text-sm font-bold text-slate-800 dark:text-slate-200 text-center">
                  {localSearch.trim()
                    ? `No saved jobs match "${localSearch}"`
                    : "No saved opportunities yet"}
                </Text>
                <Text className="text-xs text-slate-400 text-center mt-1">
                  Bookmark jobs you are interested in to keep track of them here.
                </Text>
                {localSearch.trim() ? (
                  <TouchableOpacity
                    onPress={handleClearSearch}
                    className="mt-4 bg-[#8B0000] px-4 py-2 rounded-xl"
                  >
                    <Text className="text-xs font-bold text-white">
                      Clear Search
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : (
              savedJobItems.map((job, idx) => (
                <PlacementJobCard
                  key={job._id || `saved-${idx}`}
                  job={{
                    ...job,
                    userState: {
                      ...job.userState,
                      saved: true,
                      applied: job.userState?.applied || false,
                      applicationStatus: job.userState?.applicationStatus || null,
                      collectionId: null,
                      reminder: job.userState?.reminder || false,
                      reminderAt: null,
                    },
                  }}
                  delay={80 + idx * 30}
                  onPress={() => handleJobCardPress(job)}
                  onToggleSave={() => toggleSaveJob(job._id)}
                />
              ))
            )}
          </View>
        )}

        {/* ── TAB 4: MY APPLICATIONS ── */}
        {activeTab === "applications" && (
          <View className="px-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sm font-black text-slate-900 dark:text-white">
                My Applications ({filteredApplications.length})
              </Text>
            </View>

            {filteredApplications.length === 0 ? (
              <View className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-8 items-center justify-center my-2">
                <View className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 items-center justify-center mb-3">
                  <Ionicons name="document-text-outline" size={26} color="#4F46E5" />
                </View>
                <Text className="text-sm font-bold text-slate-800 dark:text-slate-200 text-center">
                  {localSearch.trim()
                    ? `No applications match "${localSearch}"`
                    : "No applications submitted yet"}
                </Text>
                <Text className="text-xs text-slate-400 text-center mt-1">
                  Browse open recruitment drives and apply to track your status.
                </Text>
              </View>
            ) : (
              filteredApplications.map((app, idx) => {
                const jobObj = typeof app.job === "object" ? (app.job as PlacementJob) : null;
                const companyTitle = jobObj?.companyName || "Recruitment Drive";
                const roleTitle = jobObj?.title || "Applicant";

                return (
                  <Animated.View
                    key={app._id || `app-${idx}`}
                    entering={FadeInDown.delay(80 + idx * 30).duration(260).springify().damping(20)}
                    className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 mb-3 shadow-xs"
                  >
                    <View className="flex-row items-start justify-between mb-2">
                      <View className="flex-1 mr-2">
                        <Text className="text-sm font-bold text-slate-900 dark:text-white">
                          {roleTitle}
                        </Text>
                        <Text className="text-xs text-slate-500 font-medium mt-0.5">
                          {companyTitle}
                        </Text>
                      </View>

                      <View className="bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-2.5 py-0.5 rounded-full">
                        <Text className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 capitalize">
                          {app.currentStatus ? app.currentStatus.replace("_", " ") : "Submitted"}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <Text className="text-[11px] text-slate-400">
                        Applied on {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : "Recent"}
                      </Text>

                      {jobObj && (
                        <TouchableOpacity
                          onPress={() => handleJobCardPress(jobObj)}
                          className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg"
                        >
                          <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            View Job
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </Animated.View>
                );
              })
            )}
          </View>
        )}

        {/* ── TAB 5: INTERVIEW EXPERIENCES ── */}
        {activeTab === "experiences" && (
          <View className="px-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sm font-black text-slate-900 dark:text-white">
                Interview Experiences ({filteredExperiences.length})
              </Text>
            </View>

            {filteredExperiences.length === 0 ? (
              <View className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-8 items-center justify-center my-2">
                <View className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/80 items-center justify-center mb-3">
                  <Ionicons name="people-outline" size={26} color="#7C3AED" />
                </View>
                <Text className="text-sm font-bold text-slate-800 dark:text-slate-200 text-center">
                  {localSearch.trim()
                    ? `No experiences match "${localSearch}"`
                    : "No interview experiences shared yet"}
                </Text>
                <Text className="text-xs text-slate-400 text-center mt-1">
                  Read tips and question archives from seniors across companies.
                </Text>
              </View>
            ) : (
              filteredExperiences.map((exp, idx) => (
                <Animated.View
                  key={exp._id || `exp-${idx}`}
                  entering={FadeInDown.delay(80 + idx * 30).duration(260).springify().damping(20)}
                  className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 mb-3 shadow-xs"
                >
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-1 mr-2">
                      <Text className="text-sm font-bold text-slate-900 dark:text-white">
                        {exp.company} — {exp.role}
                      </Text>
                      <Text className="text-xs text-slate-500 font-medium mt-0.5">
                        {exp.authorName || "Student"} · Batch {exp.batch || "2025"}
                      </Text>
                    </View>

                    <View
                      className={`px-2.5 py-0.5 rounded-full ${
                        exp.verdict === "selected"
                          ? "bg-emerald-50 border border-emerald-200"
                          : "bg-slate-100 border border-slate-200"
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-bold ${
                          exp.verdict === "selected"
                            ? "text-emerald-700"
                            : "text-slate-600"
                        } capitalize`}
                      >
                        {exp.verdict}
                      </Text>
                    </View>
                  </View>

                  {exp.overallExperience && (
                    <Text className="text-xs text-slate-600 dark:text-slate-300 leading-5 mb-3">
                      {exp.overallExperience}
                    </Text>
                  )}

                  <View className="flex-row items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800">
                    <Text className="text-[11px] font-semibold text-slate-400">
                      Difficulty: {exp.difficulty}
                    </Text>

                    <TouchableOpacity
                      onPress={() => upvoteExperience(exp._id)}
                      className="flex-row items-center bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg"
                    >
                      <Ionicons
                        name={exp.hasUpvoted ? "thumbs-up" : "thumbs-up-outline"}
                        size={13}
                        color={exp.hasUpvoted ? "#8B0000" : "#64748B"}
                      />
                      <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1.5">
                        {exp.upvotes || 0} Helpful
                      </Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Full Job Drill-down Modal */}
      <PlacementJobDetailModal
        visible={activeJobModal !== null}
        job={activeJobModal}
        onClose={() => {
          setActiveJobModal(null);
          setSelectedJob(null);
        }}
      />
    </SafeAreaView>
  );
}
