/**
 * SCIS Connect Mobile - In-App Notification Banner
 * High-fidelity, animated floating banner that slides down from top of the screen
 * for all notification triggers (Jobs, Reminders, Results, Announcements, Challenges).
 */

import React, { useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { useNotificationsStore } from "@/features/notifications/store";
import { usePlacementCenterStore } from "@/features/placement/store";
import { InAppNotificationBannerData } from "@/features/notifications/types";

interface BannerConfig {
  icon: keyof typeof Ionicons.glyphMap;
  category: string;
  ctaText: string;
  defaultScreen?: string;
}

function resolveBannerConfig(banner: InAppNotificationBannerData): BannerConfig {
  const type = String(banner.type || "").toUpperCase();
  const rawData = (banner.data || {}) as Record<string, unknown>;

  const hasJob = Boolean(banner.jobId || rawData.jobId || banner.companyName || rawData.companyName);

  if (
    type === "JOB_POSTED" ||
    type === "NEW_PLACEMENT_NOTICE" ||
    type.includes("PLACEMENT") ||
    (type.includes("JOB") && !type.includes("DEADLINE") && !type.includes("REMINDER")) ||
    hasJob && !type.includes("DEADLINE") && !type.includes("REMINDER") && !type.includes("STATUS")
  ) {
    return {
      icon: "briefcase",
      category: "NEW PLACEMENT DRIVE",
      ctaText: "View Job",
      defaultScreen: "/(app)/placement/center",
    };
  }

  if (
    type === "APPLICATION_DEADLINE" ||
    type === "JOB_DEADLINE_REMINDER" ||
    type.includes("REMINDER") ||
    type.includes("DEADLINE")
  ) {
    return {
      icon: "time",
      category: "DEADLINE REMINDER",
      ctaText: "View Job",
      defaultScreen: "/(app)/placement/center",
    };
  }

  if (
    type === "RESULT_PUBLISHED" ||
    type.includes("RESULT") ||
    type.includes("ASSESSMENT") ||
    type.includes("SCORE")
  ) {
    return {
      icon: "bar-chart",
      category: "ASSESSMENT RESULTS",
      ctaText: "Check Result",
      defaultScreen: "/(app)/placement/center",
    };
  }

  if (
    type === "APPLICATION_STATUS_UPDATE" ||
    type === "APPLICATION_UPDATE" ||
    type.includes("APPLICATION")
  ) {
    return {
      icon: "document-text",
      category: "APPLICATION UPDATE",
      ctaText: "View Update",
      defaultScreen: "/(app)/(tabs)/notifications",
    };
  }

  if (
    type === "CHALLENGE_INVITE" ||
    type.includes("CHALLENGE") ||
    type.includes("LEETCODE") ||
    type.includes("CONTEST")
  ) {
    return {
      icon: "flash",
      category: "CODING CHALLENGE",
      ctaText: "Join Challenge",
      defaultScreen: "/(app)/(tabs)/index",
    };
  }

  if (
    type === "CAMPUS_ANNOUNCEMENT" ||
    type.includes("ANNOUNCEMENT") ||
    type.includes("NOTICE")
  ) {
    return {
      icon: "megaphone",
      category: "CAMPUS ANNOUNCEMENT",
      ctaText: "View Notice",
      defaultScreen: "/(app)/(tabs)/notifications",
    };
  }

  return {
    icon: "notifications",
    category: banner.subTitle ? banner.subTitle.toUpperCase() : "SCIS CONNECT ALERT",
    ctaText: "View Notice",
    defaultScreen: "/(app)/(tabs)/notifications",
  };
}

export function InAppNotificationBanner() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const activeBanner = useNotificationsStore((state) => state.activeBanner);
  const dismissInAppBanner = useNotificationsStore((state) => state.dismissInAppBanner);

  const fetchJobDetail = usePlacementCenterStore((state) => state.fetchJobDetail);
  const setSelectedJob = usePlacementCenterStore((state) => state.setSelectedJob);

  const translateY = useSharedValue(-180);
  const opacity = useSharedValue(0);

  const handleDismiss = useCallback(() => {
    translateY.value = withTiming(-180, { duration: 220 }, (finished) => {
      if (finished) {
        runOnJS(dismissInAppBanner)();
      }
    });
    opacity.value = withTiming(0, { duration: 200 });
  }, [dismissInAppBanner, opacity, translateY]);

  useEffect(() => {
    if (activeBanner) {
      // Trigger subtle haptic on banner arrival
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Slide in from top
      translateY.value = withSpring(0, {
        damping: 18,
        stiffness: 160,
        mass: 0.9,
      });
      opacity.value = withTiming(1, { duration: 250 });

      // Auto dismiss after 6 seconds
      const timer = setTimeout(() => {
        handleDismiss();
      }, 6000);

      return () => clearTimeout(timer);
    } else {
      translateY.value = -180;
      opacity.value = 0;
    }
  }, [activeBanner, handleDismiss, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!activeBanner) return null;

  const config = resolveBannerConfig(activeBanner);
  const rawData = (activeBanner.data || {}) as Record<string, unknown>;

  const rawJobId = activeBanner.jobId || rawData.jobId;
  const jobId = typeof rawJobId === "string" && rawJobId.trim().length > 0 ? rawJobId.trim() : undefined;

  const rawPackage = activeBanner.package || rawData.package || rawData.ctc;
  let packageText: string | undefined;
  if (rawPackage) {
    const pkgNum = Number(rawPackage);
    packageText = !isNaN(pkgNum) ? `₹${(pkgNum >= 100000 ? pkgNum / 100000 : pkgNum).toFixed(1)} LPA` : String(rawPackage);
  }

  const rawDeadline = rawData.deadline || rawData.applicationDeadline;
  const deadlineText = typeof rawDeadline === "string" && rawDeadline.trim().length > 0 ? rawDeadline.trim() : undefined;

  const rawLocation = activeBanner.location || rawData.location;
  const locationText = typeof rawLocation === "string" && rawLocation.trim().length > 0 ? rawLocation.trim() : undefined;

  const handleBannerPress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    handleDismiss();

    if (jobId) {
      try {
        const job = await fetchJobDetail(jobId);
        if (job) {
          setSelectedJob(job);
        }
      } catch {
        // Continue navigation
      }
      router.push("/(app)/placement/center" as never);
      return;
    }

    if (activeBanner.data?.screen && typeof activeBanner.data.screen === "string") {
      router.push(activeBanner.data.screen as never);
      return;
    }

    if (config.defaultScreen) {
      router.push(config.defaultScreen as never);
      return;
    }

    router.push("/(app)/(tabs)/notifications" as never);
  };

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top: Math.max(insets.top + 6, 12),
          left: 14,
          right: 14,
          zIndex: 9999,
          shadowColor: "#8B0000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.18,
          shadowRadius: 16,
          elevation: 12,
        },
        animatedStyle,
      ]}
    >
      <Pressable
        onPress={handleBannerPress}
        className="bg-white dark:bg-slate-900 border-2 border-[#8B0000]/30 dark:border-rose-900/60 rounded-3xl p-3.5"
      >
        {/* Top Header Row */}
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center flex-1 mr-2">
            <View className="w-6 h-6 rounded-full items-center justify-center border bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-800 mr-2">
              <Ionicons name={config.icon} size={12} color="#8B0000" />
            </View>
            <Text
              className="text-[11px] font-black tracking-wider uppercase text-[#8B0000] dark:text-red-400"
              numberOfLines={1}
            >
              {config.category}
            </Text>
            <View className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-2 mr-1" />
            <Text className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
              Just now
            </Text>
          </View>

          {/* Dismiss close button */}
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              handleDismiss();
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center"
          >
            <Ionicons name="close" size={14} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Content Body */}
        <View className="flex-row items-center justify-between">
          <View className="flex-1 mr-3">
            <Text
              className="text-sm font-extrabold text-slate-900 dark:text-white"
              numberOfLines={1}
            >
              {activeBanner.title}
            </Text>
            <Text
              className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5"
              numberOfLines={2}
            >
              {activeBanner.message}
            </Text>

            {/* Optional Metadata Pills */}
            {(packageText || deadlineText || locationText) && (
              <View className="flex-row flex-wrap items-center gap-1.5 mt-2">
                {packageText && (
                  <View className="bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200/80 dark:border-emerald-800">
                    <Text className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                      {packageText}
                    </Text>
                  </View>
                )}
                {deadlineText && (
                  <View className="bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-200/80 dark:border-rose-800">
                    <Text className="text-[10px] font-bold text-rose-700 dark:text-rose-300">
                      {deadlineText}
                    </Text>
                  </View>
                )}
                {locationText && (
                  <View className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                    <Text className="text-[10px] font-medium text-slate-600 dark:text-slate-300">
                      {locationText}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Action CTA Pill */}
          <TouchableOpacity
            onPress={handleBannerPress}
            activeOpacity={0.85}
            className="bg-[#8B0000] px-3.5 py-2 rounded-xl flex-row items-center shadow-xs"
          >
            <Text className="text-xs font-bold text-white">
              {config.ctaText}
            </Text>
            <Ionicons name="arrow-forward" size={12} color="#ffffff" style={{ marginLeft: 3 }} />
          </TouchableOpacity>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default InAppNotificationBanner;
