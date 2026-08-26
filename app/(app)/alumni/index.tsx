import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useAlumniStore } from "@/features/alumni/store";
import { AlumniSearchBar } from "@/components/alumni/AlumniSearchBar";
import { AlumniGridCard } from "@/components/alumni/AlumniGridCard";
import { AlumniStatsRow } from "@/components/alumni/AlumniStatsRow";
import { useAlumniStats } from "@/features/alumni/hooks";
import { AlumniSearchFilters, AlumniUser } from "@/features/alumni/types";
import { logger } from "@/utils/logger";

const TAB_OPTIONS = [
  { key: "directory", label: "Directory", icon: "people-outline" },
  { key: "mentors", label: "Mentors", icon: "school-outline" },
  { key: "community", label: "Community", icon: "chatbubbles-outline" },
  { key: "companies", label: "Companies", icon: "business-outline" },
] as const;

const TYPE_FILTERS = [
  { label: "All", value: "" },
  { label: "Student", value: "Student" },
  { label: "Recent Grad", value: "RecentGraduate" },
  { label: "Alumni", value: "Alumni" },
  { label: "Recruiter", value: "Recruiter" },
];

const STREAM_OPTIONS = [
  { label: "All Streams", value: "" },
  { label: "MCA", value: "MCA" },
  { label: "M.Tech", value: "MTECH" },
  { label: "IM.Tech", value: "IMTECH" },
  { label: "MAI", value: "MAI" },
  { label: "PhD", value: "PHD" },
];

