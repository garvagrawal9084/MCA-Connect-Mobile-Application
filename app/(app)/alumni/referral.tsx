import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "@/services/api";
import { AlumniUser } from "@/features/alumni/types";
import { logger } from "@/utils/logger";

export default function ReferralScreen() {
  const router = useRouter();
  const [referrers, setReferrers] = useState<AlumniUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReferrers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get("/api/people/search?availableForReferral=true&limit=50");
      const data = response.data as Record<string, unknown>;
      const result = data as any;
      setReferrers(result.people || []);
    } catch (err) {
      logger.error("REFERRAL", "Failed to fetch referrers", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReferrers();
  }, [fetchReferrers]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchReferrers();
    setRefreshing(false);
  }, [fetchReferrers]);

  const handleUserPress = (user: AlumniUser) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/(app)/alumni/profile",
      params: { data: JSON.stringify(user) },
    } as never);
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const getPhotoUrl = (user: AlumniUser): string | null => {
    const img = (user as any).profileImage;
    if (!img) return null;
    if (typeof img === "string") return img;
    return img.url || null;
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAFA] dark:bg-slate-950">
      <StatusBar style="auto" />

      {/* Header */}
      <Animated.View entering={FadeInDown.duration(260).springify().damping(20)} className="px-5 pt-3 pb-4">
        <View className="flex-row items-center justify-between mb-1">
          <TouchableOpacity onPress={handleBack} className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 items-center justify-center shadow-xs">
            <Ionicons name="arrow-back" size={18} color="#64748B" />
          </TouchableOpacity>
          <Text className="text-sm font-bold text-slate-900 dark:text-white">Referral Hub</Text>
          <View className="w-10" />
        </View>
        <Text className="text-xs text-slate-400 text-center">{referrers.length} people available for referrals</Text>
      </Animated.View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#8B0000" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#8B0000" />}
        >
          {referrers.length === 0 ? (
            <View className="items-center justify-center py-12">
              <Ionicons name="git-pull-request-outline" size={48} color="#94A3B8" />
              <Text className="text-sm text-slate-500 mt-3 text-center">No referrers found right now</Text>
            </View>
          ) : (
            referrers.map((user, index) => {
              const photo = getPhotoUrl(user);
              return (
                <Animated.View key={user._id || index} entering={FadeInDown.delay(index * 40).duration(280).springify().damping(20)}>
                  <TouchableOpacity
                    onPress={() => handleUserPress(user)}
                    activeOpacity={0.7}
                    className="flex-row items-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3 mb-2 shadow-xs"
                  >
                    {photo ? (
                      <View className="w-11 h-11 rounded-full overflow-hidden">
                        <Text className="text-sm font-bold text-red-700 text-center leading-[44px]">{getInitials(user.name)}</Text>
                      </View>
                    ) : (
                      <View className="w-11 h-11 rounded-full bg-red-100 dark:bg-red-900/40 items-center justify-center">
                        <Text className="text-sm font-bold text-red-700 dark:text-red-300">{getInitials(user.name)}</Text>
                      </View>
                    )}
                    <View className="ml-3 flex-1">
                      <Text className="text-sm font-bold text-slate-900 dark:text-white" numberOfLines={1}>{user.name}</Text>
                      {user.currentPosition && user.company ? (
                        <Text className="text-[11px] text-slate-500" numberOfLines={1}>{user.currentPosition} at {user.company}</Text>
                      ) : user.roll_no ? (
                        <Text className="text-[11px] text-slate-500">{user.roll_no}</Text>
                      ) : null}
                    </View>
                    <View className="bg-amber-50 dark:bg-amber-900/40 px-2.5 py-1 rounded-full">
                      <Text className="text-[10px] font-bold text-amber-700 dark:text-amber-300">Refer</Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
