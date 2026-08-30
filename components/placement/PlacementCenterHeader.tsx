/**
 * SCIS Connect Mobile - Placement Center Header
 * Clean header with university icon badge, title, subtitle & optional back navigation.
 */

import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

interface PlacementCenterHeaderProps {
  onBack?: () => void;
}

export const PlacementCenterHeader: React.FC<PlacementCenterHeaderProps> = ({
  onBack,
}) => {
  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onBack?.();
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(260).springify().damping(20)}
      className="px-4 pt-2 pb-3"
    >
      <View className="flex-row items-center">
        {onBack && (
          <TouchableOpacity
            onPress={handleBackPress}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center mr-2.5"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={18} color="#64748B" />
          </TouchableOpacity>
        )}

        {/* Left Icon Badge */}
        <View className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800/80 items-center justify-center mr-3">
          <Ionicons name="briefcase" size={22} color="#B91C1C" />
        </View>

        {/* Title & Subtitle */}
        <View className="flex-1">
          <Text className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Placement Center
          </Text>
          <Text
            className="text-xs text-slate-500 dark:text-slate-400 mt-0.5"
            numberOfLines={1}
          >
            Discover jobs, track applications and get interview-ready
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};
