/**
 * SCIS Connect Mobile - Notification Settings & Preferences Modal
 * Provides granular toggles for alert categories and master notification controls.
 */

import React, { useEffect } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { useNotificationsStore } from "@/features/notifications/store";

interface NotificationSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function NotificationSettingsModal({
  visible,
  onClose,
}: NotificationSettingsModalProps) {
  const masterEnabled = useNotificationsStore((state) => state.masterNotificationsEnabled);
  const jobAlertsEnabled = useNotificationsStore((state) => state.jobAlertsEnabled);
  const announcementsEnabled = useNotificationsStore((state) => state.announcementsEnabled);
  const deadlineRemindersEnabled = useNotificationsStore(
    (state) => state.deadlineRemindersEnabled
  );
  const resultsPublishedEnabled = useNotificationsStore(
    (state) => state.resultsPublishedEnabled
  );
  const setPreference = useNotificationsStore((state) => state.setPreference);
  const checkSystemPermissions = useNotificationsStore(
    (state) => state.checkSystemPermissions
  );

  useEffect(() => {
    if (visible) {
      checkSystemPermissions();
    }
  }, [visible, checkSystemPermissions]);

  const handleToggle = async (
    key:
      | "masterNotificationsEnabled"
      | "jobAlertsEnabled"
      | "announcementsEnabled"
      | "deadlineRemindersEnabled"
      | "resultsPublishedEnabled",
    currentValue: boolean
  ) => {
    Haptics.selectionAsync();
    await setPreference(key, !currentValue);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/60">
        <View className="bg-white dark:bg-slate-900 rounded-t-[32px] max-h-[85%] p-6 pb-9 shadow-2xl border-t border-slate-200/80 dark:border-slate-800">
          {/* Top Drag Indicator */}
          <View className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full self-center mb-4" />

          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-[11px] font-black text-red-800 dark:text-red-400 tracking-wider uppercase">
                SCIS CONNECT
              </Text>
              <Text className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Notification Preferences
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center"
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="space-y-4">
            {/* Master Notification Switch */}
            <View className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex-row items-center justify-between mb-3">
              <View className="flex-1 mr-3">
                <Text className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Allow All Notifications
                </Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Master switch for all push and local college notifications.
                </Text>
              </View>
              <Switch
                value={masterEnabled}
                onValueChange={() =>
                  handleToggle("masterNotificationsEnabled", masterEnabled)
                }
                trackColor={{ false: "#CBD5E1", true: "#8B0000" }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Granular Categories Title */}
            <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">
              Notification Channels
            </Text>

            {/* 1. Job Postings & Drives */}
            <View
              className={`p-3.5 rounded-2xl border flex-row items-center justify-between mb-2.5 ${
                jobAlertsEnabled && masterEnabled
                  ? "bg-rose-50/60 dark:bg-rose-950/30 border-rose-200/80 dark:border-rose-900/60"
                  : "bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800"
              }`}
            >
              <View className="flex-row items-center flex-1 mr-2">
                <View className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-950/80 items-center justify-center mr-3 border border-red-200 dark:border-red-800">
                  <Ionicons name="briefcase" size={15} color="#8B0000" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-slate-900 dark:text-white">
                    Placement & Job Drives
                  </Text>
                  <Text className="text-[11px] text-slate-500 dark:text-slate-400 leading-4">
                    Instant alerts when new recruitment opportunities publish.
                  </Text>
                </View>
              </View>
              <Switch
                disabled={!masterEnabled}
                value={jobAlertsEnabled && masterEnabled}
                onValueChange={() => handleToggle("jobAlertsEnabled", jobAlertsEnabled)}
                trackColor={{ false: "#CBD5E1", true: "#8B0000" }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* 2. Campus Announcements */}
            <View
              className={`p-3.5 rounded-2xl border flex-row items-center justify-between mb-2.5 ${
                announcementsEnabled && masterEnabled
                  ? "bg-rose-50/60 dark:bg-rose-950/30 border-rose-200/80 dark:border-rose-900/60"
                  : "bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800"
              }`}
            >
              <View className="flex-row items-center flex-1 mr-2">
                <View className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/80 items-center justify-center mr-3 border border-amber-200 dark:border-amber-800">
                  <Ionicons name="megaphone" size={15} color="#B45309" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-slate-900 dark:text-white">
                    Campus Announcements
                  </Text>
                  <Text className="text-[11px] text-slate-500 dark:text-slate-400 leading-4">
                    Important department notices, circulars, and schedules.
                  </Text>
                </View>
              </View>
              <Switch
                disabled={!masterEnabled}
                value={announcementsEnabled && masterEnabled}
                onValueChange={() =>
                  handleToggle("announcementsEnabled", announcementsEnabled)
                }
                trackColor={{ false: "#CBD5E1", true: "#8B0000" }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* 3. Deadlines & Reminders */}
            <View
              className={`p-3.5 rounded-2xl border flex-row items-center justify-between mb-2.5 ${
                deadlineRemindersEnabled && masterEnabled
                  ? "bg-rose-50/60 dark:bg-rose-950/30 border-rose-200/80 dark:border-rose-900/60"
                  : "bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800"
              }`}
            >
              <View className="flex-row items-center flex-1 mr-2">
                <View className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/80 items-center justify-center mr-3 border border-blue-200 dark:border-blue-800">
                  <Ionicons name="time" size={15} color="#1D4ED8" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-slate-900 dark:text-white">
                    Application Deadlines
                  </Text>
                  <Text className="text-[11px] text-slate-500 dark:text-slate-400 leading-4">
                    Reminders before job and test registration windows close.
                  </Text>
                </View>
              </View>
              <Switch
                disabled={!masterEnabled}
                value={deadlineRemindersEnabled && masterEnabled}
                onValueChange={() =>
                  handleToggle("deadlineRemindersEnabled", deadlineRemindersEnabled)
                }
                trackColor={{ false: "#CBD5E1", true: "#8B0000" }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* 4. Assessment & Test Results */}
            <View
              className={`p-3.5 rounded-2xl border flex-row items-center justify-between mb-3 ${
                resultsPublishedEnabled && masterEnabled
                  ? "bg-rose-50/60 dark:bg-rose-950/30 border-rose-200/80 dark:border-rose-900/60"
                  : "bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800"
              }`}
            >
              <View className="flex-row items-center flex-1 mr-2">
                <View className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 items-center justify-center mr-3 border border-emerald-200 dark:border-emerald-800">
                  <Ionicons name="analytics" size={15} color="#047857" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-slate-900 dark:text-white">
                    Test & Assessment Results
                  </Text>
                  <Text className="text-[11px] text-slate-500 dark:text-slate-400 leading-4">
                    Scores, accuracy breakdown, and leaderboard publications.
                  </Text>
                </View>
              </View>
              <Switch
                disabled={!masterEnabled}
                value={resultsPublishedEnabled && masterEnabled}
                onValueChange={() =>
                  handleToggle("resultsPublishedEnabled", resultsPublishedEnabled)
                }
                trackColor={{ false: "#CBD5E1", true: "#8B0000" }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Diagnostics & Closed-App Push Verification */}
            <View className="mt-4 p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <View className="flex-row items-center mb-2">
                <Ionicons name="hardware-chip-outline" size={16} color="#8B0000" />
                <Text className="text-xs font-bold text-slate-800 dark:text-slate-200 ml-1.5">
                  Closed-App Notification Diagnostics
                </Text>
              </View>

              <Text className="text-[11px] text-slate-600 dark:text-slate-400 leading-4 mb-3">
                Test whether your device's native notification manager can display alerts when the app is completely closed.
              </Text>

              <TouchableOpacity
                onPress={async () => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  try {
                    await Notifications.scheduleNotificationAsync({
                      content: {
                        title: "🔔 SCIS Connect Alert",
                        body: "Success! Notification triggered while the app was closed.",
                        sound: "default",
                        color: "#8B0000",
                        priority: Notifications.AndroidNotificationPriority.HIGH,
                      },
                      trigger: {
                        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                        seconds: 5,
                      },
                    });

                    Alert.alert(
                      "Test Scheduled (5 Seconds)",
                      "Close/kill the app now (swipe it away from Recent Apps). In 5 seconds, your phone will ring and show the notification in the status bar!",
                      [{ text: "OK" }]
                    );
                  } catch (e) {
                    Alert.alert("Test Failed", String(e));
                  }
                }}
                className="bg-red-800 dark:bg-red-700 py-2.5 px-4 rounded-xl flex-row items-center justify-center shadow-sm"
                activeOpacity={0.8}
              >
                <Ionicons name="timer-outline" size={15} color="#FFFFFF" />
                <Text className="text-xs font-black text-white ml-2">
                  Test Closed-App Alert (5s Delay)
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default NotificationSettingsModal;
