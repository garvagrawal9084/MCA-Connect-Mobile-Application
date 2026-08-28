import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useAlumniStore } from "@/features/alumni/store";
import { AlumniSearchBar } from "@/components/alumni/AlumniSearchBar";
import { AlumniGridCard } from "@/components/alumni/AlumniGridCard";
import { AlumniSearchFilters, AlumniUser } from "@/features/alumni/types";
import { alumniApi } from "@/features/alumni/api";
import { logger } from "@/utils/logger";

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

const FAMILY_GROUP_CODES = ["FACULTY_TA", "SCIS_MEMBERS", "OTHERS"];

export default function DirectoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ stream?: string }>();
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

  const [familyMembers, setFamilyMembers] = useState<AlumniUser[]>([]);
  const [familyLoading, setFamilyLoading] = useState(false);
  const [familyPagination, setFamilyPagination] = useState<{ page: number; limit: number; total: number; totalPages: number } | null>(null);

  const isFamilyGroup = FAMILY_GROUP_CODES.includes(filterStream || "");
  const hasMore = isFamilyGroup
    ? familyPagination ? familyPagination.page < familyPagination.totalPages : false
    : pagination ? pagination.page < pagination.totalPages : false;

  const loadFamilyMembers = useCallback(async (program: string, q?: string, page: number = 1) => {
    try {
      setFamilyLoading(true);
      const response = await alumniApi.getFamilyBatchMembers(program, { q, page, limit: 50 });
      const data = response.data as Record<string, unknown>;
      const result = data as any;
      const members = (result?.data?.members || result?.members || []) as AlumniUser[];
      const pag = result?.data?.pagination || result?.pagination || null;

      if (page === 1) {
        setFamilyMembers(members);
      } else {
        setFamilyMembers((prev) => [...prev, ...members]);
      }
      setFamilyPagination(pag);
    } catch (err) {
      logger.error("DIRECTORY", "Failed to fetch family members", err);
    } finally {
      setFamilyLoading(false);
    }
  }, []);

  useEffect(() => {
    if (params.stream) {
      setFilterStream(params.stream);
      if (FAMILY_GROUP_CODES.includes(params.stream)) {
        loadFamilyMembers(params.stream);
      } else {
        fetchAlumni({ stream: params.stream, page: 1, limit: 50 });
      }
    } else {
      fetchAlumni({ page: 1, limit: 50 });
    }
  }, [params.stream]);

  const buildFilters = useCallback((): AlumniSearchFilters => {
    const f: AlumniSearchFilters = { page: 1, limit: 50 };
    if (searchQuery) f.q = searchQuery;
    if (filterType) f.accountType = filterType;
    if (filterBatch) f.batch = filterBatch;
    if (filterStream && !FAMILY_GROUP_CODES.includes(filterStream)) f.stream = filterStream;
    if (filterCompany) f.company = filterCompany;
    if (filterSkills) f.skills = filterSkills.split(",").map((s) => s.trim()).filter(Boolean);
    if (filterOpenToWork) f.openToWork = true;
    if (filterReferral) f.availableForReferral = true;
    return f;
  }, [searchQuery, filterType, filterBatch, filterStream, filterCompany, filterSkills, filterOpenToWork, filterReferral]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (isFamilyGroup && filterStream) {
      await loadFamilyMembers(filterStream, searchQuery || undefined, 1);
    } else {
      await fetchAlumni(buildFilters());
    }
    setRefreshing(false);
  }, [isFamilyGroup, filterStream, searchQuery, buildFilters, loadFamilyMembers, fetchAlumni]);

  const handleSearchSubmit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isFamilyGroup && filterStream) {
      loadFamilyMembers(filterStream, searchQuery || undefined, 1);
    } else {
      fetchAlumni(buildFilters());
    }
  };

  const handleApplyFilters = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowFilters(false);
    if (isFamilyGroup && filterStream) {
      loadFamilyMembers(filterStream, searchQuery || undefined, 1);
    } else {
      fetchAlumni(buildFilters());
    }
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
    if (!hasMore) return;
    if (isFamilyGroup && filterStream && familyPagination) {
      loadFamilyMembers(filterStream, searchQuery || undefined, familyPagination.page + 1);
    } else if (!isFamilyGroup) {
      fetchAlumni({ ...buildFilters(), page: (pagination?.page || 1) + 1 });
    }
  };

  const handleAlumniPress = (person: AlumniUser) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/(app)/alumni/profile",
      params: { data: JSON.stringify(person) },
    } as never);
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const displayList = isFamilyGroup ? familyMembers : alumni;
  const displayLoading = isFamilyGroup ? familyLoading : isLoading;
  const displayTotal = isFamilyGroup ? (familyPagination?.total || familyMembers.length) : (pagination?.total || alumni.length);

  const activeFilterCount = [filterType, filterBatch, filterStream, filterCompany, filterSkills, filterOpenToWork, filterReferral].filter(Boolean).length;

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAFA] dark:bg-slate-950">
      <StatusBar style="auto" />
      <FlatList
        data={displayList}
        keyExtractor={(item, index) => item._id || `alumni-${index}`}
        numColumns={2}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#8B0000" />}
        ListHeaderComponent={
          <>
            {/* Header */}
            <Animated.View entering={FadeInDown.duration(260).springify().damping(20)} className="px-5 pt-3 pb-3">
              <View className="flex-row items-center justify-between mb-3">
                <TouchableOpacity onPress={handleBack} className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 items-center justify-center shadow-xs">
                  <Ionicons name="arrow-back" size={18} color="#64748B" />
                </TouchableOpacity>
                <Text className="text-sm font-bold text-slate-900 dark:text-white">Directory</Text>
                <TouchableOpacity onPress={() => setShowFilters(true)} className="relative w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 items-center justify-center shadow-xs">
                  <Ionicons name="options-outline" size={18} color="#64748B" />
                  {activeFilterCount > 0 && (
                    <View className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-800 items-center justify-center">
                      <Text className="text-[8px] font-bold text-white">{activeFilterCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
              <View className="flex-row items-center gap-2">
                <View className="flex-1">
                  <AlumniSearchBar value={searchQuery} onChangeText={(t) => setSearchQuery(t)} />
                </View>
                <TouchableOpacity onPress={handleSearchSubmit} className="w-11 h-11 rounded-2xl bg-red-800 items-center justify-center shadow-sm">
                  <Ionicons name="search" size={18} color="white" />
                </TouchableOpacity>
              </View>
              <Text className="text-xs text-slate-400 dark:text-slate-500 mt-2">{displayTotal} people found</Text>
            </Animated.View>
          </>
        }
        renderItem={({ item }) => (
          <View className="w-1/2">
            <AlumniGridCard alumni={item} onPress={() => handleAlumniPress(item)} />
          </View>
        )}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          displayLoading && displayList.length > 0 ? (
            <View className="py-4"><ActivityIndicator size="small" color="#8B0000" /></View>
          ) : null
        }
        ListEmptyComponent={
          displayLoading ? (
            <View className="items-center py-16">
              <ActivityIndicator size="large" color="#8B0000" />
              <Text className="text-xs text-slate-400 dark:text-slate-500 mt-3">Loading people...</Text>
            </View>
          ) : (
            <View className="items-center py-12">
              <Ionicons name="people-outline" size={48} color="#94A3B8" />
              <Text className="text-sm text-slate-500 dark:text-slate-400 mt-3 text-center">No people found</Text>
            </View>
          )
        }
      />

      {/* Filter Modal */}
      <Modal visible={showFilters} transparent animationType="slide" onRequestClose={() => setShowFilters(false)}>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white dark:bg-slate-900 rounded-t-[32px] max-h-[85%] border-t border-slate-200 dark:border-slate-800 shadow-2xl">
            <View className="items-center pt-3 pb-2">
              <View className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
            </View>
            <View className="flex-row items-center justify-between px-5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <TouchableOpacity onPress={handleClearFilters}>
                <Text className="text-xs font-bold text-red-800">Clear All</Text>
              </TouchableOpacity>
              <Text className="text-sm font-bold text-slate-900 dark:text-white">Filters</Text>
              <TouchableOpacity onPress={handleApplyFilters}>
                <Text className="text-xs font-bold text-red-800">Apply</Text>
              </TouchableOpacity>
            </View>
            <ScrollView className="px-5 pt-4 pb-8" showsVerticalScrollIndicator={false}>
              {/* Type */}
              <Text className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Type</Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {TYPE_FILTERS.map((t) => (
                  <TouchableOpacity key={t.value} onPress={() => setFilterType(t.value)}
                    className={`px-3 py-1.5 rounded-full ${filterType === t.value ? "bg-red-800" : "bg-slate-100 dark:bg-slate-800"}`}>
                    <Text className={`text-xs font-semibold ${filterType === t.value ? "text-white" : "text-slate-600 dark:text-slate-300"}`}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {/* Stream */}
              <Text className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Stream</Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {STREAM_OPTIONS.map((s) => (
                  <TouchableOpacity key={s.value} onPress={() => setFilterStream(s.value)}
                    className={`px-3 py-1.5 rounded-full ${filterStream === s.value ? "bg-red-800" : "bg-slate-100 dark:bg-slate-800"}`}>
                    <Text className={`text-xs font-semibold ${filterStream === s.value ? "text-white" : "text-slate-600 dark:text-slate-300"}`}>{s.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {/* Batch Year */}
              <Text className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Batch Year</Text>
              <TextInput className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white mb-4" placeholder="e.g. 2024" placeholderTextColor="#94A3B8" value={filterBatch} onChangeText={setFilterBatch} keyboardType="numeric" />
              {/* Company */}
              <Text className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Company</Text>
              <TextInput className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white mb-4" placeholder="e.g. Google" placeholderTextColor="#94A3B8" value={filterCompany} onChangeText={setFilterCompany} />
              {/* Skills */}
              <Text className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Skills</Text>
              <TextInput className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white mb-4" placeholder="React, Node.js (comma separated)" placeholderTextColor="#94A3B8" value={filterSkills} onChangeText={setFilterSkills} />
              {/* Toggles */}
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300">Open to Work</Text>
                <TouchableOpacity onPress={() => setFilterOpenToWork(!filterOpenToWork)}
                  className={`w-12 h-7 rounded-full items-center justify-center ${filterOpenToWork ? "bg-red-800" : "bg-slate-200 dark:bg-slate-700"}`}>
                  <View className={`w-5 h-5 rounded-full bg-white dark:bg-slate-100 shadow-sm ${filterOpenToWork ? "ml-5" : "ml-0"}`} />
                </TouchableOpacity>
              </View>
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300">Referral Available</Text>
                <TouchableOpacity onPress={() => setFilterReferral(!filterReferral)}
                  className={`w-12 h-7 rounded-full items-center justify-center ${filterReferral ? "bg-red-800" : "bg-slate-200 dark:bg-slate-700"}`}>
                  <View className={`w-5 h-5 rounded-full bg-white dark:bg-slate-100 shadow-sm ${filterReferral ? "ml-5" : "ml-0"}`} />
                </TouchableOpacity>
              </View>
              {/* Apply Button */}
              <TouchableOpacity onPress={handleApplyFilters} activeOpacity={0.85} className="bg-red-800 py-3.5 rounded-2xl items-center shadow-md">
                <Text className="text-white font-bold text-sm">Apply Filters</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
