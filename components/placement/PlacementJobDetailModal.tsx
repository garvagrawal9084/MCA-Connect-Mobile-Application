/**
 * SCIS Connect Mobile - Placement Job Detail Modal
 * Complete drill-down sheet for inspecting job details, applying, saving & setting reminders.
 * Seamlessly opens official application portals (officialLink, careersPage, applyUrl)
 * and synchronizes application status with the Placement Center backend.
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
  Platform,
  StatusBar as RNStatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { PlacementJob } from "@/features/placement/types";
import { usePlacementCenterStore } from "@/features/placement/store";
import { useAuthStore } from "@/features/auth/authStore";
import { useNotificationsStore } from "@/features/notifications/store";
import { notificationEngine } from "@/services/notifications";
import { placementCenterApi } from "@/features/placement/api";
import { openExternalUrl, formatExternalUrl } from "@/utils/url";
import { logger } from "@/utils/logger";

interface PlacementJobDetailModalProps {
  visible: boolean;
  job: PlacementJob | null;
  onClose: () => void;
}

/**
 * Normalizes string, number, or array inputs into a clean array of string items.
 * Handles comma-separated values seamlessly (e.g. "MCA, B.TECH, M.TECH").
 */
const normalizeStringList = (
  input?: string[] | number[] | string | number | null
): string[] => {
  if (input === undefined || input === null) return [];
  if (Array.isArray(input)) {
    return input
      .flatMap((item) =>
        typeof item === "string" ? item.split(/,\s*/) : [String(item)]
      )
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
  if (typeof input === "string") {
    return input
      .split(/,\s*/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
  if (typeof input === "number") {
    return [String(input)];
  }
  return [];
};

export const PlacementJobDetailModal: React.FC<PlacementJobDetailModalProps> = ({
  visible,
  job,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === "android" ? (RNStatusBar.currentHeight ?? 24) : 0
  );

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

  // Resolve external portal & careers links
  const officialUrl = formatExternalUrl(
    job.officialLink || job.applyUrl || job.externalApplyUrl
  );
  const rawCareers =
    job.careersPage ||
    (typeof job.company === "object" && job.company
      ? job.company.careersUrl || job.company.website
      : undefined);
  const careersUrl = formatExternalUrl(rawCareers);
  const targetApplicationUrl = officialUrl || careersUrl;
  const hasReferral = Boolean(job.referralAvailable);

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
      Alert.alert(
        "Application Status",
        `You have already applied for this role. Status: ${
          job.userState?.applicationStatus || "Submitted"
        }`
      );
      return;
    }

    if (targetApplicationUrl) {
      Alert.alert(
        "Official Application Site",
        `This recruitment drive is hosted on the official company portal (${job.companyName}).\n\nWould you like to open the official site to complete your application?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Open Official Site ↗",
            onPress: async () => {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
              logger.info(
                "PLACEMENT_APPLY",
                `Opening official application portal: ${targetApplicationUrl} for job: ${job._id}`
              );

              // 1. Launch external browser
              await openExternalUrl(targetApplicationUrl);

              // 2. Register application in backend
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
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
              Alert.alert(
                "Application Submitted! 🎉",
                "Your application has been registered with the placement cell."
              );
            } else {
              Alert.alert(
                "Application Notice",
                res.message || "Failed to submit application"
              );
            }
          },
        },
      ]
    );
  };

  const handleDirectExternalOpen = async (url: string, title: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    logger.info("PLACEMENT_APPLY", `Directly opening link for ${title}: ${url}`);
    await openExternalUrl(url);
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

      const company =
        job.companyName ||
        (typeof job.company === "object" ? job.company?.name : job.company) ||
        "Campus Placement";

      // Calculate delay in seconds for local scheduling if in future
      const nowMs = Date.now();
      const remindMs = remindDate.getTime();
      const delaySec = Math.floor((remindMs - nowMs) / 1000);

      // 1. Trigger immediate confirmation alert and in-app banner
      await notificationEngine.trigger(
        "APPLICATION_DEADLINE",
        {
          jobId: job._id,
          jobTitle: job.title || "Job Opportunity",
          companyName: company,
          hoursRemaining: hoursBefore,
        },
        {
          force: true,
        }
      );

      // 2. Schedule OS notification for future deadline alert if in future
      if (delaySec > 5 && delaySec < 86400 * 30) {
        Notifications.scheduleNotificationAsync({
          content: {
            title: `⏰ Deadline Alert: ${job.title || "Job Opportunity"}`,
            body: `Application deadline in ${hoursBefore}h for ${company}. Tap to apply now.`,
            sound: "default",
            color: "#7C3AED",
            data: {
              type: "JOB_DEADLINE_REMINDER",
              jobId: job._id,
              screen: "/(app)/placement/center",
            },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: delaySec,
          },
        }).catch(() => {});
      }

      useNotificationsStore.getState().fetchNotifications().catch(() => {});
      useNotificationsStore.getState().fetchUnreadCount().catch(() => {});

      Alert.alert(
        "Reminder Scheduled",
        `You will be alerted before deadline on ${remindDate.toLocaleDateString()}`
      );
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
              const res = await placementCenterApi.sendJobNotifications(job._id, {
                sendEmail: true,
                sendWeb: true,
              });
              setIsSendingNotice(false);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

              const company =
                job.companyName ||
                (typeof job.company === "object" ? job.company?.name : job.company) ||
                "Campus Placement";

              await notificationEngine.trigger(
                "JOB_POSTED",
                {
                  jobId: job._id,
                  jobTitle: job.title || "Software Opportunity",
                  companyName: company,
                  package: job.package,
                  stipend: job.stipend,
                  jobType: job.jobType,
                  location: job.location,
                  deadline: job.applicationDeadline,
                  link: job.officialLink || job.applyUrl || job.careersPage,
                },
                { force: true }
              );

              useNotificationsStore.getState().fetchNotifications().catch(() => {});
              useNotificationsStore.getState().fetchUnreadCount().catch(() => {});

              Alert.alert(
                "Notifications Sent! 📢",
                `Successfully notified eligible students (notified: ${
                  res.data?.notified || "all"
                }, emails: ${res.data?.emails || "0"}).`
              );
            } catch (err: unknown) {
              setIsSendingNotice(false);
              const msg =
                err instanceof Error
                  ? err.message
                  : "Failed to broadcast notifications";
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
        <View
          style={{ paddingTop: Math.max(topInset + 8, 16) }}
          className="flex-row items-center justify-between px-5 pb-4 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800"
        >
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

              <View className="flex-row items-center flex-wrap gap-1.5 justify-end flex-1">
                {job.verified !== false && (
                  <View className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full flex-row items-center">
                    <Ionicons name="star" size={10} color="#059669" />
                    <Text className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 ml-1">
                      Verified
                    </Text>
                  </View>
                )}

                {hasReferral && (
                  <View className="bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-2.5 py-1 rounded-full flex-row items-center">
                    <Ionicons name="people" size={10} color="#2563EB" />
                    <Text className="text-[11px] font-bold text-blue-700 dark:text-blue-300 ml-1">
                      Referral
                    </Text>
                  </View>
                )}

                {officialUrl && (
                  <View className="bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 px-2.5 py-1 rounded-full flex-row items-center">
                    <Ionicons name="globe-outline" size={10} color="#7C3AED" />
                    <Text className="text-[11px] font-bold text-purple-700 dark:text-purple-300 ml-1">
                      Official Portal
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
                {job.package
                  ? `₹${job.package} LPA`
                  : job.stipend
                  ? `₹${job.stipend}/mo`
                  : "Disclosed on Drive"}
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

          {/* Official Application Portal Quick Action Banner */}
          {officialUrl && (
            <View className="bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/80 rounded-3xl p-4 mb-4 shadow-xs">
              <View className="flex-row items-start justify-between">
                <View className="flex-row items-start flex-1 mr-3">
                  <View className="w-9 h-9 rounded-xl bg-purple-600 items-center justify-center mr-2.5 mt-0.5">
                    <Ionicons name="globe" size={18} color="#FFFFFF" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-purple-950 dark:text-purple-100">
                      Official Application Portal
                    </Text>
                    <Text
                      className="text-[11px] text-purple-700 dark:text-purple-300 mt-0.5"
                      numberOfLines={1}
                    >
                      {officialUrl}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() =>
                    handleDirectExternalOpen(
                      officialUrl,
                      "Official Application Portal"
                    )
                  }
                  activeOpacity={0.8}
                  className="bg-purple-600 px-3 py-2 rounded-xl flex-row items-center shadow-xs"
                >
                  <Text className="text-xs font-bold text-white mr-1">
                    Open Site
                  </Text>
                  <Ionicons name="open-outline" size={12} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Company Careers Page Banner */}
          {careersUrl && careersUrl !== officialUrl && (
            <View className="bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 mb-4 shadow-xs">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1 mr-3">
                  <View className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 items-center justify-center mr-2.5">
                    <Ionicons name="business" size={15} color="#64748B" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-slate-900 dark:text-white">
                      Company Careers Site
                    </Text>
                    <Text
                      className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5"
                      numberOfLines={1}
                    >
                      {careersUrl}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() =>
                    handleDirectExternalOpen(
                      careersUrl,
                      "Company Careers Page"
                    )
                  }
                  activeOpacity={0.8}
                  className="bg-slate-200 dark:bg-slate-800 px-3 py-1.5 rounded-xl flex-row items-center"
                >
                  <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300 mr-1">
                    Visit Page
                  </Text>
                  <Ionicons name="open-outline" size={12} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Eligibility Requirements Card */}
          {job.eligibility && (
            <View className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 mb-4 shadow-xs">
              <View className="flex-row items-center mb-3.5">
                <Ionicons name="school-outline" size={18} color="#8B0000" />
                <Text className="text-sm font-black text-slate-900 dark:text-white ml-2">
                  Eligibility Criteria
                </Text>
              </View>

              {/* Minimum CGPA */}
              {typeof job.eligibility.minimumCgpa === "number" &&
                job.eligibility.minimumCgpa > 0 && (
                  <View className="flex-row justify-between items-center py-2.5 border-b border-slate-100 dark:border-slate-800">
                    <Text className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Minimum CGPA
                    </Text>
                    <View className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 px-2.5 py-0.5 rounded-lg">
                      <Text className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                        {job.eligibility.minimumCgpa} CGPA & above
                      </Text>
                    </View>
                  </View>
                )}

              {/* Eligible Batches */}
              {(() => {
                const batches = normalizeStringList(job.eligibility?.eligibleBatches);
                if (batches.length === 0) return null;
                return (
                  <View className="py-2.5 border-b border-slate-100 dark:border-slate-800">
                    <Text className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1.5">
                      Eligible Batches
                    </Text>
                    <View className="flex-row flex-wrap gap-1.5">
                      {batches.map((batch, i) => (
                        <View
                          key={i}
                          className="bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 px-2.5 py-1 rounded-lg"
                        >
                          <Text className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {batch}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                );
              })()}

              {/* Eligible Courses / Programs */}
              {(() => {
                const courses = normalizeStringList(job.eligibility?.eligibleCourses);
                if (courses.length === 0) return null;
                return (
                  <View className="py-2.5 border-b border-slate-100 dark:border-slate-800">
                    <Text className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1.5">
                      Eligible Courses / Programs
                    </Text>
                    <View className="flex-row flex-wrap gap-1.5">
                      {courses.map((course, i) => (
                        <View
                          key={i}
                          className="bg-rose-50 dark:bg-rose-950/60 border border-rose-200/70 dark:border-rose-800/60 px-2.5 py-1 rounded-lg"
                        >
                          <Text className="text-[11px] font-bold text-[#8B0000] dark:text-red-400 uppercase">
                            {course}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                );
              })()}

              {/* Eligible Departments */}
              {(() => {
                const depts = normalizeStringList(job.eligibility?.eligibleDepartments);
                if (depts.length === 0) return null;
                return (
                  <View className="py-2.5 border-b border-slate-100 dark:border-slate-800">
                    <Text className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1.5">
                      Eligible Departments
                    </Text>
                    <View className="flex-row flex-wrap gap-1.5">
                      {depts.map((dept, i) => (
                        <View
                          key={i}
                          className="bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 px-2.5 py-1 rounded-lg"
                        >
                          <Text className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                            {dept}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                );
              })()}

              {/* Required Skills */}
              {(() => {
                const skills = normalizeStringList(job.eligibility?.skills);
                if (skills.length === 0) return null;
                return (
                  <View className="pt-2.5">
                    <Text className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1.5">
                      Required Skills
                    </Text>
                    <View className="flex-row flex-wrap gap-1.5">
                      {skills.map((skill, i) => (
                        <View
                          key={i}
                          className="bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 px-2.5 py-1 rounded-lg"
                        >
                          <Text className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                            {skill}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                );
              })()}

              {/* Notes */}
              {job.eligibility?.notes ? (
                <View className="pt-2.5 border-t border-slate-100 dark:border-slate-800 mt-2">
                  <Text className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                    Note: {job.eligibility.notes}
                  </Text>
                </View>
              ) : null}
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
                  {hasReminder
                    ? "Deadline Reminder Active"
                    : "Set Deadline Reminder"}
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
                  name={
                    isApplied
                      ? "checkmark-circle"
                      : targetApplicationUrl
                      ? "open-outline"
                      : "send"
                  }
                  size={16}
                  color="#FFFFFF"
                />
                <Text className="text-sm font-bold text-white ml-2">
                  {isApplied
                    ? "Applied (Submitted)"
                    : targetApplicationUrl
                    ? "Apply on Official Site ↗"
                    : "Apply for Drive"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default PlacementJobDetailModal;
