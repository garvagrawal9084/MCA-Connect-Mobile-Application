import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "@/services/api";
import { AlumniUser } from "@/features/alumni/types";
import { AlumniGridCard } from "@/components/alumni/AlumniGridCard";
import { logger } from "@/utils/logger";

const BATCH_YEARS = [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018];

export default function BatchesScreen() {
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState<string>(BATCH_YEARS[0].toString());
  const [users, setUsers] = useState<AlumniUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBatchUsers = useCallback(async (year: string) => {
    try {
      setIsLoading(true);
      const response = await apiClient.get(`/api/people/search?batch=${year}&page=1&limit=50`);
      const data = response.data as Record<string, unknown>;
      const result = data as any;
      setUsers(result.people || []);
    } catch (err) {
      logger.error("BATCHES", "Failed to fetch batch users", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBatchUsers(selectedYear);
  }, [selectedYear, fetchBatchUsers]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBatchUsers(selectedYear);
    setRefreshing(false);
  }, [selectedYear, fetchBatchUsers]);

  const handleAlumniPress = (alumni: AlumniUser) => {
    router.push({
      pathname: "/(app)/alumni/profile",
      params: { data: JSON.stringify(alumni) },
    } as never);
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAFA] dark:bg-slate-950">
      <StatusBar style="auto" />

      {/* Header */}
      <View className="px-5 pt-3 pb-3">
        <View className="flex-row items-center justify-between mb-1">
          <TouchableOpacity onPress={handleBack} className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 items-center justify-center">
            <Ionicons name="arrow-back" size={18} color="#64748B" />
          </TouchableOpacity>
          <Text className="text-sm font-bold text-slate-900 dark:text-white">Batches</Text>
          <View className="w-10" />
        </View>
        <Text className="text-xs text-slate-400 dark:text-slate-500 text-center">
          {users.length} members in batch {selectedYear}
        </Text>
      </View>

      {/* Batch Year Tabs */}
      <View className="flex-row flex-wrap px-4 mb-3">
        {BATCH_YEARS.map((year) => {
          const isActive = selectedYear === year.toString();
          return (
            <TouchableOpacity
              key={year}
              onPress={() => setSelectedYear(year.toString())}
              className={`px-4 py-2 rounded-full mr-2 mb-2 ${
                isActive
                  ? "bg-red-800"
                  : "bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800"
              }`}
            >
              <Text className={`text-xs font-bold ${isActive ? "text-white" : "text-slate-600 dark:text-slate-300"}`}>
                {year}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* User Grid */}
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#8B0000" />}
      >
        {isLoading && users.length === 0 ? (
          <View className="items-center py-12">
            <ActivityIndicator size="large" color="#8B0000" />
          </View>
        ) : users.length === 0 ? (
          <View className="items-center py-12">
            <Ionicons name="people-outline" size={48} color="#94A3B8" />
            <Text className="text-sm text-slate-500 dark:text-slate-400 mt-3 text-center">No members found for batch {selectedYear}</Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap">
            {users.map((person, index) => (
              <View key={person._id || `user-${index}`} className="w-1/2">
                <AlumniGridCard alumni={person} onPress={() => handleAlumniPress(person)} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
