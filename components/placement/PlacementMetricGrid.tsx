/**
 * SCIS Connect Mobile - Placement Metric Grid
 * 6 responsive summary metric cards matching the exact design.
 */

import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { PlacementDashboardStats } from "@/features/placement/types";
import { PlacementFilterTab } from "@/features/placement/store";

interface PlacementMetricGridProps {
  stats: PlacementDashboardStats;
  onSelectTab?: (tab: PlacementFilterTab) => void;
}

export const PlacementMetricGrid: React.FC<PlacementMetricGridProps> = ({
  stats,
  onSelectTab,
}) => {
  const cards = [
    {
      id: "open_jobs",
      label: "OPEN JOBS",
      value: stats.openJobs || 0,
      valueColor: "text-red-700 dark:text-red-400",
      iconName: "briefcase-outline" as const,
      iconColor: "#B91C1C",
      iconBg: "bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800/80",
      tabTarget: "jobs" as PlacementFilterTab,
    },
    {
      id: "internships",
      label: "INTERNSHIPS",
      value: stats.internships || 0,
      valueColor: "text-red-700 dark:text-red-400",
      iconName: "layers-outline" as const,
      iconColor: "#C2410C",
      iconBg: "bg-orange-50 dark:bg-orange-950/60 border-orange-200 dark:border-orange-800/80",
      tabTarget: "internships" as PlacementFilterTab,
    },
    {
      id: "new_this_week",
      label: "NEW THIS WEEK",
      value: stats.newThisWeek || 0,
      valueColor: "text-emerald-600 dark:text-emerald-400",
      iconName: "trending-up-outline" as const,
      iconColor: "#059669",
      iconBg: "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/80",
      tabTarget: "jobs" as PlacementFilterTab,
    },
    {
      id: "applications",
      label: "APPLICATIONS",
      value: stats.applications || 0,
      valueColor: "text-indigo-700 dark:text-indigo-400",
      iconName: "create-outline" as const,
      iconColor: "#4F46E5",
      iconBg: "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800/80",
      tabTarget: "applications" as PlacementFilterTab,
    },
    {
      id: "saved",
      label: "SAVED",
      value: stats.saved || 0,
      valueColor: "text-amber-700 dark:text-amber-400",
      iconName: "bookmark-outline" as const,
      iconColor: "#D97706",
      iconBg: "bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800/80",
      tabTarget: "saved" as PlacementFilterTab,
    },
    {
      id: "reminders",
      label: "REMINDERS",
      value: stats.reminders || 0,
      valueColor: "text-purple-700 dark:text-purple-400",
      iconName: "time-outline" as const,
      iconColor: "#7C3AED",
      iconBg: "bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800/80",
      tabTarget: "jobs" as PlacementFilterTab,
    },
  ];

  const handleCardPress = (tabTarget: PlacementFilterTab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectTab?.(tabTarget);
  };

  return (
    <View className="px-4">
      <View className="flex-row flex-wrap justify-between">
        {cards.map((card, index) => (
          <Animated.View
            key={card.id}
            entering={FadeInDown.delay(40 + index * 25).duration(260).springify().damping(20)}
            style={{ width: "31.5%" }}
            className="mb-3"
          >
            <TouchableOpacity
              onPress={() => handleCardPress(card.tabTarget)}
              activeOpacity={0.8}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 shadow-xs justify-between min-h-[92px]"
            >
              {/* Header: Label & Icon */}
              <View className="flex-row items-center justify-between">
                <Text
                  className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex-1 mr-1"
                  numberOfLines={1}
                >
                  {card.label}
                </Text>
                <View
                  className={`w-7 h-7 rounded-xl border items-center justify-center ${card.iconBg}`}
                >
                  <Ionicons
                    name={card.iconName}
                    size={14}
                    color={card.iconColor}
                  />
                </View>
              </View>

              {/* Huge Number */}
              <Text className={`text-2xl font-black ${card.valueColor} mt-1`}>
                {card.value}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </View>
  );
};
