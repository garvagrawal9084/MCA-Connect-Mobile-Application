import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { apiClient, ApiError } from "@/services/api";
import { API_CONFIG } from "@/constants/config";
import { logger } from "@/utils/logger";

export const CONTACT_CATEGORIES = [
  "General Query",
  "Bug Report",
  "Feature Request",
  "Challenge Issue",
  "Leaderboard Issue",
  "Profile Issue",
  "Account Issue",
  "Placement Related",
  "Other",
] as const;

export type ContactCategory = (typeof CONTACT_CATEGORIES)[number];

export default function ContactScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const scrollViewRef = React.useRef<ScrollView>(null);

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<ContactCategory>("General Query");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  React.useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleSubmit = async () => {
    Keyboard.dismiss();
    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();

    if (!cleanSubject) {
      Alert.alert("Missing Subject", "Please enter a subject for your message.");
      return;
    }

    if (cleanSubject.length > 200) {
      Alert.alert("Subject Too Long", "Subject cannot exceed 200 characters.");
      return;
    }

    if (!cleanMessage) {
      Alert.alert("Missing Message", "Please enter your query or feedback message.");
      return;
    }

    if (cleanMessage.length < 20) {
      Alert.alert(
        "Message Too Short",
        `Your message has ${cleanMessage.length} characters. The message must be at least 20 characters in length.`
      );
      return;
    }

    if (cleanMessage.length > 2000) {
      Alert.alert("Message Too Long", "Message cannot exceed 2000 characters.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await apiClient.post(API_CONFIG.ENDPOINTS.CONTACT.SUBMIT, {
        subject: cleanSubject,
        category,
        message: cleanMessage,
        source: "mobile",
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Message Sent Successfully!",
        res.message || "Your message has been sent. We'll get back to you soon."
      );
      setSubject("");
      setMessage("");
      setCategory("General Query");
    } catch (err: unknown) {
      logger.error("CONTACT", "Failed to send message", err);
      const errorMsg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : "Failed to send message. Please try again.";
      Alert.alert("Error", errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const isMessageTooShort = message.trim().length > 0 && message.trim().length < 20;

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAFA] dark:bg-slate-950">
      <StatusBar style="auto" />

      {/* Header */}
      <Animated.View entering={FadeInDown.duration(260).springify().damping(20)} className="px-5 pt-3 pb-2">
        <View className="flex-row items-center justify-between mb-1">
          <TouchableOpacity
            onPress={handleBack}
            className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 items-center justify-center shadow-xs"
          >
            <Ionicons name="arrow-back" size={18} color="#64748B" />
          </TouchableOpacity>
          <View className="items-center">
            <Text className="text-sm font-bold text-slate-900 dark:text-white">Contact Us</Text>
            <Text className="text-[11px] text-slate-400 dark:text-slate-500">We&apos;d love to hear from you</Text>
          </View>
          {keyboardVisible ? (
            <TouchableOpacity
              onPress={() => Keyboard.dismiss()}
              className="px-2.5 py-1 rounded-full bg-slate-200/80 dark:bg-slate-800 items-center justify-center"
            >
              <Text className="text-xs font-semibold text-slate-600 dark:text-slate-300">Done</Text>
            </TouchableOpacity>
          ) : (
            <View className="w-10" />
          )}
        </View>
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 25}
      >
        <ScrollView
          ref={scrollViewRef}
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: keyboardVisible ? 60 : 16,
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* Contact Form */}
          <Animated.View
            entering={FadeInDown.delay(60).duration(280).springify().damping(20)}
            className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs"
          >
            {/* Category Selector */}
            <Text className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Category
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {CONTACT_CATEGORIES.map((c) => {
                const isSelected = category === c;
                return (
                  <TouchableOpacity
                    key={c}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setCategory(c);
                    }}
                    className={`px-3 py-1.5 rounded-full ${
                      isSelected
                        ? "bg-red-800"
                        : "bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        isSelected ? "text-white" : "text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {c}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Subject */}
            <Text className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Subject
            </Text>
            <TextInput
              className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60 rounded-2xl px-4 py-3 text-sm mb-4"
              placeholder="What is this about?"
              placeholderTextColor="#94A3B8"
              value={subject}
              onChangeText={setSubject}
              maxLength={200}
              returnKeyType="next"
              style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
              onFocus={() => {
                setTimeout(() => {
                  scrollViewRef.current?.scrollTo({ y: 40, animated: true });
                }, 100);
              }}
            />

            {/* Message */}
            <Text className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Message
            </Text>
            <TextInput
              className={`bg-slate-50 dark:bg-slate-800/70 border rounded-2xl px-4 py-3 text-sm ${
                isMessageTooShort
                  ? "border-amber-400/80 dark:border-amber-500/70"
                  : "border-slate-200/70 dark:border-slate-700/60"
              }`}
              placeholder="Describe your query or feedback in detail (min 20 characters)..."
              placeholderTextColor="#94A3B8"
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              maxLength={2000}
              style={{
                minHeight: 120,
                color: isDark ? "#FFFFFF" : "#0F172A",
                textAlignVertical: "top",
              }}
              onFocus={() => {
                setTimeout(() => {
                  scrollViewRef.current?.scrollTo({ y: 120, animated: true });
                }, 100);
              }}
            />

            {/* Message helper & Character Counter */}
            <View className="flex-row items-center justify-between mt-1.5 mb-5 px-0.5">
              <Text
                className={`text-[11px] ${
                  isMessageTooShort
                    ? "text-amber-600 dark:text-amber-400 font-medium"
                    : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {isMessageTooShort
                  ? `Min 20 characters required (${20 - message.trim().length} more needed)`
                  : "Min 20 characters required"}
              </Text>
              <Text
                className={`text-[11px] font-medium ${
                  message.length >= 20
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {message.length}/2000
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              activeOpacity={0.85}
              disabled={isSubmitting}
              className={`py-3.5 rounded-2xl items-center shadow-md flex-row justify-center ${
                isSubmitting ? "bg-slate-400 dark:bg-slate-700" : "bg-red-800"
              }`}
            >
              {isSubmitting ? (
                <View className="flex-row items-center">
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text className="text-white font-bold text-sm ml-2">Sending Message...</Text>
                </View>
              ) : (
                <>
                  <Ionicons name="send-outline" size={16} color="white" />
                  <Text className="text-white font-bold text-sm ml-2">Send Message</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

