import React, { useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { PlacementStudioCard } from "@/components/home/PlacementStudioCard";
import { AlumniNetworkCard } from "@/components/home/AlumniNetworkCard";
import { useAuthStore } from "@/features/auth/authStore";
import { logger } from "@/utils/logger";

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  // Extract first name capitalized for the header
  const getFirstName = () => {
    if (!user?.name) return "STUDENT";
    const first = user.name.trim().split(" ")[0];
    return first.toUpperCase();
  };

  const programDisplay = user?.program?.code || user?.program?.name || user?.course;

  useEffect(() => {
    logger.info("HOME", "Rendered SCIS Spaces Hub landing page", {
      studentName: user?.name,
      studentEmail: user?.email,
      roll_no: user?.roll_no,
      batchYear: user?.batchYear,
      program: programDisplay,
    });
  }, [user, programDisplay]);

  const handleStartPreparing = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    logger.info("HOME", "Student navigated from Spaces Hub to Placement Studio", {
      student: user?.email,
    });
    router.push("/(app)/(tabs)/placement");
  };

  const handleExploreNetwork = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    logger.info("HOME", "Student navigated to Alumni Network Directory", {
      student: user?.email,
    });
    router.push("/(app)/alumni" as never);
  };

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out of SCIS Connect?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            logger.info("AUTH", "Student signed out from Home screen", {
              email: user?.email,
            });
            logout();
            router.replace("/(auth)/login");
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAFA] dark:bg-slate-950">
      <StatusBar style="auto" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
        className="px-5 pt-3"
      >
        {/* Top Meta Bar */}
        <Animated.View
          entering={FadeInDown.duration(260).springify().damping(20)}
          className="flex-row items-center justify-between mb-4"
        >
          <View className="flex-row items-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 px-3 py-1.5 rounded-full shadow-xs">
            <View className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
            <Text className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              SCIS PORTAL
            </Text>
            {programDisplay && (
              <Text className="text-[11px] font-medium text-slate-400 dark:text-slate-500 ml-1">
                · {programDisplay}
              </Text>
            )}
          </View>

          {/* Quick Sign Out / Profile Icon */}
          <TouchableOpacity
            onPress={handleSignOut}
            className="w-9 h-9 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 items-center justify-center shadow-xs"
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={17} color="#64748B" />
          </TouchableOpacity>
        </Animated.View>

        {/* Personalized Welcome Header */}
        <Animated.View
          entering={FadeInDown.delay(60).duration(280).springify().damping(20)}
          className="mb-6"
        >
          {/* Top Line: Welcome, GARV. */}
          <View className="flex-row flex-wrap items-baseline">
            <Text className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Welcome,{" "}
            </Text>
            <Text className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              {getFirstName()}.
            </Text>
          </View>

          {/* Line 2: Your next chapter starts here. in crimson */}
          <Text className="text-3xl sm:text-4xl font-black text-[#B91C1C] dark:text-[#F87171] tracking-tight mt-0.5 mb-3">
            Your next chapter starts here.
          </Text>

          {/* Subtitle / Description */}
          <Text className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-5 sm:leading-6 max-w-xl">
            Two spaces, one community. Move between career preparation and your SCIS network whenever you like.
          </Text>
        </Animated.View>

        {/* Two Space Cards */}
        <Animated.View
          entering={FadeInDown.delay(120).duration(300).springify().damping(20)}
        >
          {/* Card 1: Placement studio */}
          <PlacementStudioCard onStartPreparing={handleStartPreparing} />

          {/* Card 2: Alumni network */}
          <AlumniNetworkCard onExploreNetwork={handleExploreNetwork} />
        </Animated.View>

        {/* University Badge Footer */}
        <Animated.View
          entering={FadeInDown.delay(180).duration(300).springify().damping(20)}
          className="items-center mt-2 mb-2"
        >
          <View className="flex-row items-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 px-3.5 py-1.5 rounded-full shadow-xs">
            <Ionicons name="school" size={13} color="#8B0000" />
            <Text className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 ml-1.5">
              School of Computer and Information Sciences · UoH
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

    </SafeAreaView>
  );
}
