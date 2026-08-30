import React, { useState } from "react";
import {
  View,
  Text,
  Image,
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
import { images } from "@/constants/images";
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
    <SafeAreaView className="flex-1 bg-[#F8FAFC] dark:bg-slate-950">
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
              className="flex-row items-center self-start bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 px-3.5 py-1.5 rounded-full shadow-xs"
            >
              <Ionicons name="arrow-back" size={16} color="#8B0000" />
              <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300 ml-1.5">
                Back to Sign In
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Form Card with Jiggle / Error Shake */}
          <Animated.View
            entering={FadeInDown.delay(80).duration(300).springify().damping(20)}
            style={animatedCardShakeStyle}
          >
            <Card className="mb-4 border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/60 dark:shadow-none p-6">
              {/* Header & Portal Branding Inside Card */}
              <View className="items-center mb-6">
                <TouchableOpacity
                  onPress={triggerBadgeJiggle}
                  activeOpacity={0.85}
                >
                  <Animated.View
                    style={animatedBadgeStyle}
                    className="w-18 h-18 bg-white dark:bg-slate-800 rounded-2xl items-center justify-center shadow-md shadow-slate-200 dark:shadow-none border border-slate-200/80 dark:border-slate-700 p-2 mb-3"
                  >
                    <Image
                      source={images.logo}
                      className="w-14 h-14"
                      resizeMode="contain"
                    />
                  </Animated.View>
                </TouchableOpacity>

                {/* SCIS Connect Brand */}
                <View className="flex-row items-center mb-1">
                  <Text className="text-base font-black text-red-800 dark:text-red-400 tracking-wide">
                    SCIS{" "}
                  </Text>
                  <Text className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                    Connect
                  </Text>
                </View>

                {/* Main Title */}
                <Text className="text-2xl font-black text-slate-900 dark:text-white text-center tracking-tight">
                  Forgot Password
                </Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400 text-center mt-1 px-2 leading-4">
                  Enter your registered college email to receive your password reset OTP
                </Text>
              </View>

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
                placeholder="25MCMC35@uohyd.ac.in"
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
                className="items-center justify-center mt-5 py-1"
              >
                <Text className="text-xs font-bold text-red-800 dark:text-red-400">
                  ← Back to Sign In
                </Text>
              </TouchableOpacity>
            </Card>
          </Animated.View>

          {/* University of Hyderabad Footer Badge */}
          <Animated.View
            entering={FadeInDown.delay(160).duration(300).springify().damping(20)}
            className="items-center mt-2 mb-4"
          >
            <View className="flex-row items-center bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 px-4 py-1.5 rounded-full shadow-xs">
              <Ionicons name="shield-checkmark" size={14} color="#8B0000" />
              <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300 ml-1.5">
                University of Hyderabad
              </Text>
            </View>
          </Animated.View>

          {/* Help & Support Info Box */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(300).springify().damping(20)}
            className="bg-white/90 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 mb-2 shadow-xs"
          >
            <View className="flex-row items-start">
              <Ionicons
                name="information-circle-outline"
                size={20}
                color="#8B0000"
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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
