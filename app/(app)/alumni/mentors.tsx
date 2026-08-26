import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useMentors } from "@/features/alumni/hooks";
import { useAlumniStore } from "@/features/alumni/store";
import { MentorCard } from "@/components/alumni/MentorCard";
import { Mentor } from "@/features/alumni/types";
import { logger } from "@/utils/logger";

export default function MentorsScreen() {
  const router = useRouter();
  const { mentors, isLoading, hasMore, fetchMore, refetch } = useMentors();
  const createRequest = useAlumniStore((s) => s.createMentorshipRequest);

  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [areas, setAreas] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    logger.info("ALUMNI", "Mentors screen rendered");
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleRequestMentorship = (mentor: Mentor) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedMentor(mentor);
    setShowRequestModal(true);
  };

  const handleSendRequest = async () => {
    if (!selectedMentor || !message.trim()) {
      Alert.alert("Required", "Please enter a message.");
      return;
    }

    setIsSending(true);
    const parsedAreas = areas
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);

    const success = await createRequest(selectedMentor._id, parsedAreas, message.trim());
    setIsSending(false);

    if (success) {
      setShowRequestModal(false);
      setSelectedMentor(null);
      setAreas("");
      setMessage("");
      Alert.alert("Request Sent", "Your mentorship request has been sent!");
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
              <Ionicons name="school" size={13} color="#8B0000" />
              <Text className="text-[11px] font-bold text-red-800 dark:text-red-300 ml-1.5">
                MENTORS
              </Text>
            </View>
            <View className="w-10" />
          </View>

          <Text className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
            Find a Mentor
          </Text>
          <Text className="text-sm text-slate-500 dark:text-slate-400 leading-5">
            Connect with experienced alumni for career guidance
          </Text>
        </Animated.View>

        {/* Mentor List */}
        <Animated.View entering={FadeInDown.delay(60).duration(300).springify().damping(20)} className="px-5">
          {isLoading && mentors.length === 0 ? (
            <View className="items-center py-12">
              <ActivityIndicator size="large" color="#8B0000" />
              <Text className="text-sm text-slate-400 dark:text-slate-500 mt-3">
                Loading mentors...
              </Text>
            </View>
          ) : mentors.length === 0 ? (
            <View className="items-center py-12">
              <View className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/60 border border-red-200/80 dark:border-red-800/80 items-center justify-center mb-4">
                <Ionicons name="school-outline" size={28} color="#8B0000" />
              </View>
              <Text className="text-base font-bold text-slate-900 dark:text-white mb-1">
                No mentors available
              </Text>
              <Text className="text-sm text-slate-500 dark:text-slate-400 text-center">
                Check back later for available mentors
              </Text>
            </View>
          ) : (
            <>
              {mentors.map((mentor) => (
                <MentorCard
                  key={mentor._id}
                  mentor={mentor}
                  onRequestMentorship={() => handleRequestMentorship(mentor)}
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

      {/* Mentorship Request Modal */}
      <Modal
        visible={showRequestModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRequestModal(false)}
      >
        <View className="flex-1 bg-black/60 justify-end p-0">
          <View className="bg-white dark:bg-slate-900 rounded-t-[32px] p-6 max-h-[85%] border-t border-slate-200 dark:border-slate-800 shadow-2xl">
            <View className="items-center mb-3">
              <View className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
            </View>

            <View className="flex-row items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <View>
                <Text className="text-[11px] font-bold text-red-800 dark:text-red-300 uppercase tracking-wider">
                  MENTORSHIP REQUEST
                </Text>
                <Text className="text-lg font-black text-slate-900 dark:text-white">
                  to {selectedMentor?.name}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowRequestModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center"
              >
                <Ionicons name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Areas (comma separated)
              </Text>
              <TextInput
                className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white mb-4"
                placeholder="e.g. System Design, React, Career Advice"
                placeholderTextColor="#94A3B8"
                value={areas}
                onChangeText={setAreas}
                autoCorrect={false}
              />

              <Text className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Message *
              </Text>
              <TextInput
                className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white mb-4 min-h-[100px]"
                placeholder="Tell them why you'd like mentorship..."
                placeholderTextColor="#94A3B8"
                value={message}
                onChangeText={setMessage}
                multiline
                textAlignVertical="top"
              />

              <TouchableOpacity
                onPress={handleSendRequest}
                disabled={isSending || !message.trim()}
                activeOpacity={0.85}
                className={`py-3.5 rounded-2xl items-center ${
                  isSending || !message.trim()
                    ? "bg-slate-200 dark:bg-slate-800"
                    : "bg-red-800"
                }`}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white font-bold text-sm">Send Request</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
