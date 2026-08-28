/**
 * SCIS Connect Mobile - Placement Job Card
 * Replicates the card style from the reference design.
 */

import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { PlacementJob } from "@/features/placement/types";

interface PlacementJobCardProps {
  job: PlacementJob;
  delay?: number;
  onPress: () => void;
  onToggleSave?: () => void;
}

const ACCENT_COLORS = [
  "#6366F1", // Indigo
  "#8B0000", // Crimson
  "#7C3AED", // Purple
  "#059669", // Emerald
  "#D97706", // Amber
  "#2563EB", // Blue
];

export const PlacementJobCard: React.FC<PlacementJobCardProps> = ({
  job,
  delay = 0,
  onPress,
  onToggleSave,
}) => {
  const initial = (job.companyName || job.title || "C").charAt(0).toUpperCase();

  // Pick deterministic accent color based on title length/id
  const colorIndex =
    Math.abs(
      (job._id || job.title)
        .split("")
        .reduce((acc, c) => acc + c.charCodeAt(0), 0)
    ) % ACCENT_COLORS.length;
  const accentColor = ACCENT_COLORS[colorIndex];

  const isSaved = job.userState?.saved ?? false;
  const isApplied = job.userState?.applied ?? false;
  const hasVerified = job.verified !== false;

  const handleSavePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onToggleSave?.();
  };

  const handleCardPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const formatPackage = () => {
    if (job.package) {
      return `₹${job.package} LPA`;
    }
    if (job.stipend) {
      return `₹${job.stipend.toLocaleString()}/mo`;
    }
    return null;
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(260).springify().damping(20)}
      className="mb-3"
    >
      <TouchableOpacity
        onPress={handleCardPress}
        activeOpacity={0.88}
        className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs"
      >
        {/* Top Colored Accent Bar */}
        <View
          style={{ height: 3.5, backgroundColor: accentColor }}
          className="w-full"
        />

        <View className="p-3.5">
          {/* Header Row: Avatar, Title, Verified Badge */}
          <View className="flex-row items-start">
            {/* Initial Letter Avatar / Logo */}
            {job.companyLogo ? (
              <Image
                source={{ uri: job.companyLogo }}
                className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 mr-3"
                resizeMode="cover"
              />
            ) : (
              <View className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200/70 dark:border-rose-800/60 items-center justify-center mr-3">
                <Text className="text-base font-black text-[#8B0000] dark:text-red-400">
                  {initial}
                </Text>
              </View>
            )}

            {/* Title & Verified Badge */}
            <View className="flex-1 mr-1">
              <View className="flex-row items-center flex-wrap gap-1.5">
                <Text
                  className="text-sm font-bold text-slate-900 dark:text-white flex-1"
                  numberOfLines={1}
                >
                  {job.title}
                </Text>

                {hasVerified && (
                  <View className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80 px-2 py-0.2 rounded-full flex-row items-center">
                    <Ionicons name="star" size={9} color="#059669" />
                    <Text className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 ml-0.5">
                      Verified
                    </Text>
                  </View>
                )}
              </View>

              {/* Company Name */}
              <Text className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                {job.companyName || "Company"}
              </Text>
            </View>

            {/* Bookmark Action */}
            {onToggleSave && (
              <TouchableOpacity
                onPress={handleSavePress}
                className="p-1 -mr-1"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={isSaved ? "bookmark" : "bookmark-outline"}
                  size={19}
                  color={isSaved ? "#D97706" : "#94A3B8"}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Location, Mode & Details */}
          <View className="flex-row items-center justify-between mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            <View className="flex-row items-center flex-1 mr-2">
              <Ionicons name="location-outline" size={12} color="#94A3B8" />
              <Text
                className="text-[11px] text-slate-500 dark:text-slate-400 ml-1"
                numberOfLines={1}
              >
                {job.location || "Multiple Locations"}
                {job.mode ? ` · ${job.mode.charAt(0).toUpperCase() + job.mode.slice(1)}` : ""}
              </Text>
            </View>

            <View className="flex-row items-center gap-2">
              {formatPackage() && (
                <View className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                  <Text className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    {formatPackage()}
                  </Text>
                </View>
              )}

              {isApplied && (
                <View className="bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded-md">
                  <Text className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                    Applied
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};
