import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";

interface PlacementStudioCardProps {
  onStartPreparing: () => void;
}

export const PlacementStudioCard: React.FC<PlacementStudioCardProps> = ({
  onStartPreparing,
}) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onStartPreparing();
  };

  return (
    <View className="bg-white dark:bg-slate-900 rounded-[28px] border-2 border-red-500/25 dark:border-red-800/40 shadow-xl shadow-red-950/10 dark:shadow-none p-6 mb-5">
      {/* Eyebrow and Icon Header */}
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-red-700 dark:text-red-400 text-[11px] font-extrabold tracking-widest uppercase">
          BUILD YOUR NEXT MOVE
        </Text>
        <View className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-950/60 border border-red-200/80 dark:border-red-800/80 items-center justify-center">
          <Ionicons name="briefcase-outline" size={15} color="#800000" />
        </View>
      </View>

      {/* Title */}
      <Text className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
        Placement studio
      </Text>

      {/* Description */}
      <Text className="text-slate-600 dark:text-slate-300 text-sm leading-5 mb-4">
        Solve challenges, measure your progress, and arrive interview-ready.
      </Text>

      {/* Tag Pills */}
      <View className="flex-row flex-wrap gap-2 mb-5">
        <View className="bg-red-50 dark:bg-red-950/60 border border-red-200/90 dark:border-red-800/80 px-3 py-1.5 rounded-full">
          <Text className="text-red-800 dark:text-red-300 text-xs font-semibold">
            Assignments & tests
          </Text>
        </View>

        <View className="bg-red-50 dark:bg-red-950/60 border border-red-200/90 dark:border-red-800/80 px-3 py-1.5 rounded-full">
          <Text className="text-red-800 dark:text-red-300 text-xs font-semibold">
            Coding challenges
          </Text>
        </View>
      </View>

      {/* Primary Action Button */}
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.85}
        className="bg-red-800 active:bg-red-900 dark:bg-red-800 dark:active:bg-red-900 py-3.5 px-5 rounded-2xl flex-row items-center justify-between shadow-md shadow-red-900/30"
      >
        <Text className="text-white font-bold text-base tracking-wide">
          Start preparing
        </Text>
        <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

export default PlacementStudioCard;
