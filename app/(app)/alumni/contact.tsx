import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
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

export default function ContactScreen() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    try {
      setIsSubmitting(true);
      await apiClient.post("/api/contact", {
        subject: subject.trim(),
        message: message.trim(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Your message has been sent. We'll get back to you soon.");
      setSubject("");
      setMessage("");
    } catch (err) {
      logger.error("CONTACT", "Failed to send message", err);
      Alert.alert("Error", "Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
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
          <Text className="text-sm font-bold text-slate-900 dark:text-white">Contact Us</Text>
          <View className="w-10" />
        </View>
      </Animated.View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <Animated.View entering={FadeInDown.delay(60).duration(280).springify().damping(20)}
          className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 mb-5 shadow-xs">
          <View className="flex-row items-center mb-3">
            <View className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 items-center justify-center mr-3">
              <Ionicons name="mail-outline" size={20} color="#059669" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-slate-900 dark:text-white">Get in Touch</Text>
              <Text className="text-[11px] text-slate-400">We'd love to hear from you</Text>
            </View>
          </View>
          <Text className="text-xs text-slate-500 dark:text-slate-400 leading-5">
            Have a question, suggestion, or want to collaborate? Send us a message and our team will get back to you within 24 hours.
          </Text>
        </Animated.View>

        {/* Contact Form */}
        <Animated.View entering={FadeInDown.delay(120).duration(280).springify().damping(20)}
          className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <Text className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Subject</Text>
          <TextInput
            className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white mb-4"
            placeholder="What's this about?"
            placeholderTextColor="#94A3B8"
            value={subject}
            onChangeText={setSubject}
          />

          <Text className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Message</Text>
          <TextInput
            className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white mb-4"
            placeholder="Tell us more..."
            placeholderTextColor="#94A3B8"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            style={{ minHeight: 120 }}
          />

          <TouchableOpacity
            onPress={handleSubmit}
            activeOpacity={0.85}
            disabled={isSubmitting}
            className={`py-3.5 rounded-2xl items-center shadow-md flex-row justify-center ${isSubmitting ? "bg-slate-400" : "bg-red-800"}`}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="send-outline" size={16} color="white" />
                <Text className="text-white font-bold text-sm ml-2">Send Message</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
