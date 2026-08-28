import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { alumniApi } from "@/features/alumni/api";
import { logger } from "@/utils/logger";

const PROGRAM_META: Record<string, { label: string; color: string; icon: string; description: string }> = {
  MCMC: { label: "MCA", color: "#8B0000", icon: "code-slash-outline", description: "Master of Computer Applications" },
  MCCE: { label: "Integrated M.Tech (CSE)", color: "#7C3AED", icon: "hardware-chip-outline", description: "5-year integrated program" },
  MCMI: { label: "M.Tech (AI)", color: "#0369A1", icon: "brain-outline", description: "Artificial Intelligence & ML" },
  MCMT: { label: "M.Tech (CS)", color: "#059669", icon: "server-outline", description: "Computer Science" },
  MCMB: { label: "M.Tech (IT)", color: "#D97706", icon: "wifi-outline", description: "Information Technology" },
  FACULTY_TA: { label: "Faculty & TAs", color: "#DC2626", icon: "person-outline", description: "Teaching staff & assistants" },
  SCIS_MEMBERS: { label: "SCIS Members", color: "#2563EB", icon: "shield-checkmark-outline", description: "Core SCIS community" },
  OTHERS: { label: "Others", color: "#64748B", icon: "ellipsis-horizontal-outline", description: "Other members" },
};

const PROGRAM_ORDER = ["MCMC", "MCCE", "MCMI", "MCMT", "MCMB", "FACULTY_TA", "SCIS_MEMBERS", "OTHERS"];

export default function ScisFamilyScreen() {
  const router = useRouter();
  const [familyCounts, setFamilyCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);

  const fetchCounts = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await alumniApi.getFamilyCounts();
      const data = response.data as Record<string, unknown>;
      const result = data as any;
      setFamilyCounts(result?.data?.counts || result?.counts || {});
    } catch (err) {
      logger.error("SCIS_FAMILY", "Failed to fetch family counts", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCounts();
    setRefreshing(false);
  }, [fetchCounts]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleProgramPress = (code: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedProgram(code);
    router.push({
      pathname: "/(app)/alumni/directory",
      params: { stream: code },
    } as never);
    setTimeout(() => setSelectedProgram(null), 1500);
  };

  const totalCount = Object.values(familyCounts).reduce((sum, n) => sum + n, 0);
  const programs = PROGRAM_ORDER.filter((code) => familyCounts[code] && familyCounts[code] > 0);

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAFA] dark:bg-slate-950">
      <StatusBar style="auto" />

      {/* Header */}
      <Animated.View entering={FadeInDown.duration(260).springify().damping(20)} className="px-5 pt-3 pb-4">
        <View className="flex-row items-center justify-between mb-1">
          <TouchableOpacity onPress={handleBack} className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 items-center justify-center shadow-xs">
            <Ionicons name="arrow-back" size={18} color="#64748B" />
          </TouchableOpacity>
          <Text className="text-sm font-bold text-slate-900 dark:text-white">SCIS Family</Text>
          <View className="w-10" />
        </View>
        <Text className="text-xs text-slate-400 dark:text-slate-500 text-center">{totalCount} members across {programs.length} programs</Text>
      </Animated.View>

      {/* Program Grid */}
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#8B0000" />}
      >
        {isLoading ? (
          <View className="items-center py-12">
            <ActivityIndicator size="large" color="#8B0000" />
          </View>
        ) : programs.length === 0 ? (
          <View className="items-center py-12">
            <Ionicons name="people-outline" size={48} color="#94A3B8" />
            <Text className="text-sm text-slate-500 dark:text-slate-400 mt-3 text-center">No programs found</Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap">
            {programs.map((code, index) => {
              const meta = PROGRAM_META[code] || { label: code, color: "#64748B", icon: "ellipse-outline", description: "" };
              const count = familyCounts[code];
              return (
                <Animated.View
                  key={code}
                  entering={FadeInDown.delay(index * 60).duration(280).springify().damping(20)}
                  className="w-1/2 px-1.5 mb-3"
                >
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleProgramPress(code)}
                    disabled={selectedProgram !== null}
                    className={`bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs ${selectedProgram === code ? "opacity-60" : ""}`}
                  >
                    <View
                      className="w-12 h-12 rounded-xl items-center justify-center mb-3"
                      style={{ backgroundColor: `${meta.color}15` }}
                    >
                      <Ionicons name={meta.icon as any} size={24} color={meta.color} />
                    </View>
                    <Text className="text-sm font-bold text-slate-900 dark:text-white mb-1" numberOfLines={1}>
                      {meta.label}
                    </Text>
                    <Text className="text-[10px] text-slate-400 dark:text-slate-500 mb-2" numberOfLines={1}>
                      {meta.description}
                    </Text>
                    <View className="flex-row items-center justify-between">
                      <View className="bg-slate-50 dark:bg-slate-800/50 rounded-full px-2.5 py-1">
                        <Text className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                          {count} {count === 1 ? "member" : "members"}
                        </Text>
                      </View>
                      {selectedProgram === code ? (
                        <ActivityIndicator size="small" color={meta.color} />
                      ) : (
                        <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
                      )}
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
