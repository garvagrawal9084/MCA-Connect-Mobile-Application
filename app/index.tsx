import React, { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
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
      <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950 items-center justify-center px-6">
        <StatusBar style="auto" />
        <View className="items-center">
          <Animated.View
            style={animatedPulseStyle}
            className="w-20 h-20 bg-violet-700 dark:bg-violet-600 rounded-3xl items-center justify-center shadow-lg shadow-violet-700 mb-5"
          >
            <Ionicons name="school" size={42} color="#FFFFFF" />
          </Animated.View>

          <View className="bg-violet-100 dark:bg-violet-950/60 px-3 py-1 rounded-full mb-2.5 border border-violet-200 dark:border-violet-800">
            <Text className="text-xs font-bold text-violet-700 dark:text-violet-300 tracking-wider">
              SCIS CONNECT
            </Text>
          </View>

          <Text className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">
            Student Portal
          </Text>

          <View className="flex-row items-center mt-3">
            <ActivityIndicator size="small" color="#6D28D9" />
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
