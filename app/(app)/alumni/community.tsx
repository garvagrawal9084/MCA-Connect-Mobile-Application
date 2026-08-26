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
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useAlumniForums } from "@/features/alumni/hooks";
import { ForumTopicCard } from "@/components/alumni/ForumTopicCard";
import { logger } from "@/utils/logger";

export default function CommunityScreen() {
  const router = useRouter();
  const {
    forums,
    isLoading,
    hasMore,
    fetchMore,
    createTopic,
    addReply,
    toggleLike,
    refetch,
  } = useAlumniForums();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newTags, setNewTags] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    logger.info("ALUMNI", "Forums screen rendered");
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleCreateTopic = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      Alert.alert("Required", "Please enter both a title and content for your topic.");
      return;
    }

    setIsCreating(true);
    const tags = newTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const success = await createTopic(newTitle.trim(), newContent.trim(), tags);
    setIsCreating(false);

    if (success) {
      setShowCreateModal(false);
      setNewTitle("");
      setNewContent("");
      setNewTags("");
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
                FORUMS
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
            Alumni Forums
          </Text>
          <Text className="text-sm text-slate-500 dark:text-slate-400 leading-5">
            Discuss topics, share knowledge, and connect with fellow alumni
          </Text>
        </Animated.View>

        {/* Topics List */}
        <Animated.View entering={FadeInDown.delay(60).duration(280).springify().damping(20)} className="px-5">
          {isLoading && forums.length === 0 ? (
            <View className="items-center py-12">
              <ActivityIndicator size="large" color="#8B0000" />
              <Text className="text-sm text-slate-400 dark:text-slate-500 mt-3">
                Loading forums...
              </Text>
            </View>
          ) : forums.length === 0 ? (
            <View className="items-center py-12">
              <View className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/60 border border-red-200/80 dark:border-red-800/80 items-center justify-center mb-4">
                <Ionicons name="chatbubbles-outline" size={28} color="#8B0000" />
              </View>
              <Text className="text-base font-bold text-slate-900 dark:text-white mb-1">
                No topics yet
              </Text>
              <Text className="text-sm text-slate-500 dark:text-slate-400 text-center">
                Start a discussion and be the first to share
              </Text>
            </View>
          ) : (
            <>
              {forums.map((topic) => (
                <ForumTopicCard
                  key={topic._id}
                  topic={topic}
                  onLike={() => toggleLike(topic._id)}
                  onPress={() => router.push({ pathname: "/(app)/alumni/topic", params: { id: topic._id } })}
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

      {/* Create Topic Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <View className="flex-1 bg-black/60 justify-end p-0">
            <View className="bg-white dark:bg-slate-900 rounded-t-[32px] p-6 max-h-[85%] border-t border-slate-200 dark:border-slate-800 shadow-2xl">
              <View className="items-center mb-3">
                <View className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
              </View>

              <View className="flex-row items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
                <Text className="text-lg font-black text-slate-900 dark:text-white">
                  New Topic
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
                  Title *
                </Text>
                <TextInput
                  className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white mb-4"
                  placeholder="Enter topic title"
                  placeholderTextColor="#94A3B8"
                  value={newTitle}
                  onChangeText={setNewTitle}
                />

                <Text className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Content *
                </Text>
                <TextInput
                  className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white mb-4 min-h-[120px]"
                  placeholder="Describe your topic"
                  placeholderTextColor="#94A3B8"
                  value={newContent}
                  onChangeText={setNewContent}
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
                  value={newTags}
                  onChangeText={setNewTags}
                  autoCorrect={false}
                />

                <TouchableOpacity
                  onPress={handleCreateTopic}
                  disabled={isCreating || !newTitle.trim() || !newContent.trim()}
                  activeOpacity={0.85}
                  className={`py-3.5 rounded-2xl items-center ${
                    isCreating || !newTitle.trim() || !newContent.trim()
                      ? "bg-slate-200 dark:bg-slate-800"
                      : "bg-red-800"
                  }`}
                >
                  {isCreating ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-white font-bold text-sm">Create Topic</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
