import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "react-native";
import { useAlumniStore } from "@/features/alumni/store";
import { ForumTopic } from "@/features/alumni/types";
import alumniApi from "@/features/alumni/api";
import { logger } from "@/utils/logger";

const getProfileImage = (profileImage: unknown): string | null => {
  if (!profileImage) return null;
  if (typeof profileImage === "string") return profileImage;
  if (typeof profileImage === "object" && profileImage !== null) {
    return (profileImage as { url?: string }).url || null;
  }
  return null;
};

export default function TopicDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [topic, setTopic] = useState<ForumTopic | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const addForumReply = useAlumniStore((s) => s.addForumReply);
  const toggleForumLike = useAlumniStore((s) => s.toggleForumLike);

  useEffect(() => {
    if (!id) return;
    fetchTopic();
  }, [id]);

  const fetchTopic = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await alumniApi.getForumTopic(id);
      if (response.data?.topic) {
        setTopic(response.data.topic);
      }
    } catch (err) {
      logger.error("ALUMNI", "Failed to fetch topic", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !id) return;
    setIsReplying(true);
    const success = await addForumReply(id, replyText.trim());
    setIsReplying(false);
    if (success) {
      setReplyText("");
      await fetchTopic();
    }
  };

  const handleLike = async () => {
    if (!id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await toggleForumLike(id);
    await fetchTopic();
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const timeAgo = (dateStr: string) => {
    const now = Date.now();
    const created = new Date(dateStr).getTime();
    const diffMs = now - created;
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#FAFAFA] dark:bg-slate-950">
        <StatusBar style="auto" />
        <View className="flex-row items-center justify-between px-5 pt-3 pb-4">
          <TouchableOpacity
            onPress={handleBack}
            className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 items-center justify-center shadow-xs"
          >
            <Ionicons name="arrow-back" size={18} color="#64748B" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-slate-900 dark:text-white">Topic</Text>
          <View className="w-10" />
        </View>
        <View className="items-center py-12">
          <ActivityIndicator size="large" color="#8B0000" />
          <Text className="text-sm text-slate-400 dark:text-slate-500 mt-3">Loading topic...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!topic) {
    return (
      <SafeAreaView className="flex-1 bg-[#FAFAFA] dark:bg-slate-950">
        <StatusBar style="auto" />
        <View className="flex-row items-center justify-between px-5 pt-3 pb-4">
          <TouchableOpacity
            onPress={handleBack}
            className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 items-center justify-center shadow-xs"
          >
            <Ionicons name="arrow-back" size={18} color="#64748B" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-slate-900 dark:text-white">Topic</Text>
          <View className="w-10" />
        </View>
        <View className="items-center py-12">
          <Ionicons name="alert-circle-outline" size={48} color="#94A3B8" />
          <Text className="text-base font-bold text-slate-900 dark:text-white mt-3">Topic not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const authorInitials = topic.author?.name
    ? topic.author.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  const authorPhoto = getProfileImage(topic.author?.profileImage);

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAFA] dark:bg-slate-950">
      <StatusBar style="auto" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <TouchableOpacity
            onPress={handleBack}
            className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 items-center justify-center shadow-xs"
          >
            <Ionicons name="arrow-back" size={18} color="#64748B" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-slate-900 dark:text-white" numberOfLines={1}>
            Forum Topic
          </Text>
          <View className="w-10" />
        </View>

        <ScrollView
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          className="flex-1"
        >
          {/* Topic Content */}
          <Animated.View entering={FadeInDown.duration(260).springify().damping(20)} className="px-5 pt-4 pb-3">
            <View className="flex-row items-center mb-3">
              {authorPhoto ? (
                <Image source={{ uri: authorPhoto }} className="w-11 h-11 rounded-full mr-3" />
              ) : (
                <View className="w-11 h-11 rounded-full bg-red-100 dark:bg-red-900/40 items-center justify-center mr-3">
                  <Text className="text-sm font-bold text-red-700 dark:text-red-300">{authorInitials}</Text>
                </View>
              )}
              <View className="flex-1">
                <Text className="text-sm font-bold text-slate-900 dark:text-white">
                  {topic.author?.name || "Anonymous"}
                </Text>
                <Text className="text-[11px] text-slate-400 dark:text-slate-500">
                  {timeAgo(topic.createdAt)}
                </Text>
              </View>
              {topic.closed && (
                <View className="flex-row items-center bg-red-50 dark:bg-red-950/60 border border-red-200/80 dark:border-red-800/80 px-2 py-1 rounded-full">
                  <Ionicons name="lock-closed-outline" size={11} color="#EF4444" />
                  <Text className="text-[10px] font-semibold text-red-500 ml-1">Closed</Text>
                </View>
              )}
              {topic.pinned && (
                <View className="flex-row items-center bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/80 px-2 py-1 rounded-full">
                  <Ionicons name="pin-outline" size={11} color="#F59E0B" />
                  <Text className="text-[10px] font-semibold text-amber-500 ml-1">Pinned</Text>
                </View>
              )}
            </View>

            <Text className="text-xl font-black text-slate-900 dark:text-white mb-2">{topic.title}</Text>
            <Text className="text-sm text-slate-700 dark:text-slate-300 leading-6">{topic.content}</Text>

            {topic.tags && topic.tags.length > 0 && (
              <View className="flex-row flex-wrap gap-1.5 mt-3">
                {topic.tags.map((tag, index) => (
                  <View
                    key={index}
                    className="bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 px-2.5 py-1 rounded-full"
                  >
                    <Text className="text-[11px] font-medium text-slate-500 dark:text-slate-400">#{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Like + Stats */}
            <View className="flex-row items-center mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <TouchableOpacity
                onPress={handleLike}
                className="flex-row items-center mr-5"
                activeOpacity={0.7}
              >
                <Ionicons
                  name={topic.isLiked ? "heart" : "heart-outline"}
                  size={18}
                  color={topic.isLiked ? "#EF4444" : "#94A3B8"}
                />
                <Text className="text-xs text-slate-500 dark:text-slate-400 ml-1.5">
                  {topic.likeCount || topic.likes?.length || 0}
                </Text>
              </TouchableOpacity>

              <View className="flex-row items-center mr-5">
                <Ionicons name="chatbubble-outline" size={16} color="#94A3B8" />
                <Text className="text-xs text-slate-500 dark:text-slate-400 ml-1.5">
                  {topic.replyCount || topic.replies?.length || 0} replies
                </Text>
              </View>

              <View className="flex-row items-center">
                <Ionicons name="eye-outline" size={16} color="#94A3B8" />
                <Text className="text-xs text-slate-500 dark:text-slate-400 ml-1.5">{topic.views || 0}</Text>
              </View>
            </View>
          </Animated.View>

          {/* Replies Section */}
          <Animated.View entering={FadeInDown.delay(60).duration(280).springify().damping(20)} className="px-5">
            <Text className="text-sm font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              Replies ({topic.replies?.length || 0})
            </Text>

            {topic.replies && topic.replies.length > 0 ? (
              topic.replies.map((reply, index) => {
                const replyInitials = reply.author?.name
                  ? reply.author.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)
                  : "??";
                const replyPhoto = getProfileImage(reply.author?.profileImage);

                return (
                  <View
                    key={reply._id || index}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 mb-3"
                  >
                    <View className="flex-row items-center mb-2">
                      {replyPhoto ? (
                        <Image source={{ uri: replyPhoto }} className="w-8 h-8 rounded-full mr-2.5" />
                      ) : (
                        <View className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center mr-2.5">
                          <Text className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                            {replyInitials}
                          </Text>
                        </View>
                      )}
                      <View className="flex-1">
                        <Text className="text-xs font-bold text-slate-900 dark:text-white">
                          {reply.author?.name || "Anonymous"}
                        </Text>
                        <Text className="text-[10px] text-slate-400 dark:text-slate-500">
                          {timeAgo(reply.createdAt)}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-sm text-slate-700 dark:text-slate-300 leading-5">
                      {reply.text}
                    </Text>
                  </View>
                );
              })
            ) : (
              <View className="items-center py-8">
                <Ionicons name="chatbubble-outline" size={32} color="#CBD5E1" />
                <Text className="text-sm text-slate-400 dark:text-slate-500 mt-2">
                  No replies yet. Be the first to respond!
                </Text>
              </View>
            )}
          </Animated.View>
        </ScrollView>

        {/* Reply Input */}
        {!topic.closed && (
          <View className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-5 py-3">
            <View className="flex-row items-center">
              <TextInput
                className="flex-1 bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60 rounded-full px-4 py-2.5 text-sm text-slate-900 dark:text-white mr-3"
                placeholder="Write a reply..."
                placeholderTextColor="#94A3B8"
                value={replyText}
                onChangeText={setReplyText}
                multiline
              />
              <TouchableOpacity
                onPress={handleReply}
                disabled={isReplying || !replyText.trim()}
                className={`w-10 h-10 rounded-full items-center justify-center ${
                  isReplying || !replyText.trim()
                    ? "bg-slate-200 dark:bg-slate-800"
                    : "bg-red-800"
                }`}
              >
                {isReplying ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Ionicons name="send" size={16} color="white" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
