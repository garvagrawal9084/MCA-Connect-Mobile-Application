/**
 * SCIS Connect Mobile - Notification Card
 * Formats notifications with dedicated styling for new placement notices.
 */

import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { NotificationItem } from "@/features/notifications/types";

interface NotificationCardProps {
  item: NotificationItem;
  delay?: number;
  onPress: () => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  item,
  delay = 0,
  onPress,
}) => {
  const isReminder =
    item.type === "JOB_DEADLINE_REMINDER" ||
    item.type === "APPLICATION_DEADLINE" ||
    item.type?.includes("REMINDER") ||
    item.type?.includes("DEADLINE");

  const isPlacement =
    !isReminder &&
    (item.type === "NEW_PLACEMENT_NOTICE" ||
      item.type === "JOB_POSTED" ||
      item.type?.includes("PLACEMENT") ||
      item.type?.includes("JOB"));

  const isApplication =
    item.type === "APPLICATION_UPDATE" ||
    item.type === "APPLICATION_STATUS_UPDATE";

  const isRead = Boolean(item.read || item.isRead);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

      if (diffMinutes < 1) return "Just now";
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    } catch {
      return "Recent";
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(260).springify().damping(20)}
      className="mb-3"
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.85}
        className={`p-4 rounded-2xl border ${
          isRead
            ? "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800"
            : isReminder
            ? "bg-purple-50/40 dark:bg-slate-900/90 border-purple-200/90 dark:border-purple-900/60 shadow-xs"
            : "bg-rose-50/40 dark:bg-slate-900/90 border-rose-200/90 dark:border-rose-900/60 shadow-xs"
        }`}
      >
        <View className="flex-row items-start">
          {/* Icon Badge */}
          <View
            className={`w-10 h-10 rounded-xl items-center justify-center mr-3 border ${
              isReminder
                ? "bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800"
                : isPlacement
                ? "bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800"
                : isApplication
                ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800"
                : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            }`}
          >
            <Ionicons
              name={
                isReminder
                  ? "time"
                  : isPlacement
                  ? "briefcase"
                  : isApplication
                  ? "document-text"
                  : "notifications"
              }
              size={18}
              color={
                isReminder
                  ? "#7C3AED"
                  : isPlacement
                  ? "#8B0000"
                  : isApplication
                  ? "#4F46E5"
                  : "#64748B"
              }
            />
          </View>

          {/* Text Content */}
          <View className="flex-1 mr-1">
            <View className="flex-row items-center justify-between mb-0.5">
              <Text
                className="text-xs font-bold text-slate-900 dark:text-white flex-1 mr-2"
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text className="text-[10px] font-semibold text-slate-400">
                {formatTimestamp(item.createdAt)}
              </Text>
            </View>

            <Text className="text-xs text-slate-600 dark:text-slate-300 leading-4">
              {item.message}
            </Text>

            {/* Metadata Pill Bar for Job & Reminder Notices */}
            {(isPlacement || isReminder) && item.metadata && (
              <View className="flex-row flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                {item.metadata.package ? (
                  <View className="bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200/80">
                    <Text className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                      ₹{item.metadata.package} LPA
                    </Text>
                  </View>
                ) : null}

                {item.metadata.deadline ? (
                  <View className="bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-200/80">
                    <Text className="text-[10px] font-bold text-rose-700 dark:text-rose-300">
                      Deadline: {item.metadata.deadline}
                    </Text>
                  </View>
                ) : null}

                {item.metadata.jobId && (
                  <View
                    className={`flex-row items-center px-2 py-0.5 rounded-md ml-auto ${
                      isReminder ? "bg-purple-700" : "bg-[#8B0000]"
                    }`}
                  >
                    <Text className="text-[10px] font-bold text-white mr-1">
                      {isReminder ? "Inspect Job" : "View Job"}
                    </Text>
                    <Ionicons name="arrow-forward" size={10} color="#FFFFFF" />
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Unread indicator dot */}
          {!isRead && (
            <View className="w-2 h-2 rounded-full bg-[#8B0000] ml-1.5 mt-1" />
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};
