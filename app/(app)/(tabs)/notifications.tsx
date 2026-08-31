/**
 * SCIS Connect Mobile - Notification Center Screen
 * Real-time notifications with special support for placement drives & announcements.
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useNotificationsStore } from "@/features/notifications/store";
import { NotificationCard } from "@/components/notifications/NotificationCard";
import { NotificationSettingsModal } from "@/components/notifications/NotificationSettingsModal";
import { NotificationItem } from "@/features/notifications/types";
import { usePlacementCenterStore } from "@/features/placement/store";

type NotificationCategoryFilter = "all" | "placement" | "unread";

export default function NotificationsScreen() {
  const router = useRouter();

  const notifications = useNotificationsStore((state) => state.notifications);
  const unreadCount = useNotificationsStore((state) => state.unreadCount);
  const isLoading = useNotificationsStore((state) => state.isLoading);
  const fetchNotifications = useNotificationsStore((state) => state.fetchNotifications);
  const fetchUnreadCount = useNotificationsStore((state) => state.fetchUnreadCount);
  const markAsRead = useNotificationsStore((state) => state.markAsRead);
  const markAllAsRead = useNotificationsStore((state) => state.markAllAsRead);
  const deleteNotification = useNotificationsStore((state) => state.deleteNotification);

  const fetchJobDetail = usePlacementCenterStore((state) => state.fetchJobDetail);
  const setSelectedJob = usePlacementCenterStore((state) => state.setSelectedJob);

  const [refreshing, setRefreshing] = useState(false);
  const [filterCategory, setFilterCategory] = useState<NotificationCategoryFilter>("all");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Automatically refresh notifications and unread badges whenever this tab is focused
  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
      fetchUnreadCount();
    }, [fetchNotifications, fetchUnreadCount])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Promise.all([fetchNotifications(), fetchUnreadCount()]);
    setRefreshing(false);
  }, [fetchNotifications, fetchUnreadCount]);

  const handleNotificationPress = async (item: NotificationItem) => {
    const isRead = Boolean(item.read || item.isRead);
    const itemId = item._id || item.id;
    if (!isRead && itemId) {
      markAsRead(itemId);
    }

    if (item.metadata?.jobId) {
      const jobId = item.metadata.jobId;
      const job = await fetchJobDetail(jobId);
      if (job) {
        setSelectedJob(job);
      }
      router.push("/(app)/placement/center" as never);
    }
  };

  const handleMarkAllRead = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    markAllAsRead();
  };

  const handleDeleteNotification = (item: NotificationItem) => {
    const itemId = item._id || item.id;
    if (!itemId) return;

    Alert.alert(
      "Delete Notification",
      "Are you sure you want to delete this notification?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await deleteNotification(itemId);
          },
        },
      ]
    );
  };

  const filteredList = notifications.filter((item) => {
    const isRead = Boolean(item.read || item.isRead);
    if (filterCategory === "unread") return !isRead;
    if (filterCategory === "placement") {
      return (
        item.type === "NEW_PLACEMENT_NOTICE" ||
        item.type === "JOB_POSTED" ||
        item.type === "APPLICATION_DEADLINE" ||
        item.type === "JOB_DEADLINE_REMINDER" ||
        item.type === "APPLICATION_UPDATE" ||
        item.type === "APPLICATION_STATUS_UPDATE" ||
        item.type?.includes("PLACEMENT") ||
        item.type?.includes("JOB")
      );
    }
    return true;
  });

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAFA] dark:bg-slate-950" edges={["top", "left", "right"]}>
      <StatusBar style="auto" />

      {/* Settings Modal */}
      <NotificationSettingsModal
        visible={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Top Header */}
      <View className="px-5 pt-3 pb-3 flex-row items-center justify-between">
        <View>
          <View className="flex-row items-center mb-0.5">
            <Text className="text-[11px] font-bold text-[#B91C1C] dark:text-red-400 tracking-wider uppercase">
              SCIS Connect
            </Text>
            {unreadCount > 0 && (
              <View className="bg-[#DC2626] px-1.5 py-0.2 rounded-full ml-2">
                <Text className="text-[10px] font-bold text-white">
                  {unreadCount} NEW
                </Text>
              </View>
            )}
          </View>
          <Text className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Notification Center
          </Text>
        </View>

        <View className="flex-row items-center gap-2">
          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={handleMarkAllRead}
              className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl flex-row items-center"
            >
              <Ionicons name="checkmark-done" size={14} color="#64748B" />
              <Text className="text-xs font-semibold text-slate-600 dark:text-slate-300 ml-1">
                Mark Read
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsSettingsOpen(true);
            }}
            className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 items-center justify-center shadow-xs"
            activeOpacity={0.7}
          >
            <Ionicons name="options-outline" size={18} color="#8B0000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Tabs Bar */}
      <View className="flex-row px-5 mb-3 gap-2">
        <TouchableOpacity
          onPress={() => setFilterCategory("all")}
          className={`px-3 py-1.5 rounded-xl border ${
            filterCategory === "all"
              ? "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 shadow-xs"
              : "bg-slate-100 dark:bg-slate-900 border-slate-200/60 dark:border-slate-800"
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              filterCategory === "all"
                ? "text-slate-900 dark:text-white"
                : "text-slate-500"
            }`}
          >
            All ({notifications.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setFilterCategory("placement")}
          className={`px-3 py-1.5 rounded-xl border flex-row items-center ${
            filterCategory === "placement"
              ? "bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 shadow-xs"
              : "bg-slate-100 dark:bg-slate-900 border-slate-200/60 dark:border-slate-800"
          }`}
        >
          <Ionicons
            name="briefcase"
            size={12}
            color={filterCategory === "placement" ? "#B91C1C" : "#64748B"}
          />
          <Text
            className={`text-xs font-bold ml-1.5 ${
              filterCategory === "placement"
                ? "text-[#B91C1C] dark:text-red-400"
                : "text-slate-500"
            }`}
          >
            Placement Drives
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setFilterCategory("unread")}
          className={`px-3 py-1.5 rounded-xl border ${
            filterCategory === "unread"
              ? "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 shadow-xs"
              : "bg-slate-100 dark:bg-slate-900 border-slate-200/60 dark:border-slate-800"
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              filterCategory === "unread"
                ? "text-slate-900 dark:text-white"
                : "text-slate-500"
            }`}
          >
            Unread ({unreadCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#B91C1C"
          />
        }
      >
        {isLoading && notifications.length === 0 ? (
          <View className="py-16 items-center justify-center">
            <ActivityIndicator size="small" color="#B91C1C" />
            <Text className="text-xs text-slate-400 mt-2 font-medium">
              Loading student notifications...
            </Text>
          </View>
        ) : filteredList.length === 0 ? (
          <View className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-8 items-center justify-center my-4">
            <View className="w-14 h-14 bg-rose-50 dark:bg-rose-950/60 rounded-2xl items-center justify-center mb-3 border border-rose-200 dark:border-rose-800/80">
              <Ionicons name="notifications-outline" size={26} color="#B91C1C" />
            </View>
            <Text className="text-sm font-bold text-slate-800 dark:text-slate-200 text-center">
              {filterCategory === "placement"
                ? "No placement notices yet"
                : filterCategory === "unread"
                ? "All caught up!"
                : "No notifications"}
            </Text>
            <Text className="text-xs text-slate-400 text-center mt-1 px-4">
              {"When new recruitment drives, internships, or campus alerts are posted, you'll see them right here."}
            </Text>
          </View>
        ) : (
          filteredList.map((item, index) => (
            <NotificationCard
              key={item._id || `notif-${index}`}
              item={item}
              delay={60 + index * 25}
              onPress={() => handleNotificationPress(item)}
              onDelete={handleDeleteNotification}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
