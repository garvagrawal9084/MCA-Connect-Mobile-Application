import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "react-native";
import { apiClient } from "@/services/api";
import { logger } from "@/utils/logger";

interface FollowUser {
  id: string;
  name: string;
  roll_no?: string;
  profileImage?: { url?: string | null } | null;
  company?: string;
  currentPosition?: string;
  accountType?: string;
  isEmailVerified?: boolean;
}

export default function FollowListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ userId?: string; type?: string; title?: string }>();
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const title = params.title || "Followers";
  const endpoint = params.type === "following"
    ? `/api/follow/${params.userId}/following`
    : `/api/follow/${params.userId}/followers`;

  useEffect(() => {
    const fetchList = async () => {
      if (!params.userId) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const response = await apiClient.get(endpoint);
        const data = response.data as Record<string, unknown>;
        const list = (data.followers || data.following || []) as FollowUser[];
        setUsers(list);
      } catch (err) {
        logger.error("FOLLOW_LIST", "Failed to fetch list", err);
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setIsLoading(false);
      }
    };
    fetchList();
  }, [params.userId, endpoint]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleUserPress = (userId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/(app)/alumni/profile",
      params: { data: JSON.stringify({ _id: userId }) },
    } as never);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAFA] dark:bg-slate-950">
      <StatusBar style="auto" />

      {/* Header */}
      <Animated.View entering={FadeInDown.duration(260).springify().damping(20)} className="px-5 pt-3 pb-4">
        <View className="flex-row items-center justify-between mb-2">
          <TouchableOpacity onPress={handleBack} className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 items-center justify-center shadow-xs">
            <Ionicons name="arrow-back" size={18} color="#64748B" />
          </TouchableOpacity>
          <Text className="text-sm font-bold text-slate-900 dark:text-white">{title}</Text>
          <View className="w-10" />
        </View>
        <Text className="text-xs text-slate-400 text-center">{users.length} {users.length === 1 ? "person" : "people"}</Text>
      </Animated.View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#8B0000" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="alert-circle-outline" size={48} color="#94A3B8" />
          <Text className="text-sm text-slate-500 mt-3 text-center">{error}</Text>
        </View>
      ) : users.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="people-outline" size={48} color="#94A3B8" />
          <Text className="text-sm text-slate-500 mt-3 text-center">No {title.toLowerCase()} yet</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
          {users.map((user, index) => (
            <Animated.View
              key={user.id || `user-${index}`}
              entering={FadeInDown.delay(index * 40).duration(280).springify().damping(20)}
            >
              <TouchableOpacity
                onPress={() => handleUserPress(user.id)}
                activeOpacity={0.7}
                className="flex-row items-center px-5 py-3 border-b border-slate-100 dark:border-slate-800/50"
              >
                {(() => {
                  const imgUrl = typeof user.profileImage === "string" ? user.profileImage : user.profileImage?.url;
                  return imgUrl ? (
                    <Image source={{ uri: imgUrl }} className="w-11 h-11 rounded-full" />
                  ) : (
                    <View className="w-11 h-11 rounded-full bg-red-100 dark:bg-red-900/40 items-center justify-center">
                      <Text className="text-sm font-bold text-red-700 dark:text-red-300">
                        {user.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "??"}
                      </Text>
                    </View>
                  );
                })()}
                <View className="ml-3 flex-1">
                  <Text className="text-sm font-bold text-slate-900 dark:text-white" numberOfLines={1}>{user.name}</Text>
                  {user.currentPosition && user.company ? (
                    <Text className="text-[11px] text-slate-500 dark:text-slate-400" numberOfLines={1}>
                      {user.currentPosition} at {user.company}
                    </Text>
                  ) : user.roll_no ? (
                    <Text className="text-[11px] text-slate-500 dark:text-slate-400">{user.roll_no}</Text>
                  ) : null}
                </View>
                <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
              </TouchableOpacity>
            </Animated.View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
