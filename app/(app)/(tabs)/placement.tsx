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
import { usePlacementReadinessStats } from "@/features/placement";
import { useAuthStore } from "@/features/auth/authStore";
import { logger } from "@/utils/logger";

const PLACEMENT_FEATURES: PlacementFeatureItem[] = [
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

const GENERAL_OPTIONS = [
  {
    title: "Profile",
    icon: "person-outline",
    color: "#8B0000",
    bgColor: "bg-red-50 dark:bg-red-950/60",
    borderColor: "border-red-200/80 dark:border-red-800/80",
    path: "/(app)/alumni/profile",
  },
  {
    title: "Forums",
    icon: "chatbubbles-outline",
    color: "#7C3AED",
    bgColor: "bg-purple-50 dark:bg-purple-950/60",
    borderColor: "border-purple-200/80 dark:border-purple-800/80",
    path: "/(app)/alumni/community",
  },
  {
    title: "Support",
    icon: "help-circle-outline",
    color: "#0369A1",
    bgColor: "bg-blue-50 dark:bg-blue-950/60",
    borderColor: "border-blue-200/80 dark:border-blue-800/80",
    path: "/(app)/alumni/support",
  },
  {
    title: "Contact Us",
    icon: "mail-outline",
    color: "#059669",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/60",
    borderColor: "border-emerald-200/80 dark:border-emerald-800/80",
    path: "/(app)/alumni/contact",
  },
];

export default function PlacementScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [activeModalFeature, setActiveModalFeature] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Dynamic Real-time Placement Readiness Metrics
  const {
    activeDrivesCount,
    solvedCount,
    readinessScore,
    streakDays,
    refresh: refreshStats,
  } = usePlacementReadinessStats();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await refreshStats();
    } finally {
      setRefreshing(false);
    }
  }, [refreshStats]);

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

  const handleGeneralOptionPress = (item: (typeof GENERAL_OPTIONS)[number]) => {
    logger.info("PLACEMENT", `Student tapped general option: ${item.title}`, {
      path: item.path,
      student: user?.email,
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(item.path as never);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAFA] dark:bg-slate-950" edges={["top", "left", "right"]}>
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
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#B91C1C"
          />
        }
      >
        {/* Top Readiness Stats Header */}
        <Animated.View
          entering={FadeInDown.delay(50).duration(280).springify().damping(20)}
          className="px-4 mt-1"
        >
          <PlacementStatsHeader
            solvedCount={solvedCount}
            activeDrivesCount={activeDrivesCount}
            readinessScore={readinessScore}
            streakDays={streakDays}
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

        {/* General Section */}
        <Animated.View
          entering={FadeInDown.delay(320).duration(280).springify().damping(20)}
          className="px-4 mt-3 mb-3"
        >
          <Text className="text-sm font-bold text-slate-900 dark:text-white mb-3">
            General
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {GENERAL_OPTIONS.map((item) => (
              <TouchableOpacity
                key={item.title}
                activeOpacity={0.7}
                onPress={() => handleGeneralOptionPress(item)}
                className={`w-[48%] flex-row items-center ${item.bgColor} ${item.borderColor} border rounded-2xl p-3 shadow-xs`}
              >
                <View
                  className={`w-9 h-9 rounded-xl ${item.bgColor} items-center justify-center mr-2.5`}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={18}
                    color={item.color}
                  />
                </View>
                <Text
                  className="text-xs font-bold text-slate-900 dark:text-white flex-1"
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Ionicons name="chevron-forward" size={13} color="#94A3B8" />
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Quick Footer Info */}
        <Animated.View
          entering={FadeInDown.delay(380).duration(280).springify().damping(20)}
          className="items-center mt-3 mb-2"
        >
          <View className="flex-row items-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 px-3.5 py-1.5 rounded-full shadow-xs">
            <Ionicons name="shield-checkmark" size={13} color="#B91C1C" />
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
