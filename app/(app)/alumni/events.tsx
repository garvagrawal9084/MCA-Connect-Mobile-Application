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
import { alumniApi } from "@/features/alumni/api";
import { logger } from "@/utils/logger";

interface CalendarEvent {
  _id: string;
  title: string;
  description: string;
  fromDate: string;
  toDate: string | null;
  eventType: string;
  color: string;
  targetAudience: string;
  isAllDay: boolean;
  startTime: string | null;
  endTime: string | null;
  createdBy: { id: string; name: string; email: string } | null;
  createdAt: string;
}

const EVENT_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  reunion: { bg: "bg-red-100 dark:bg-red-900/40", text: "text-red-700 dark:text-red-300" },
  webinar: { bg: "bg-blue-100 dark:bg-blue-900/40", text: "text-blue-700 dark:text-blue-300" },
  workshop: { bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-700 dark:text-emerald-300" },
  meetup: { bg: "bg-purple-100 dark:bg-purple-900/40", text: "text-purple-700 dark:text-purple-300" },
  holiday: { bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-700 dark:text-amber-300" },
  exam: { bg: "bg-rose-100 dark:bg-rose-900/40", text: "text-rose-700 dark:text-rose-300" },
  other: { bg: "bg-slate-100 dark:bg-slate-800/40", text: "text-slate-700 dark:text-slate-300" },
};

function formatEventDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function formatEventTime(timeStr: string | null): string | null {
  if (!timeStr) return null;
  try {
    const [h, m] = timeStr.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
  } catch {
    return timeStr;
  }
}

export default function EventsScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString();

      const response = await alumniApi.getEvents({
        startDate: startOfMonth,
        endDate: endOfMonth,
        limit: 50,
      });
      const data = response.data as Record<string, unknown>;
      const result = data as any;
      setEvents(result?.data?.events || result?.events || []);
    } catch (err) {
      logger.error("EVENTS", "Failed to fetch events", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  }, [fetchEvents]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const getEventColors = (type: string) => {
    const key = type?.toLowerCase() || "other";
    return EVENT_TYPE_COLORS[key] || EVENT_TYPE_COLORS.other;
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
          <Text className="text-sm font-bold text-slate-900 dark:text-white">Upcoming Events</Text>
          <View className="w-10" />
        </View>
        <Text className="text-xs text-slate-400 dark:text-slate-500 text-center">{events.length} events found</Text>
      </Animated.View>

      {/* Events List */}
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#8B0000" />}
      >
        {isLoading ? (
          <View className="items-center py-12">
            <ActivityIndicator size="large" color="#8B0000" />
          </View>
        ) : events.length === 0 ? (
          <View className="items-center py-12">
            <Ionicons name="calendar-outline" size={48} color="#94A3B8" />
            <Text className="text-sm text-slate-500 dark:text-slate-400 mt-3 text-center">No upcoming events</Text>
          </View>
        ) : (
          events.map((event, index) => {
            const colors = getEventColors(event.eventType);
            const timeStr = formatEventTime(event.startTime);
            const endStr = formatEventTime(event.endTime);
            const timeDisplay = timeStr && endStr ? `${timeStr} - ${endStr}` : timeStr || (event.isAllDay ? "All Day" : null);

            return (
              <Animated.View key={event._id} entering={FadeInDown.delay(index * 60).duration(280).springify().damping(20)}>
                <TouchableOpacity activeOpacity={0.7} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 mb-3 shadow-xs">
                  <View className="flex-row items-start justify-between mb-2">
                    <View className={`px-2.5 py-1 rounded-full ${colors.bg}`}>
                      <Text className={`text-[10px] font-bold ${colors.text}`}>
                        {event.eventType?.charAt(0).toUpperCase() + event.eventType?.slice(1) || "Event"}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Ionicons name="time-outline" size={12} color="#94A3B8" />
                      <Text className="text-[10px] text-slate-400 dark:text-slate-500 ml-1">{formatEventDate(event.fromDate)}</Text>
                    </View>
                  </View>
                  <Text className="text-sm font-bold text-slate-900 dark:text-white mb-1">{event.title}</Text>
                  {event.description ? (
                    <Text className="text-[11px] text-slate-500 dark:text-slate-400 leading-4 mb-2" numberOfLines={2}>{event.description}</Text>
                  ) : null}
                  <View className="flex-row items-center mt-1">
                    <Ionicons name="calendar-outline" size={12} color="#94A3B8" />
                    <Text className="text-[11px] text-slate-500 dark:text-slate-400 ml-1">{formatEventDate(event.fromDate)}</Text>
                    {event.toDate && (
                      <Text className="text-[11px] text-slate-400 dark:text-slate-500"> - {formatEventDate(event.toDate)}</Text>
                    )}
                  </View>
                  {timeDisplay && (
                    <View className="flex-row items-center mt-0.5">
                      <Ionicons name="time-outline" size={12} color="#94A3B8" />
                      <Text className="text-[11px] text-slate-500 dark:text-slate-400 ml-1">{timeDisplay}</Text>
                    </View>
                  )}
                  {event.createdBy && (
                    <View className="flex-row items-center mt-0.5">
                      <Ionicons name="person-outline" size={12} color="#94A3B8" />
                      <Text className="text-[11px] text-slate-500 dark:text-slate-400 ml-1">by {event.createdBy.name}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
