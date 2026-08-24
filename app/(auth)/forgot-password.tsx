import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ForgotPasswordFormErrors } from "@/features/auth/types";
import { authApi } from "@/features/auth/api";
import { logger } from "@/utils/logger";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { email: paramEmail } = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState<string>(paramEmail ? String(paramEmail) : "");
  const [errors, setErrors] = useState<ForgotPasswordFormErrors>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Reanimated Shared Values for Jiggly / Shake Effects
  const cardShake = useSharedValue(0);
  const badgeRotate = useSharedValue(0);

  // Trigger horizontal jiggle/shake on validation or submission error
  const triggerErrorShake = () => {
    cardShake.value = withSequence(
      withTiming(-10, { duration: 40 }),
      withTiming(10, { duration: 40 }),
      withTiming(-8, { duration: 40 }),
      withTiming(8, { duration: 40 }),
      withTiming(-4, { duration: 40 }),
      withTiming(4, { duration: 40 }),
      withTiming(0, { duration: 40 })
    );
  };

  // Trigger playful jiggle/wobble on the key badge emblem
  const triggerBadgeJiggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    badgeRotate.value = withSequence(
      withTiming(-14, { duration: 50 }),
      withTiming(14, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-4, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  };

  const animatedCardShakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: cardShake.value }],
  }));

  const animatedBadgeStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${badgeRotate.value}deg` }],
  }));

  // Field change handler
  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: undefined }));
    }
    if (generalError) {
      setGeneralError(null);
    }
  };

  // Client-side validation
  const validateForm = (): boolean => {
    const newErrors: ForgotPasswordFormErrors = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      newErrors.email = "Please enter your college email address";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission handler
  const handleSubmit = async () => {
    Keyboard.dismiss();
    setGeneralError(null);
    setSuccessMessage(null);

    if (!validateForm()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      triggerErrorShake();
      logger.warn("AUTH", "Forgot password validation failed", { email });
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsLoading(true);
      logger.info("AUTH", "Sending forgot password request", { email: email.trim() });

      const response = await authApi.forgotPassword(email);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccessMessage(
        response.message || "OTP has been sent to your college email address."
      );
      logger.info("AUTH", "Password reset OTP sent successfully", {
        message: response.message,
      });
    } catch (err: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      triggerErrorShake();
      const errorMessage =
        err instanceof Error ? err.message : "Failed to send reset email. Please try again.";
      setGeneralError(errorMessage);
      logger.error("AUTH", "Forgot password request failed", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(auth)/login");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <StatusBar style="auto" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          className="px-5 py-6"
        >
          {/* Top Navigation Back Button */}
          <Animated.View
            entering={FadeInDown.duration(240).springify().damping(20)}
            className="mb-4"
          >
            <TouchableOpacity
              onPress={handleBackToLogin}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              className="flex-row items-center self-start bg-slate-200/70 dark:bg-slate-800/80 px-3 py-1.5 rounded-full"
            >
              <Ionicons name="arrow-back" size={16} color="#6D28D9" />
              <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300 ml-1.5">
                Back to Sign In
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Header & Portal Branding */}
          <Animated.View
            entering={FadeInDown.delay(60).duration(280).springify().damping(20)}
            className="items-center mb-6"
          >
            {/* Emblem / Badge with Interactive Jiggle */}
            <TouchableOpacity
              onPress={triggerBadgeJiggle}
              activeOpacity={0.85}
            >
              <Animated.View
                style={animatedBadgeStyle}
                className="w-20 h-20 bg-violet-700 dark:bg-violet-600 rounded-3xl items-center justify-center shadow-lg shadow-violet-700 mb-4"
              >
                <Ionicons name="key-outline" size={38} color="#FFFFFF" />
              </Animated.View>
            </TouchableOpacity>

            {/* Portal Badge */}
            <View className="bg-violet-100 dark:bg-violet-950/60 px-3 py-1 rounded-full mb-2 border border-violet-200 dark:border-violet-800">
              <Text className="text-xs font-semibold text-violet-700 dark:text-violet-300 tracking-wider">
                SCIS CONNECT • PASSWORD RECOVERY
              </Text>
            </View>

            {/* Main Title */}
            <Text className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white text-center">
              Forgot Password
            </Text>
            <Text className="text-sm text-slate-500 dark:text-slate-400 text-center mt-1.5 px-4 leading-5">
              Enter your registered college email address to receive your password reset OTP
            </Text>
          </Animated.View>

          {/* Form Card with Jiggle / Error Shake */}
          <Animated.View
            entering={FadeInDown.delay(120).duration(300).springify().damping(20)}
            style={animatedCardShakeStyle}
          >
            <Card className="mb-6 border border-slate-200/80 dark:border-slate-800">
              {/* General Error Banner */}
              {generalError && (
                <View className="flex-row items-center bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 p-3 rounded-xl mb-4">
                  <Ionicons name="alert-circle" size={20} color="#EF4444" />
                  <Text className="flex-1 text-xs text-red-700 dark:text-red-300 ml-2 font-medium">
                    {generalError}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setGeneralError(null)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Success Banner */}
              {successMessage && (
                <View className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-4 rounded-xl mb-5">
                  <View className="flex-row items-start">
                    <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                    <View className="flex-1 ml-2.5">
                      <Text className="text-xs font-bold text-emerald-800 dark:text-emerald-200 mb-0.5">
                        OTP Sent Successfully
                      </Text>
                      <Text className="text-xs text-emerald-700 dark:text-emerald-300 leading-4">
                        {successMessage}
                      </Text>
                      <Text className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
                        Please check your inbox (and spam folder) for the verification code.
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* College Email Input */}
              <Input
                label="College Email Address"
                placeholder="e.g. student@uohyd.ac.in"
                value={email}
                onChangeText={handleEmailChange}
                error={errors.email}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                leftIcon={
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={errors.email ? "#EF4444" : "#64748B"}
                  />
                }
              />

              {/* Submit Button */}
              <View className="mt-2">
                <Button
                  title={successMessage ? "Resend Reset OTP" : "Send Reset OTP"}
                  onPress={handleSubmit}
                  isLoading={isLoading}
                  size="lg"
                  rightIcon={
                    !isLoading && (
                      <Ionicons name="paper-plane-outline" size={18} color="#FFFFFF" />
                    )
                  }
                />
              </View>

              {/* Return to Sign In Button */}
              <TouchableOpacity
                onPress={handleBackToLogin}
                activeOpacity={0.7}
                className="items-center justify-center mt-4 py-2"
              >
                <Text className="text-xs font-semibold text-violet-700 dark:text-violet-400">
                  Remember your password? Sign In
                </Text>
              </TouchableOpacity>
            </Card>
          </Animated.View>

          {/* Help & Support Info Box */}
          <Animated.View
            entering={FadeInDown.delay(180).duration(300).springify().damping(20)}
            className="bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-4 mb-4"
          >
            <View className="flex-row items-start">
              <Ionicons
                name="information-circle-outline"
                size={20}
                color="#6D28D9"
              />
              <View className="flex-1 ml-2.5">
                <Text className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-0.5">
                  {"Can't Access Your Email?"}
                </Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400 leading-4">
                  If you no longer have access to your registered student email address, please contact the SCIS Department Office or College IT Cell for manual verification.
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Security & Version Footer */}
          <Animated.View
            entering={FadeInDown.delay(240).duration(300).springify().damping(20)}
            className="items-center mt-2"
          >
            <View className="flex-row items-center">
              <Ionicons name="shield-checkmark-outline" size={14} color="#94A3B8" />
              <Text className="text-xs text-slate-400 dark:text-slate-500 ml-1">
                SCIS Connect Secure Platform • v1.0.0
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
