import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useAlumniPosts } from "@/features/alumni/hooks";
import { useAlumniStore } from "@/features/alumni/store";
import { PostCard } from "@/components/alumni/PostCard";
import { AlumniFilterChips } from "@/components/alumni/AlumniFilterChips";
import { logger } from "@/utils/logger";

const TYPE_FILTERS = [
  { label: "All", value: "all" },
  { label: "Posts", value: "post" },
  { label: "Jobs", value: "job" },
  { label: "Stories", value: "story" },
  { label: "Questions", value: "question" },
  { label: "Referrals", value: "referral" },
];

export default function CommunityScreen() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<string>("all");
  const { posts, isLoading, hasMore, fetchMore, createPost, toggleLike, refetch } =
    useAlumniPosts(selectedType === "all" ? undefined : selectedType);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostType, setNewPostType] = useState("post");
  const [newPostTags, setNewPostTags] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    logger.info("ALUMNI", "Community screen rendered");
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleTypeFilter = (value: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedType(value);
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) {
      Alert.alert("Required", "Please enter some content for your post.");
      return;
    }

    setIsCreating(true);
    const tags = newPostTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const success = await createPost(newPostContent.trim(), newPostType, tags);
    setIsCreating(false);

    if (success) {
      setShowCreateModal(false);
      setNewPostContent("");
      setNewPostType("post");
      setNewPostTags("");
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAFA] dark:bg-slate-950">
      <StatusBar style="auto" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#8B0000" />
        }
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(260).springify().damping(20)}
          className="px-5 pt-3 pb-4"
        >
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity
              onPress={handleBack}
              className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 items-center justify-center shadow-xs"
            >
              <Ionicons name="arrow-back" size={18} color="#64748B" />
            </TouchableOpacity>
            <View className="flex-row items-center bg-red-50 dark:bg-red-950/60 border border-red-200/80 dark:border-red-800/80 px-3 py-1.5 rounded-full">
              <Ionicons name="chatbubbles" size={13} color="#8B0000" />
              <Text className="text-[11px] font-bold text-red-800 dark:text-red-300 ml-1.5">
                COMMUNITY
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowCreateModal(true)}
              className="w-10 h-10 rounded-full bg-red-800 items-center justify-center shadow-xs"
            >
              <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
          </View>

          <Text className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
            Alumni Community
          </Text>
          <Text className="text-sm text-slate-500 dark:text-slate-400 leading-5">
            Share stories, jobs, and experiences with fellow alumni
          </Text>
        </Animated.View>

        {/* Type Filters */}
        <Animated.View entering={FadeInDown.delay(60).duration(280).springify().damping(20)} className="px-5">
          <AlumniFilterChips
            filters={TYPE_FILTERS}
            selectedValues={selectedType === "all" ? [] : [selectedType]}
            onToggle={handleTypeFilter}
            multiSelect={false}
          />
        </Animated.View>

        {/* Posts List */}
        <Animated.View entering={FadeInDown.delay(90).duration(300).springify().damping(20)} className="px-5">
          {isLoading && posts.length === 0 ? (
            <View className="items-center py-12">
              <ActivityIndicator size="large" color="#8B0000" />
              <Text className="text-sm text-slate-400 dark:text-slate-500 mt-3">
                Loading posts...
              </Text>
            </View>
          ) : posts.length === 0 ? (
            <View className="items-center py-12">
              <View className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/60 border border-red-200/80 dark:border-red-800/80 items-center justify-center mb-4">
                <Ionicons name="chatbubbles-outline" size={28} color="#8B0000" />
              </View>
              <Text className="text-base font-bold text-slate-900 dark:text-white mb-1">
                No posts yet
              </Text>
              <Text className="text-sm text-slate-500 dark:text-slate-400 text-center">
                Be the first to share something with the community
              </Text>
            </View>
          ) : (
            <>
              {posts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  onLike={() => toggleLike(post._id)}
                />
              ))}

              {hasMore && (
                <TouchableOpacity
                  onPress={fetchMore}
                  activeOpacity={0.7}
                  className="bg-red-50 dark:bg-red-950/60 border border-red-200/80 dark:border-red-800/80 py-3 rounded-2xl items-center mb-3"
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#8B0000" />
                  ) : (
                    <Text className="text-sm font-semibold text-red-800 dark:text-red-300">
                      Load More
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </>
          )}
        </Animated.View>
      </ScrollView>

      {/* Create Post Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View className="flex-1 bg-black/60 justify-end p-0">
          <View className="bg-white dark:bg-slate-900 rounded-t-[32px] p-6 max-h-[85%] border-t border-slate-200 dark:border-slate-800 shadow-2xl">
            <View className="items-center mb-3">
              <View className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
            </View>

            <View className="flex-row items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <Text className="text-lg font-black text-slate-900 dark:text-white">
                Create Post
              </Text>
              <TouchableOpacity
                onPress={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center"
              >
                <Ionicons name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Type
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                {["post", "job", "story", "question", "referral"].map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setNewPostType(type)}
                    className={`mr-2 px-4 py-2 rounded-full border ${
                      newPostType === type
                        ? "bg-red-800 border-red-800"
                        : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold capitalize ${
                        newPostType === type ? "text-white" : "text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Content *
              </Text>
              <TextInput
                className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white mb-4 min-h-[120px]"
                placeholder="What's on your mind?"
                placeholderTextColor="#94A3B8"
                value={newPostContent}
                onChangeText={setNewPostContent}
                multiline
                textAlignVertical="top"
              />

              <Text className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Tags (comma separated)
              </Text>
              <TextInput
                className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white mb-4"
                placeholder="e.g. react, career, advice"
                placeholderTextColor="#94A3B8"
                value={newPostTags}
                onChangeText={setNewPostTags}
                autoCorrect={false}
              />

              <TouchableOpacity
                onPress={handleCreatePost}
                disabled={isCreating || !newPostContent.trim()}
                activeOpacity={0.85}
                className={`py-3.5 rounded-2xl items-center ${
                  isCreating || !newPostContent.trim()
                    ? "bg-slate-200 dark:bg-slate-800"
                    : "bg-red-800"
                }`}
              >
                {isCreating ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white font-bold text-sm">Post</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
