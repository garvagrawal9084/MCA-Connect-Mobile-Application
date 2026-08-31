import React, { useEffect } from "react";
import { View, Text, Image, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Redirect, Href } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { images } from "@/constants/images";
import { useAuthStore } from "@/features/auth/authStore";

export default function Index() {
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const isLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  const pulseScale = useSharedValue(1);

  useEffect(() => {
    // Start pulse animation for branding icon
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 700 }),
        withTiming(1.0, { duration: 700 })
      ),
      -1,
      true
    );

    // Bootstrap authentication lifecycle
    initializeAuth();
  }, [initializeAuth, pulseScale]);

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  // While checking persisted tokens and performing silent refresh, render branded splash
  if (!isInitialized || isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-[#F8FAFC] dark:bg-slate-950 items-center justify-center px-6">
        <StatusBar style="auto" />
        <View className="items-center">
          <Animated.View
            style={animatedPulseStyle}
            className="w-24 h-24 bg-white dark:bg-slate-900 rounded-3xl items-center justify-center shadow-xl shadow-red-900/10 dark:shadow-none border border-slate-200/80 dark:border-slate-800 p-3 mb-5"
          >
            <Image
              source={images.logo}
              className="w-20 h-20"
              resizeMode="contain"
            />
          </Animated.View>

          <View className="bg-red-50 dark:bg-red-950/60 px-3 py-1 rounded-full mb-2.5 border border-red-200 dark:border-red-800">
            <Text className="text-xs font-bold text-red-800 dark:text-red-300 tracking-wider">
              SCIS CONNECT
            </Text>
          </View>

          <Text className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">
            Student Portal
          </Text>

          <View className="flex-row items-center mt-3">
            <ActivityIndicator size="small" color="#8B0000" />
            <Text className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-2">
              Verifying session...
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Once initialized, route cleanly based on authentication status
  if (isAuthenticated) {
    return <Redirect href={"/(app)/(tabs)" as Href} />;
  }

  return <Redirect href={"/login" as Href} />;
}
