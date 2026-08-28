import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "@/services/api";
import { logger } from "@/utils/logger";

interface Ticket {
  _id: string;
  subject: string;
  message: string;
  status: string;
  category: string;
  createdAt: string;
}

const CATEGORIES = ["General", "Bug Report", "Feature Request", "Account Issue", "Other"];

export default function SupportScreen() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("General");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTickets = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get("/api/support-tickets/my");
      const data = response.data as Record<string, unknown>;
      const result = data as any;
      setTickets(result?.data?.tickets || result?.tickets || []);
    } catch (err) {
      logger.error("SUPPORT", "Failed to fetch tickets", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTickets();
    setRefreshing(false);
  }, [fetchTickets]);

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    try {
      setIsSubmitting(true);
      await apiClient.post("/api/support-tickets", {
        subject: subject.trim(),
        message: message.trim(),
        category,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Your ticket has been submitted");
      setShowCreate(false);
      setSubject("");
      setMessage("");
      setCategory("General");
      fetchTickets();
    } catch (err) {
      logger.error("SUPPORT", "Failed to create ticket", err);
      Alert.alert("Error", "Failed to submit ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const getStatusBg = (status: string) => {
    switch (status?.toLowerCase()) {
      case "open": return "bg-emerald-100 dark:bg-emerald-900/40";
      case "pending": return "bg-amber-100 dark:bg-amber-900/40";
      case "closed": return "bg-slate-100 dark:bg-slate-800/40";
      default: return "bg-blue-100 dark:bg-blue-900/40";
    }
  };

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case "open": return "text-emerald-700 dark:text-emerald-300";
      case "pending": return "text-amber-700 dark:text-amber-300";
      case "closed": return "text-slate-600 dark:text-slate-400";
      default: return "text-blue-700 dark:text-blue-300";
    }
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
          <Text className="text-sm font-bold text-slate-900 dark:text-white">Support</Text>
          <TouchableOpacity onPress={() => setShowCreate(true)} className="w-10 h-10 rounded-full bg-red-800 items-center justify-center shadow-xs">
            <Ionicons name="add" size={18} color="white" />
          </TouchableOpacity>
        </View>
        <Text className="text-xs text-slate-400 dark:text-slate-500 text-center">{tickets.length} tickets</Text>
      </Animated.View>

      {/* Tickets */}
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#8B0000" />}
      >
        {isLoading ? (
          <View className="items-center py-16">
            <ActivityIndicator size="large" color="#8B0000" />
            <Text className="text-xs text-slate-400 dark:text-slate-500 mt-3">Loading tickets...</Text>
          </View>
        ) : tickets.length === 0 ? (
          <View className="items-center py-16">
            <Ionicons name="help-circle-outline" size={48} color="#94A3B8" />
            <Text className="text-sm text-slate-500 dark:text-slate-400 mt-3 text-center">No support tickets yet</Text>
            <TouchableOpacity onPress={() => setShowCreate(true)} className="mt-4 bg-red-800 px-5 py-2.5 rounded-xl">
              <Text className="text-white text-xs font-bold">Create Ticket</Text>
            </TouchableOpacity>
          </View>
        ) : (
          tickets.map((ticket, index) => (
            <Animated.View key={ticket._id} entering={FadeInDown.delay(index * 60).duration(280).springify().damping(20)}>
              <View className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 mb-3 shadow-xs">
                <View className="flex-row items-start justify-between mb-2">
                  <Text className="text-sm font-bold text-slate-900 dark:text-white flex-1 mr-2" numberOfLines={1}>{ticket.subject}</Text>
                  <View className={`px-2 py-0.5 rounded-full ${getStatusBg(ticket.status)}`}>
                    <Text className={`text-[9px] font-bold uppercase ${getStatusText(ticket.status)}`}>{ticket.status || "Open"}</Text>
                  </View>
                </View>
                <Text className="text-xs text-slate-500 dark:text-slate-400 mb-2" numberOfLines={2}>{ticket.message}</Text>
                <View className="flex-row items-center justify-between">
                  <View className="bg-slate-50 dark:bg-slate-800/50 rounded-full px-2 py-0.5">
                    <Text className="text-[9px] font-bold text-slate-500 dark:text-slate-400">{ticket.category || "General"}</Text>
                  </View>
                  <Text className="text-[10px] text-slate-400 dark:text-slate-500">
                    {new Date(ticket.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </Text>
                </View>
              </View>
            </Animated.View>
          ))
        )}
      </ScrollView>

      {/* Create Ticket Modal */}
      {showCreate && (
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white dark:bg-slate-900 rounded-t-[32px] max-h-[85%] border-t border-slate-200 dark:border-slate-800 shadow-2xl">
            <View className="items-center pt-3 pb-2">
              <View className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
            </View>
            <View className="flex-row items-center justify-between px-5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <TouchableOpacity onPress={() => setShowCreate(false)}>
                <Text className="text-xs font-bold text-slate-500 dark:text-slate-400">Cancel</Text>
              </TouchableOpacity>
              <Text className="text-sm font-bold text-slate-900 dark:text-white">New Ticket</Text>
              <TouchableOpacity onPress={handleSubmit} disabled={isSubmitting}>
                <Text className={`text-xs font-bold ${isSubmitting ? "text-slate-400 dark:text-slate-500" : "text-red-800 dark:text-red-400"}`}>
                  {isSubmitting ? "Sending..." : "Submit"}
                </Text>
              </TouchableOpacity>
            </View>
            <ScrollView className="px-5 pt-4 pb-8" showsVerticalScrollIndicator={false}>
              <Text className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Category</Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {CATEGORIES.map((c) => (
                  <TouchableOpacity key={c} onPress={() => setCategory(c)}
                    className={`px-3 py-1.5 rounded-full ${category === c ? "bg-red-800" : "bg-slate-100 dark:bg-slate-800"}`}>
                    <Text className={`text-xs font-semibold ${category === c ? "text-white" : "text-slate-600 dark:text-slate-300"}`}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Subject</Text>
              <TextInput className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white mb-4" placeholder="Brief description" placeholderTextColor="#94A3B8" value={subject} onChangeText={setSubject} />
              <Text className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Message</Text>
              <TextInput className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white mb-4" placeholder="Describe your issue in detail" placeholderTextColor="#94A3B8" value={message} onChangeText={setMessage} multiline numberOfLines={4} textAlignVertical="top" style={{ minHeight: 100 }} />
              <TouchableOpacity onPress={handleSubmit} activeOpacity={0.85} disabled={isSubmitting}
                className={`py-3.5 rounded-2xl items-center shadow-md ${isSubmitting ? "bg-slate-400 dark:bg-slate-700" : "bg-red-800"}`}>
                <Text className="text-white font-bold text-sm">{isSubmitting ? "Submitting..." : "Submit Ticket"}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
