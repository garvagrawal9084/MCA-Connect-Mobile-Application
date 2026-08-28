/**
 * SCIS Connect Mobile - Placement Job Detail Modal
 * Complete drill-down sheet for inspecting job details, applying, saving & setting reminders.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { PlacementJob } from "@/features/placement/types";
import { usePlacementCenterStore } from "@/features/placement/store";
import { useAuthStore } from "@/features/auth/authStore";
import { placementCenterApi } from "@/features/placement/api";
import { logger } from "@/utils/logger";

interface PlacementJobDetailModalProps {
  visible: boolean;
  job: PlacementJob | null;
  onClose: () => void;
}

export const PlacementJobDetailModal: React.FC<PlacementJobDetailModalProps> = ({
  visible,
  job,
  onClose,
}) => {
  const [isApplying, setIsApplying] = useState(false);
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [isSendingNotice, setIsSendingNotice] = useState(false);

  const currentUser = useAuthStore((state) => state.user);
  const isStaffOrAdmin = ["admin", "owner", "recruiter"].includes(
    currentUser?.role || ""
  );

  const applyToJob = usePlacementCenterStore((state) => state.applyToJob);
  const toggleSaveJob = usePlacementCenterStore((state) => state.toggleSaveJob);
  const createReminder = usePlacementCenterStore((state) => state.createReminder);

  if (!job) return null;

  const isSaved = job.userState?.saved ?? false;
  const isApplied = job.userState?.applied ?? false;
  const hasReminder = job.userState?.reminder ?? false;

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowReminderPicker(false);
    onClose();
  };

  const handleToggleSave = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const res = await toggleSaveJob(job._id);
    if (res.message) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Bookmark", res.message);
    }
  };

  const handleApply = async () => {
    if (isApplied) {
      Alert.alert("Application Status", `You have already applied for this role. Status: ${job.userState?.applicationStatus || "Submitted"}`);
      return;
    }

    if (job.applyUrl) {
      Alert.alert(
        "External Application",
        `This drive requires applying via company portal (${job.companyName}). Would you like to open the link?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Open Portal",
            onPress: () => {
              Linking.openURL(job.applyUrl!);
              applyToJob(job._id);
            },
          },
        ]
      );
      return;
    }

    Alert.alert(
      "Confirm Application",
      `Submit your SCIS student profile for ${job.title} at ${job.companyName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm Apply",
          onPress: async () => {
            setIsApplying(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            const res = await applyToJob(job._id);
            setIsApplying(false);
            if (res.success) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert("Application Submitted! 🎉", "Your application has been registered with the placement cell.");
            } else {
              Alert.alert("Application Notice", res.message || "Failed to submit application");
            }
          },
        },
      ]
    );
  };

  const handleSetReminder = async (hoursBefore: number) => {
    if (!job.applicationDeadline) {
      Alert.alert("No Deadline", "This posting does not have a specified deadline.");
      return;
    }

    const deadline = new Date(job.applicationDeadline);
    const remindDate = new Date(deadline.getTime() - hoursBefore * 3600000);
    const remindIso = remindDate.toISOString();

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const res = await createReminder(job._id, remindIso);
    setShowReminderPicker(false);
    if (res.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Reminder Scheduled", `You will be alerted before deadline on ${remindDate.toLocaleDateString()}`);
    } else {
      Alert.alert("Reminder Notice", res.message || "Could not schedule reminder");
    }
  };

  const handleBroadcastNotification = async () => {
    Alert.alert(
      "Send Placement Notification",
      `Broadcast notification for "${job.title}" to all eligible SCIS students?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send Broadcast",
          onPress: async () => {
            setIsSendingNotice(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            try {
              const res = await placementCenterApi.sendJobNotifications(job._id);
              setIsSendingNotice(false);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert(
                "Notifications Sent! 📢",
                `Successfully notified eligible students (notified: ${res.data?.notified || "all"}, emails: ${res.data?.emails || "0"}).`
              );
            } catch (err: unknown) {
              setIsSendingNotice(false);
              const msg = err instanceof Error ? err.message : "Failed to broadcast notifications";
              Alert.alert("Notification Notice", msg);
            }
          },
        },
      ]
    );
  };

  const formatDeadline = (str?: string) => {
    if (!str) return "Not specified";
    try {
      return new Date(str).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return str;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-slate-50 dark:bg-slate-950">
        {/* Top Navigation Bar */}
        <View className="flex-row items-center justify-between px-5 py-4 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800">
          <View className="flex-row items-center flex-1 mr-2">
            <View className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 items-center justify-center mr-2.5">
              <Ionicons name="briefcase" size={16} color="#8B0000" />
            </View>
            <Text
              className="text-base font-black text-slate-900 dark:text-white flex-1"
              numberOfLines={1}
            >
              {job.companyName || "Drive Details"}
            </Text>
          </View>

          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={handleToggleSave}
              className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center"
            >
              <Ionicons
                name={isSaved ? "bookmark" : "bookmark-outline"}
                size={18}
                color={isSaved ? "#D97706" : "#64748B"}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleClose}
              className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center"
            >
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          className="flex-1 px-4 py-4"
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Job Hero Header */}
          <View className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 mb-4 shadow-xs">
            <View className="flex-row items-start justify-between mb-3">
              <View className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 items-center justify-center mr-3">
                <Text className="text-xl font-black text-[#8B0000] dark:text-red-400">
                  {(job.companyName || "C").charAt(0).toUpperCase()}
                </Text>
              </View>

              <View className="flex-row items-center gap-2">
                {job.verified !== false && (
                  <View className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full flex-row items-center">
                    <Ionicons name="star" size={10} color="#059669" />
                    <Text className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 ml-1">
                      Verified
                    </Text>
                  </View>
                )}

                <View className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                  <Text className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 capitalize">
                    {job.jobType === "internship" ? "Internship" : "Full-Time"}
                  </Text>
                </View>
              </View>
            </View>

            <Text className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
              {job.title}
            </Text>
            <Text className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3">
              {job.companyName}
            </Text>

            <View className="flex-row flex-wrap gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <View className="flex-row items-center bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl">
                <Ionicons name="location-outline" size={13} color="#64748B" />
                <Text className="text-xs text-slate-600 dark:text-slate-300 ml-1.5">
                  {job.location || "Multiple Locations"}
                </Text>
              </View>

              {job.mode && (
                <View className="flex-row items-center bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl">
                  <Ionicons name="business-outline" size={13} color="#64748B" />
                  <Text className="text-xs text-slate-600 dark:text-slate-300 ml-1.5 capitalize">
                    {job.mode}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Quick Metrics Bar */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5">
              <Text className="text-[10px] font-bold text-slate-400 uppercase">
                Compensation
              </Text>
              <Text className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {job.package ? `₹${job.package} LPA` : job.stipend ? `₹${job.stipend}/mo` : "Disclosed on Drive"}
              </Text>
            </View>

            <View className="flex-1 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5">
              <Text className="text-[10px] font-bold text-slate-400 uppercase">
                Deadline
              </Text>
              <Text className="text-base font-black text-rose-600 dark:text-rose-400 mt-1">
                {formatDeadline(job.applicationDeadline)}
              </Text>
            </View>
          </View>

          {/* Eligibility Requirements Card */}
          {job.eligibility && (
            <View className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 mb-4 shadow-xs">
              <View className="flex-row items-center mb-3">
                <Ionicons name="school-outline" size={18} color="#8B0000" />
                <Text className="text-sm font-black text-slate-900 dark:text-white ml-2">
                  Eligibility Criteria
                </Text>
              </View>

              {typeof job.eligibility.minimumCgpa === "number" && job.eligibility.minimumCgpa > 0 && (
                <View className="flex-row justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <Text className="text-xs text-slate-500">Minimum CGPA</Text>
                  <Text className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {job.eligibility.minimumCgpa} CGPA & above
                  </Text>
                </View>
              )}

              {Array.isArray(job.eligibility.eligibleBatches) && job.eligibility.eligibleBatches.length > 0 && (
                <View className="flex-row justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <Text className="text-xs text-slate-500">Eligible Batches</Text>
                  <Text className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {job.eligibility.eligibleBatches.join(", ")}
                  </Text>
                </View>
              )}

              {Array.isArray(job.eligibility.eligibleCourses) && job.eligibility.eligibleCourses.length > 0 && (
                <View className="flex-row justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <Text className="text-xs text-slate-500">Eligible Courses</Text>
                  <Text className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">
                    {job.eligibility.eligibleCourses.join(", ")}
                  </Text>
                </View>
              )}

              {Array.isArray(job.eligibility.skills) && job.eligibility.skills.length > 0 && (
                <View className="pt-2.5">
                  <Text className="text-xs text-slate-500 mb-2">Required Skills</Text>
                  <View className="flex-row flex-wrap gap-1.5">
                    {job.eligibility.skills.map((skill, i) => (
                      <View
                        key={i}
                        className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg"
                      >
                        <Text className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                          {skill}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Description & Responsibilities */}
          {job.description && (
            <View className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 mb-4 shadow-xs">
              <View className="flex-row items-center mb-2.5">
                <Ionicons name="document-text-outline" size={18} color="#8B0000" />
                <Text className="text-sm font-black text-slate-900 dark:text-white ml-2">
                  Job Description
                </Text>
              </View>
              <Text className="text-xs text-slate-600 dark:text-slate-300 leading-5">
                {job.description}
              </Text>
            </View>
          )}

          {/* Reminder Trigger Bar */}
          <TouchableOpacity
            onPress={() => setShowReminderPicker(!showReminderPicker)}
            className="bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/80 rounded-2xl p-4 flex-row items-center justify-between mb-4"
          >
            <View className="flex-row items-center">
              <Ionicons name="time" size={18} color="#7C3AED" />
              <View className="ml-2.5">
                <Text className="text-xs font-bold text-purple-900 dark:text-purple-200">
                  {hasReminder ? "Deadline Reminder Active" : "Set Deadline Reminder"}
                </Text>
                <Text className="text-[10px] text-purple-600 dark:text-purple-400">
                  Get notified before applications close
                </Text>
              </View>
            </View>
            <Ionicons
              name={showReminderPicker ? "chevron-up" : "chevron-down"}
              size={16}
              color="#7C3AED"
            />
          </TouchableOpacity>

          {showReminderPicker && (
            <View className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 mb-4 flex-row justify-between gap-2">
              <TouchableOpacity
                onPress={() => handleSetReminder(24)}
                className="flex-1 py-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/60 items-center"
              >
                <Text className="text-xs font-bold text-purple-900 dark:text-purple-200">
                  1 Day Before
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleSetReminder(72)}
                className="flex-1 py-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/60 items-center"
              >
                <Text className="text-xs font-bold text-purple-900 dark:text-purple-200">
                  3 Days Before
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Admin / Staff Broadcast Notification Trigger */}
          {isStaffOrAdmin && (
            <TouchableOpacity
              onPress={handleBroadcastNotification}
              disabled={isSendingNotice}
              className="bg-slate-900 dark:bg-slate-800 border border-slate-700 rounded-2xl p-4 mb-4 flex-row items-center justify-between shadow-xs"
            >
              <View className="flex-row items-center flex-1 mr-2">
                <Ionicons name="megaphone" size={18} color="#F59E0B" />
                <View className="ml-2.5">
                  <Text className="text-xs font-bold text-white">
                    Broadcast Job Notification
                  </Text>
                  <Text className="text-[10px] text-slate-400">
                    Send push notification & email to eligible students
                  </Text>
                </View>
              </View>

              {isSendingNotice ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <View className="bg-amber-500 px-2.5 py-1 rounded-lg">
                  <Text className="text-[10px] font-bold text-slate-900">
                    Notify All
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Floating Bottom Action Bar */}
        <View className="absolute bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200/80 dark:border-slate-800 flex-row items-center gap-3">
          <TouchableOpacity
            onPress={handleToggleSave}
            className={`w-12 h-12 rounded-2xl border items-center justify-center ${
              isSaved
                ? "bg-amber-50 border-amber-300 dark:bg-amber-950/60 dark:border-amber-700"
                : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            }`}
          >
            <Ionicons
              name={isSaved ? "bookmark" : "bookmark-outline"}
              size={20}
              color={isSaved ? "#D97706" : "#64748B"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleApply}
            disabled={isApplying || isApplied}
            className={`flex-1 h-12 rounded-2xl flex-row items-center justify-center shadow-xs ${
              isApplied
                ? "bg-emerald-600"
                : isApplying
                ? "bg-slate-400"
                : "bg-[#8B0000]"
            }`}
          >
            {isApplying ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons
                  name={isApplied ? "checkmark-circle" : "send"}
                  size={16}
                  color="#FFFFFF"
                />
                <Text className="text-sm font-bold text-white ml-2">
                  {isApplied ? "Applied (Submitted)" : "Apply for Drive"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
