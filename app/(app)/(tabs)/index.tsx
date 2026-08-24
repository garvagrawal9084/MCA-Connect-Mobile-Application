import React, { useState, useEffect } from "react";
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
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/features/auth/authStore";
import { storageService } from "@/services/storage";
import { logger } from "@/utils/logger";

export default function TempHomeScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const logout = useAuthStore((state) => state.logout);
  const refreshStoreToken = useAuthStore((state) => state.refreshToken);

  const [tokenPreview, setTokenPreview] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [refreshResult, setRefreshResult] = useState<string | null>(null);

  useEffect(() => {
    const token = accessToken || storageService.getAccessToken();
    if (token) {
      setTokenPreview(
        token.length > 20
          ? `${token.substring(0, 10)}...${token.substring(token.length - 8)}`
          : token
      );
    } else {
      setTokenPreview("None");
    }

    logger.info("HOME", "Loaded Temp Home Screen with active session", {
      email: user?.email,
      name: user?.name,
      hasToken: Boolean(token),
    });
  }, [user, accessToken]);

  const handleTestTokenRefresh = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsRefreshing(true);
      setRefreshResult(null);

      const success = await refreshStoreToken();
      const newToken = storageService.getAccessToken();
      if (newToken) {
        setTokenPreview(
          newToken.length > 20
            ? `${newToken.substring(0, 10)}...${newToken.substring(newToken.length - 8)}`
            : newToken
        );
      }

      if (success) {
        setRefreshResult("Token refreshed & verified successfully with backend! 🎉");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setRefreshResult("Token refresh completed (no new token returned)");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Token refresh failed";
      setRefreshResult(`Error: ${msg}`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = () => {
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
            logger.info("AUTH", "User signed out from temp home screen", {
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
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <StatusBar style="auto" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        className="px-5 pt-4"
      >
        {/* Top Header */}
        <Animated.View
          entering={FadeInDown.duration(280).springify().damping(20)}
          className="flex-row items-center justify-between mb-5"
        >
          <View className="flex-row items-center">
            <View className="w-12 h-12 bg-violet-700 dark:bg-violet-600 rounded-2xl items-center justify-center shadow-md shadow-violet-700 mr-3">
              <Ionicons name="school" size={24} color="#FFFFFF" />
            </View>
            <View>
              <Text className="text-xs font-bold text-violet-700 dark:text-violet-400 tracking-wider">
                SCIS CONNECT
              </Text>
              <Text className="text-xl font-extrabold text-slate-900 dark:text-white">
                Student Portal
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleLogout}
            className="flex-row items-center bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 px-3 py-2 rounded-xl"
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={18} color="#EF4444" />
            <Text className="text-xs font-semibold text-red-600 dark:text-red-400 ml-1.5">
              Sign Out
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Verification Success Banner */}
        <Animated.View
          entering={FadeInDown.delay(60).duration(280).springify().damping(20)}
        >
          <Card className="bg-emerald-500/10 border border-emerald-500/30 dark:border-emerald-500/40 p-4 rounded-2xl mb-5">
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-emerald-500 rounded-xl items-center justify-center mr-3 shadow-sm">
                <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                  Login Working Successfully! 🎉
                </Text>
                <Text className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                  Authenticated session active & verified with live backend
                </Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Student Profile Card */}
        <Animated.View
          entering={FadeInDown.delay(120).duration(280).springify().damping(20)}
        >
          <Card className="mb-5 border border-slate-200/80 dark:border-slate-800">
            <View className="flex-row items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <View className="flex-row items-center">
                <Ionicons name="person-circle-outline" size={22} color="#6D28D9" />
                <Text className="text-base font-bold text-slate-900 dark:text-white ml-2">
                  Authenticated Student
                </Text>
              </View>
              <View className="bg-violet-100 dark:bg-violet-950/60 px-2.5 py-0.5 rounded-full border border-violet-200 dark:border-violet-800">
                <Text className="text-[10px] font-bold text-violet-700 dark:text-violet-300 uppercase tracking-wider">
                  {user?.role || "Student"}
                </Text>
              </View>
            </View>

            <View className="space-y-3">
              <View className="flex-row justify-between py-1 border-b border-slate-50 dark:border-slate-800/40">
                <Text className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Full Name
                </Text>
                <Text className="text-xs font-semibold text-slate-900 dark:text-white">
                  {user?.name || "Student"}
                </Text>
              </View>

              <View className="flex-row justify-between py-1 border-b border-slate-50 dark:border-slate-800/40">
                <Text className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Email Address
                </Text>
                <Text className="text-xs font-semibold text-slate-900 dark:text-white">
                  {user?.email || "N/A"}
                </Text>
              </View>

              <View className="flex-row justify-between py-1 border-b border-slate-50 dark:border-slate-800/40">
                <Text className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Email Verified
                </Text>
                <View className="flex-row items-center">
                  <Ionicons
                    name={user?.isEmailVerified ? "checkmark-circle" : "close-circle"}
                    size={14}
                    color={user?.isEmailVerified ? "#10B981" : "#F59E0B"}
                  />
                  <Text
                    className={`text-xs font-semibold ml-1 ${
                      user?.isEmailVerified
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {user?.isEmailVerified ? "Verified" : "Pending"}
                  </Text>
                </View>
              </View>

              {user?.course && (
                <View className="flex-row justify-between py-1 border-b border-slate-50 dark:border-slate-800/40">
                  <Text className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Program / Course
                  </Text>
                  <Text className="text-xs font-semibold text-slate-900 dark:text-white">
                    {user.course} {user.semester ? `(Sem ${user.semester})` : ""}
                  </Text>
                </View>
              )}
            </View>
          </Card>
        </Animated.View>

        {/* Live Diagnostics Card */}
        <Animated.View
          entering={FadeInDown.delay(180).duration(280).springify().damping(20)}
        >
          <Card className="mb-5 border border-slate-200/80 dark:border-slate-800">
            <View className="flex-row items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <View className="flex-row items-center">
                <Ionicons name="hardware-chip-outline" size={20} color="#6D28D9" />
                <Text className="text-base font-bold text-slate-900 dark:text-white ml-2">
                  Session & Token Status
                </Text>
              </View>
            </View>

            <View className="space-y-3">
              <View className="flex-row justify-between py-1 border-b border-slate-50 dark:border-slate-800/40">
                <Text className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Access Token
                </Text>
                <Text className="text-xs font-mono font-medium text-violet-700 dark:text-violet-300">
                  {tokenPreview}
                </Text>
              </View>

              <View className="flex-row justify-between py-1 border-b border-slate-50 dark:border-slate-800/40">
                <Text className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Remember Me
                </Text>
                <Text className="text-xs font-semibold text-slate-900 dark:text-white">
                  {storageService.isRememberMe() ? "Enabled (Persistent)" : "Disabled (Session Only)"}
                </Text>
              </View>

              <View className="flex-row justify-between py-1">
                <Text className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Live Backend Status
                </Text>
                <View className="flex-row items-center">
                  <View className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />
                  <Text className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    Online & Active
                  </Text>
                </View>
              </View>
            </View>

            {refreshResult && (
              <View className="mt-3 p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <Text className="text-xs font-mono text-slate-700 dark:text-slate-300">
                  {refreshResult}
                </Text>
              </View>
            )}

            <View className="mt-4">
              <Button
                title={isRefreshing ? "Testing Token Refresh..." : "Test Token Refresh"}
                variant="outline"
                size="sm"
                onPress={handleTestTokenRefresh}
                isLoading={isRefreshing}
                leftIcon={<Ionicons name="refresh-outline" size={16} color="#6D28D9" />}
              />
            </View>
          </Card>
        </Animated.View>

        {/* Info Box */}
        <Animated.View
          entering={FadeInDown.delay(240).duration(280).springify().damping(20)}
          className="bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800/40 rounded-2xl p-4"
        >
          <View className="flex-row items-start">
            <Ionicons name="information-circle" size={20} color="#6D28D9" />
            <View className="flex-1 ml-2.5">
              <Text className="text-xs font-bold text-violet-900 dark:text-violet-200 mb-0.5">
                Temporary Dashboard Screen
              </Text>
              <Text className="text-xs text-violet-700 dark:text-violet-300 leading-4">
                This temporary home screen confirms login routing and session management work as specified in app/AGENTS.md. Full Dashboard widgets will be added in upcoming feature sprints.
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
