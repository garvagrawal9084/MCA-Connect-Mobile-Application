/**
 * SCIS Connect Mobile - In-App Notification Banner
 * High-fidelity, animated floating banner that slides down from top of the screen
 * when a new job posting or trigger alert is received.
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

export function InAppNotificationBanner() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const activeBanner = useNotificationsStore((state) => state.activeBanner);
  const dismissInAppBanner = useNotificationsStore((state) => state.dismissInAppBanner);

  const fetchJobDetail = usePlacementCenterStore((state) => state.fetchJobDetail);
  const setSelectedJob = usePlacementCenterStore((state) => state.setSelectedJob);

  const translateY = useSharedValue(-160);
  const opacity = useSharedValue(0);

  const handleDismiss = useCallback(() => {
    translateY.value = withTiming(-160, { duration: 220 }, (finished) => {
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

      // Auto dismiss after 5.5 seconds
      const timer = setTimeout(() => {
        handleDismiss();
      }, 5500);

      return () => clearTimeout(timer);
    } else {
      translateY.value = -160;
      opacity.value = 0;
    }
  }, [activeBanner, handleDismiss, opacity, translateY]);

  const handleBannerPress = async (banner: InAppNotificationBannerData) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    handleDismiss();

    if (banner.jobId) {
      try {
        const job = await fetchJobDetail(banner.jobId);
        if (job) {
          setSelectedJob(job);
        }
      } catch {
        // Continue navigation
      }
      router.push("/(app)/placement/center" as never);
    } else if (banner.data?.screen && typeof banner.data.screen === "string") {
      router.push(banner.data.screen as never);
    } else {
      router.push("/(app)/(tabs)/notifications" as never);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!activeBanner) return null;

  const isJob = activeBanner.type === "JOB_POSTED" || Boolean(activeBanner.jobId);

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
        onPress={() => handleBannerPress(activeBanner)}
        className="bg-white dark:bg-slate-900 border-2 border-[#8B0000]/30 dark:border-rose-900/60 rounded-3xl p-3.5"
      >
        {/* Top Header Row */}
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center">
            <View className="w-6 h-6 rounded-full bg-rose-50 dark:bg-rose-950/80 items-center justify-center border border-rose-200 dark:border-rose-800 mr-2">
              <Ionicons
                name={isJob ? "briefcase" : "notifications"}
                size={12}
                color="#8B0000"
              />
            </View>
            <Text className="text-[11px] font-black text-[#8B0000] dark:text-red-400 tracking-wider uppercase">
              {isJob ? "NEW PLACEMENT DRIVE" : activeBanner.subTitle || "SCIS CONNECT ALERT"}
            </Text>
            <View className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-2" />
            <Text className="text-[10px] font-bold text-slate-400 dark:text-slate-500 ml-1">
              Just now
            </Text>
          </View>

          {/* Dismiss button */}
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
          </View>

          {/* Action CTA Pill */}
          <TouchableOpacity
            onPress={() => handleBannerPress(activeBanner)}
            className="bg-[#8B0000] px-3.5 py-2 rounded-xl flex-row items-center shadow-xs"
          >
            <Text className="text-xs font-bold text-white">
              {isJob ? "View Job" : "Open"}
            </Text>
            <Ionicons name="arrow-forward" size={12} color="#ffffff" style={{ marginLeft: 3 }} />
          </TouchableOpacity>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default InAppNotificationBanner;
