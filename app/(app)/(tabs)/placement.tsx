import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { PlacementFeatureCard } from "@/components/placement/PlacementFeatureCard";
import { PlacementStatsHeader } from "@/components/placement/PlacementStatsHeader";
import { PlacementDetailModal } from "@/components/placement/PlacementDetailModal";
import { PlacementFeatureItem } from "@/features/placement/types";
import { useAuthStore } from "@/features/auth/authStore";
import { logger } from "@/utils/logger";

const PLACEMENT_FEATURES: PlacementFeatureItem[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    description: "Readiness metrics, preparation roadmap & schedule",
    icon: "grid-outline",
    color: "#4F46E5",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/60",
    borderColor: "border-indigo-200/80 dark:border-indigo-800/80",
  },
  {
    id: "challenges",
    title: "Challenges",
    description: "Daily DSA coding practice, algorithms & sprints",
    icon: "code-slash-outline",
    color: "#2563EB",
    bgColor: "bg-blue-50 dark:bg-blue-950/60",
    borderColor: "border-blue-200/80 dark:border-blue-800/80",
  },
  {
    id: "tests",
    title: "Tests & Results",
    description: "Mock test series, company assessments & percentiles",
    icon: "document-text-outline",
    color: "#D97706",
    bgColor: "bg-amber-50 dark:bg-amber-950/60",
    borderColor: "border-amber-200/80 dark:border-amber-800/80",
    route: "/(app)/placement/tests",
  },
  {
    id: "leaderboard",
    title: "Leaderboard",
    description: "Batch rankings, points standings & solved problems",
    icon: "trophy-outline",
    color: "#7C3AED",
    bgColor: "bg-purple-50 dark:bg-purple-950/60",
    borderColor: "border-purple-200/80 dark:border-purple-800/80",
  },
  {
    id: "placement_center",
    title: "Placement Center",
    description: "On-campus recruitment drives, job listings & applications",
    icon: "briefcase-outline",
    color: "#059669",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/60",
    borderColor: "border-emerald-200/80 dark:border-emerald-800/80",
    route: "/(app)/placement/center",
  },
  {
    id: "certificates",
    title: "My Certificates",
    description: "Verified assessment badges & skill achievements",
    icon: "ribbon-outline",
    color: "#0D9488",
    bgColor: "bg-teal-50 dark:bg-teal-950/60",
    borderColor: "border-teal-200/80 dark:border-teal-800/80",
  },
  {
    id: "scis_family",
    title: "SCIS Family",
    description: "Connect with peers across MCA, M.Tech & IM.Tech",
    icon: "people-outline",
    color: "#8B0000",
    bgColor: "bg-red-50 dark:bg-red-950/60",
    borderColor: "border-red-200/80 dark:border-red-800/80",
    route: "/(app)/alumni/scis-family",
  },
];

export default function PlacementScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [activeModalFeature, setActiveModalFeature] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  }, []);

  const handleFeaturePress = (feature: PlacementFeatureItem) => {
    logger.info("PLACEMENT", `Student tapped feature: ${feature.title}`, {
      featureId: feature.id,
      student: user?.email,
    });

    if (feature.route) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(feature.route as never);
    } else {
      setActiveModalFeature(feature.id);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAFA] dark:bg-slate-950">
      <StatusBar style="auto" />

      {/* Header */}
      <Animated.View
        entering={FadeInDown.duration(260).springify().damping(20)}
        className="px-5 pt-3 pb-3"
      >
        <View className="flex-row items-center justify-between mb-1">
          <View className="flex-row items-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 px-3 py-1.5 rounded-full shadow-xs">
            <View className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
            <Text className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              CAREER & DRIVE READINESS
            </Text>
          </View>
        </View>

        <Text className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
          Placement Studio
        </Text>
        <Text className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Solve challenges, measure your progress, and arrive interview-ready.
        </Text>
      </Animated.View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#8B0000"
          />
        }
      >
        {/* Top Readiness Stats Header */}
        <Animated.View
          entering={FadeInDown.delay(50).duration(280).springify().damping(20)}
          className="px-4 mt-1"
        >
          <PlacementStatsHeader
            solvedCount={148}
            activeDrivesCount={3}
            readinessScore={92}
            streakDays={14}
          />
        </Animated.View>

        {/* Feature Boxes Grid */}
        <View className="px-3 mt-1 flex-row flex-wrap">
          {PLACEMENT_FEATURES.map((feature, index) => (
            <PlacementFeatureCard
              key={feature.id}
              item={feature}
              delay={70 + index * 35}
              onPress={() => handleFeaturePress(feature)}
            />
          ))}
        </View>

        {/* Quick Footer Info */}
        <Animated.View
          entering={FadeInDown.delay(380).duration(280).springify().damping(20)}
          className="items-center mt-3 mb-2"
        >
          <View className="flex-row items-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 px-3.5 py-1.5 rounded-full shadow-xs">
            <Ionicons name="shield-checkmark" size={13} color="#8B0000" />
            <Text className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 ml-1.5">
              Placement Cell · School of Computer and Information Sciences
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Feature Detail Modal */}
      <PlacementDetailModal
        visible={activeModalFeature !== null}
        featureId={activeModalFeature}
        onClose={() => setActiveModalFeature(null)}
      />
    </SafeAreaView>
  );
}
