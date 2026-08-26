import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";

interface AlumniNetworkCardProps {
  onExploreNetwork: () => void;
}

export const AlumniNetworkCard: React.FC<AlumniNetworkCardProps> = ({
  onExploreNetwork,
}) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onExploreNetwork();
  };

  return (
    <View className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none p-6 mb-5">
      {/* Eyebrow and Icon Header */}
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-red-800 dark:text-red-400 text-[11px] font-extrabold tracking-widest uppercase">
          MEET YOUR COMMUNITY
        </Text>
        <View className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-950/60 border border-red-200/80 dark:border-red-800/80 items-center justify-center">
          <Ionicons name="school-outline" size={15} color="#8B0000" />
        </View>
      </View>

      {/* Title */}
      <Text className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
        Alumni network
      </Text>

      {/* Description */}
      <Text className="text-slate-600 dark:text-slate-300 text-sm leading-5 mb-4">
        Find people, conversations, and opportunities beyond campus.
      </Text>

      {/* Tag Pills */}
      <View className="flex-row flex-wrap gap-2 mb-5">
        <View className="bg-red-50 dark:bg-red-950/60 border border-red-200/90 dark:border-red-800/80 px-3 py-1.5 rounded-full">
          <Text className="text-red-800 dark:text-red-300 text-xs font-semibold">
            Alumni directory
          </Text>
        </View>

        <View className="bg-red-50 dark:bg-red-950/60 border border-red-200/90 dark:border-red-800/80 px-3 py-1.5 rounded-full">
          <Text className="text-red-800 dark:text-red-300 text-xs font-semibold">
            Mentorship
          </Text>
        </View>

        <View className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/90 dark:border-emerald-800/80 px-3 py-1.5 rounded-full flex-row items-center">
          <View className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
          <Text className="text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
            Live
          </Text>
        </View>
      </View>

      {/* Outlined Action Button */}
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.85}
        className="bg-red-800 active:bg-red-900 py-3.5 px-5 rounded-2xl flex-row items-center justify-between shadow-xs"
      >
        <Text className="text-white font-bold text-base tracking-wide">
          Explore the network
        </Text>
        <Ionicons name="arrow-forward" size={18} color="white" />
      </TouchableOpacity>
    </View>
  );
};

export default AlumniNetworkCard;