export default function AlumniDirectoryScreen() {
  const router = useRouter();
  const { stats, isLoading: statsLoading } = useAlumniStats();
  const fetchAlumni = useAlumniStore((s) => s.fetchAlumni);
  const alumni = useAlumniStore((s) => s.alumni);
  const isLoading = useAlumniStore((s) => s.isLoadingAlumni);
  const pagination = useAlumniStore((s) => s.alumniPagination);
  const searchQuery = useAlumniStore((s) => s.searchQuery);
  const setSearchQuery = useAlumniStore((s) => s.setSearchQuery);

  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [filterType, setFilterType] = useState("");
  const [filterBatch, setFilterBatch] = useState("");
  const [filterStream, setFilterStream] = useState("");
  const [filterCompany, setFilterCompany] = useState("");
  const [filterSkills, setFilterSkills] = useState("");
  const [filterOpenToWork, setFilterOpenToWork] = useState(false);
  const [filterReferral, setFilterReferral] = useState(false);

  const hasMore = pagination ? pagination.page < pagination.totalPages : false;

  useEffect(() => {
    logger.info("ALUMNI", "Alumni Directory screen rendered");
    fetchAlumni({ page: 1, limit: 50 });
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAlumni(buildFilters());
    setRefreshing(false);
  }, [searchQuery, filterType, filterBatch, filterStream, filterCompany, filterSkills, filterOpenToWork, filterReferral]);

  const buildFilters = useCallback((): AlumniSearchFilters => {
    const f: AlumniSearchFilters = { page: 1, limit: 50 };
    if (searchQuery) f.q = searchQuery;
    if (filterType) f.accountType = filterType;
    if (filterBatch) f.batch = filterBatch;
    if (filterStream) f.stream = filterStream;
    if (filterCompany) f.company = filterCompany;
    if (filterSkills) f.skills = filterSkills.split(",").map((s) => s.trim()).filter(Boolean);
    if (filterOpenToWork) f.openToWork = true;
    if (filterReferral) f.availableForReferral = true;
    return f;
  }, [searchQuery, filterType, filterBatch, filterStream, filterCompany, filterSkills, filterOpenToWork, filterReferral]);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  const handleSearchSubmit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    fetchAlumni(buildFilters());
  };

  const handleApplyFilters = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowFilters(false);
    fetchAlumni(buildFilters());
  };

  const handleClearFilters = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFilterType("");
    setFilterBatch("");
    setFilterStream("");
    setFilterCompany("");
    setFilterSkills("");
    setFilterOpenToWork(false);
    setFilterReferral(false);
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      const nextPage = (pagination?.page || 1) + 1;
      fetchAlumni({ ...buildFilters(), page: nextPage });
    }
  };

  const handleAlumniPress = (alumni: AlumniUser) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/(app)/alumni/profile",
      params: { data: JSON.stringify(alumni) },
    } as never);
  };

  const handleTabPress = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    switch (key) {
      case "mentors":
        router.push("/(app)/alumni/mentors" as never);
        break;
      case "community":
        router.push("/(app)/alumni/community" as never);
        break;
      case "companies":
        router.push("/(app)/alumni/companies" as never);
        break;
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const activeFilterCount = [
    filterType,
    filterBatch,
    filterStream,
    filterCompany,
    filterSkills,
    filterOpenToWork,
    filterReferral,
  ].filter(Boolean).length;

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAFA] dark:bg-slate-950">
      <StatusBar style="auto" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#8B0000" />
        }
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(260).springify().damping(20)}
          className="px-5 pt-3 pb-3"
        >
          <View className="flex-row items-center justify-between mb-3">
            <TouchableOpacity onPress={handleBack} className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 items-center justify-center shadow-xs">
              <Ionicons name="arrow-back" size={18} color="#64748B" />
            </TouchableOpacity>
            <View className="flex-row items-center bg-red-50 dark:bg-red-950/60 border border-red-200/80 dark:border-red-800/80 px-3 py-1.5 rounded-full">
              <Ionicons name="school" size={13} color="#8B0000" />
              <Text className="text-[11px] font-bold text-red-800 dark:text-red-300 ml-1.5">
                ALUMNI NETWORK
              </Text>
            </View>
            <View className="w-10" />
          </View>

          <Text className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-0.5">
            Alumni Directory
          </Text>
          <Text className="text-sm text-slate-500 dark:text-slate-400">
            Connect with SCIS graduates across the globe
          </Text>
        </Animated.View>

        {/* Stats */}
        <Animated.View entering={FadeInDown.delay(40).duration(260).springify().damping(20)} className="px-5 mb-3">
          <AlumniStatsRow
            alumniRegistered={stats?.alumniRegistered || 0}
            totalRegistered={stats?.totalRegistered || 0}
            followersConnections={stats?.followersConnections || 0}
            isLoading={statsLoading}
          />
        </Animated.View>

        {/* Quick Nav Tabs */}
        <Animated.View entering={FadeInDown.delay(60).duration(260).springify().damping(20)} className="px-5 mb-3">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {TAB_OPTIONS.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => handleTabPress(tab.key)}
                activeOpacity={0.7}
                className="flex-row items-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 px-4 py-2 rounded-2xl mr-2 shadow-xs"
              >
                <Ionicons name={tab.icon as keyof typeof Ionicons.glyphMap} size={14} color="#8B0000" />
                <Text className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 ml-1.5">
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Search + Filter Button */}
        <Animated.View entering={FadeInDown.delay(80).duration(260).springify().damping(20)} className="px-5 mb-3">
          <View className="flex-row items-center">
            <View className="flex-1 flex-row items-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl px-4 py-2.5 shadow-xs">
              <Ionicons name="search-outline" size={17} color="#94A3B8" />
              <TextInput
                className="flex-1 text-sm text-slate-900 dark:text-white ml-2"
                placeholder="Search by name, skill, company..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={handleSearch}
                onSubmitEditing={handleSearchSubmit}
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="none"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => { setSearchQuery(""); fetchAlumni(buildFilters()); }} className="ml-1">
                  <Ionicons name="close-circle" size={17} color="#CBD5E1" />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              onPress={() => setShowFilters(true)}
              activeOpacity={0.7}
              className="w-10 h-10 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl items-center justify-center ml-2 shadow-xs relative"
            >
              <Ionicons name="options-outline" size={17} color="#64748B" />
              {activeFilterCount > 0 && (
                <View className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-800 items-center justify-center">
                  <Text className="text-[9px] font-bold text-white">{activeFilterCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSearchSubmit}
              activeOpacity={0.7}
              className="w-10 h-10 bg-red-800 rounded-2xl items-center justify-center ml-2 shadow-xs"
            >
              <Ionicons name="search" size={17} color="white" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Results Count */}
        <Animated.View entering={FadeInDown.delay(100).duration(260).springify().damping(20)} className="px-5 mb-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {pagination?.total || 0} people found
            </Text>
            {activeFilterCount > 0 && (
              <TouchableOpacity onPress={handleClearFilters}>
                <Text className="text-xs font-semibold text-red-800 dark:text-red-300">
                  Clear filters
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* Grid List */}
        <Animated.View entering={FadeInDown.delay(120).duration(280).springify().damping(20)} className="px-4">
          {isLoading && alumni.length === 0 ? (
            <View className="items-center py-16">
              <ActivityIndicator size="large" color="#8B0000" />
              <Text className="text-sm text-slate-400 dark:text-slate-500 mt-3">
                Loading people...
              </Text>
            </View>
          ) : alumni.length === 0 ? (
            <View className="items-center py-16">
              <View className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/60 border border-red-200/80 dark:border-red-800/80 items-center justify-center mb-4">
                <Ionicons name="people-outline" size={28} color="#8B0000" />
              </View>
              <Text className="text-base font-bold text-slate-900 dark:text-white mb-1">
                No people found
              </Text>
              <Text className="text-sm text-slate-500 dark:text-slate-400 text-center px-8">
                Try adjusting your search or filters
              </Text>
            </View>
          ) : (
            <>
              <View className="flex-row flex-wrap">
                {alumni.map((person, index) => (
                  <View key={person._id || `alumni-${index}`} className="w-1/2">
                    <AlumniGridCard
                      alumni={person}
                      onPress={() => handleAlumniPress(person)}
                    />
                  </View>
                ))}
              </View>

              {hasMore && (
                <TouchableOpacity
                  onPress={handleLoadMore}
                  activeOpacity={0.7}
                  className="bg-red-50 dark:bg-red-950/60 border border-red-200/80 dark:border-red-800/80 py-3 rounded-2xl items-center mt-2"
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#8B0000" />
                  ) : (
                    <Text className="text-sm font-semibold text-red-800 dark:text-red-300">
                      Load More
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </>
          )}
        </Animated.View>
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilters(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white dark:bg-slate-900 rounded-t-[32px] max-h-[85%] border-t border-slate-200 dark:border-slate-800 shadow-2xl">
            <View className="px-5 pt-4 pb-3">
              <View className="items-center mb-3">
                <View className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
              </View>
              <View className="flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <Text className="text-lg font-black text-slate-900 dark:text-white">
                  Filters
                </Text>
                <TouchableOpacity onPress={() => setShowFilters(false)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center">
                  <Ionicons name="close" size={18} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="px-5 pb-6">
              {/* Account Type */}
              <Text className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Type
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-5">
                {TYPE_FILTERS.map((t) => (
                  <TouchableOpacity
                    key={t.value}
                    onPress={() => setFilterType(t.value)}
                    className={`px-4 py-2 rounded-full border ${
                      filterType === t.value
                        ? "bg-red-800 border-red-800"
                        : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800"
                    }`}
                  >
                    <Text className={`text-xs font-semibold ${
                      filterType === t.value ? "text-white" : "text-slate-600 dark:text-slate-400"
                    }`}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Stream */}
              <Text className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Stream
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-5">
                {STREAM_OPTIONS.map((s) => (
                  <TouchableOpacity
                    key={s.value}
                    onPress={() => setFilterStream(s.value)}
                    className={`px-4 py-2 rounded-full border ${
                      filterStream === s.value
                        ? "bg-red-800 border-red-800"
                        : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800"
                    }`}
                  >
                    <Text className={`text-xs font-semibold ${
                      filterStream === s.value ? "text-white" : "text-slate-600 dark:text-slate-400"
                    }`}>
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Batch Year */}
              <Text className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Batch Year
              </Text>
              <TextInput
                className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white mb-5"
                placeholder="e.g. 2024"
                placeholderTextColor="#94A3B8"
                value={filterBatch}
                onChangeText={setFilterBatch}
                keyboardType="number-pad"
                maxLength={4}
              />

              {/* Company */}
              <Text className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Company
              </Text>
              <TextInput
                className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white mb-5"
                placeholder="e.g. Google, Microsoft"
                placeholderTextColor="#94A3B8"
                value={filterCompany}
                onChangeText={setFilterCompany}
                autoCorrect={false}
              />

              {/* Skills */}
              <Text className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Skills (comma separated)
              </Text>
              <TextInput
                className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white mb-5"
                placeholder="e.g. React, Node.js, Python"
                placeholderTextColor="#94A3B8"
                value={filterSkills}
                onChangeText={setFilterSkills}
                autoCorrect={false}
              />

              {/* Toggle Filters */}
              <Text className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Availability
              </Text>

              <TouchableOpacity
                onPress={() => setFilterOpenToWork(!filterOpenToWork)}
                className="flex-row items-center justify-between bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60 rounded-2xl px-4 py-3.5 mb-3"
                activeOpacity={0.7}
              >
                <View className="flex-row items-center">
                  <Ionicons name="briefcase-outline" size={18} color="#059669" />
                  <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-2.5">
                    Open to Work
                  </Text>
                </View>
                <View className={`w-11 h-6 rounded-full p-0.5 ${filterOpenToWork ? "bg-red-800" : "bg-slate-300 dark:bg-slate-600"}`}>
                  <View className={`w-5 h-5 rounded-full bg-white shadow-sm ${filterOpenToWork ? "ml-5" : ""}`} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setFilterReferral(!filterReferral)}
                className="flex-row items-center justify-between bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60 rounded-2xl px-4 py-3.5 mb-6"
                activeOpacity={0.7}
              >
                <View className="flex-row items-center">
                  <Ionicons name="git-pull-request-outline" size={18} color="#2563EB" />
                  <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-2.5">
                    Referral Available
                  </Text>
                </View>
                <View className={`w-11 h-6 rounded-full p-0.5 ${filterReferral ? "bg-red-800" : "bg-slate-300 dark:bg-slate-600"}`}>
                  <View className={`w-5 h-5 rounded-full bg-white shadow-sm ${filterReferral ? "ml-5" : ""}`} />
                </View>
              </TouchableOpacity>

              {/* Action Buttons */}
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={handleClearFilters}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 py-3.5 rounded-2xl items-center"
                  activeOpacity={0.7}
                >
                  <Text className="text-sm font-bold text-slate-600 dark:text-slate-400">
                    Clear All
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleApplyFilters}
                  className="flex-1 bg-red-800 py-3.5 rounded-2xl items-center"
                  activeOpacity={0.85}
                >
                  <Text className="text-white font-bold text-sm">
                    Apply Filters
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
