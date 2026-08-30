/**
 * SCIS Connect Mobile - Placement Closing Soon Card
 * Replicates the "Closing Soon" list item from the reference design.
 */

import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { PlacementJob } from "@/features/placement/types";

interface PlacementClosingSoonCardProps {
  job: PlacementJob;
  delay?: number;
  onPress: () => void;
}

export const PlacementClosingSoonCard: React.FC<PlacementClosingSoonCardProps> = ({
  job,
  delay = 0,
  onPress,
}) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const formatDeadline = (deadlineStr?: string) => {
    if (!deadlineStr) return "Soon";
    try {
      const date = new Date(deadlineStr);
      return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    } catch {
      return "Soon";
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(260).springify().damping(20)}
      className="mb-2.5"
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.85}
        className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 shadow-xs"
      >
        {/* Top Line: Title & Closing Soon Tag */}
        <View className="flex-row items-center justify-between mb-1.5">
          <Text
            className="text-xs font-bold text-slate-900 dark:text-white flex-1 mr-2"
            numberOfLines={1}
          >
            {job.title}
          </Text>

          <View className="bg-rose-50 dark:bg-rose-950/60 border border-rose-200/80 dark:border-rose-800/80 px-2 py-0.5 rounded-full">
            <Text className="text-[9px] font-bold text-rose-700 dark:text-rose-300">
              Closing soon
            </Text>
          </View>
        </View>

        {/* Bottom Line: Company & Date */}
        <View className="flex-row items-center justify-between">
          <Text
            className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex-1 mr-2"
            numberOfLines={1}
          >
            {job.companyName || "Company"}
          </Text>

          <Text className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
            {formatDeadline(job.applicationDeadline)}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};
