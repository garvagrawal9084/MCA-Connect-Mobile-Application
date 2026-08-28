/**
 * SCIS Connect Mobile - Placement Filter Tabs
 * Horizontal category selector pills matching the reference screenshot.
 */

import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { PlacementFilterTab } from "@/features/placement/store";

interface PlacementFilterTabsProps {
  activeTab: PlacementFilterTab;
  onTabChange: (tab: PlacementFilterTab) => void;
  counts?: {
    jobs?: number;
    closingSoon?: number;
    internships?: number;
    saved?: number;
    applications?: number;
    experiences?: number;
  };
}

export const PlacementFilterTabs: React.FC<PlacementFilterTabsProps> = ({
  activeTab,
  onTabChange,
  counts,
}) => {
  const tabs: Array<{
    id: PlacementFilterTab;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    count?: number;
  }> = [
    {
      id: "jobs",
      label: "Jobs",
      icon: "briefcase-outline",
      count: counts?.jobs,
    },
    {
      id: "closing_soon",
      label: "Closing Soon",
      icon: "alarm-outline",
      count: counts?.closingSoon,
    },
    {
      id: "internships",
      label: "Internships",
      icon: "layers-outline",
      count: counts?.internships,
    },
    {
      id: "saved",
      label: "Saved",
      icon: "bookmark-outline",
      count: counts?.saved,
    },
    {
      id: "applications",
      label: "Applications",
      icon: "document-text-outline",
      count: counts?.applications,
    },
    {
      id: "experiences",
      label: "Experiences",
      icon: "people-outline",
      count: counts?.experiences,
    },
  ];

  const handlePress = (tab: PlacementFilterTab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onTabChange(tab);
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(120).duration(260).springify().damping(20)}
      className="py-1"
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => handlePress(tab.id)}
              activeOpacity={0.8}
              className={`flex-row items-center px-4 py-2 rounded-2xl border ${
                isActive
                  ? "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 shadow-xs"
                  : "bg-slate-100/80 dark:bg-slate-900/60 border-slate-200/60 dark:border-slate-800"
              }`}
            >
              <Ionicons
                name={tab.icon}
                size={16}
                color={isActive ? "#8B0000" : "#64748B"}
              />
              <Text
                className={`text-xs ml-2 font-bold ${
                  isActive
                    ? "text-slate-900 dark:text-white"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                {tab.label}
              </Text>
              {typeof tab.count === "number" && tab.count > 0 && (
                <View
                  className={`ml-1.5 px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? "bg-rose-100 dark:bg-rose-950/60"
                      : "bg-slate-200 dark:bg-slate-800"
                  }`}
                >
                  <Text
                    className={`text-[10px] font-bold ${
                      isActive ? "text-[#8B0000]" : "text-slate-500"
                    }`}
                  >
                    {tab.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
};
