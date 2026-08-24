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
import { useRouter } from "expo-router";
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
import { LoginCredentials, LoginFormErrors, AuthUser } from "@/features/auth/types";
import { useAuthStore } from "@/features/auth/authStore";
import { ApiError } from "@/services/api";
import { logger } from "@/utils/logger";

export default function LoginScreen() {
  const router = useRouter();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [loggedInUser, setLoggedInUser] = useState<AuthUser | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Reanimated Shared Values for Jiggly / Shake Effects
  const cardShake = useSharedValue(0);
  const badgeRotate = useSharedValue(0);

  // Trigger horizontal jiggle/shake on validation or login failure
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

  // Trigger playful jiggle/wobble on the school emblem badge
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

  // Field change handler with error clearance
  const handleChange = (field: keyof LoginCredentials, value: string | boolean) => {
    setCredentials((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field as keyof LoginFormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }

    if (generalError) {
      setGeneralError(null);
    }
  };

  // Client-side validation
  const validateForm = (): boolean => {
    const newErrors: LoginFormErrors = {};
    const email = credentials.email.trim();
    const password = credentials.password;

    if (!email) {
      newErrors.email = "Please enter your college email address";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address (e.g. name@uohyd.ac.in)";
    }

    if (!password) {
      newErrors.password = "Please enter your password";
    } else if (password.length < 4) {
      newErrors.password = "Password must be at least 4 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Login handler connected to live backend API
  const handleLogin = async () => {
    Keyboard.dismiss();
    setGeneralError(null);
    setSuccessMessage(null);

    if (!validateForm()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      triggerErrorShake();
      logger.warn("AUTH", "Form validation failed on login attempt", {
        email: credentials.email,
      });
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsLoading(true);
      logger.info("AUTH", "Initiating backend login request", {
        email: credentials.email.trim().toLowerCase(),
        rememberMe: credentials.rememberMe,
      });

      const data = await useAuthStore.getState().login({
        email: credentials.email,
        password: credentials.password,
        rememberMe: credentials.rememberMe,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const user = data.user;
      setLoggedInUser(user || null);
      setSuccessMessage("Login successful");

      logger.info("AUTH", "Student login succeeded", {
        email: credentials.email,
        userName: user?.name,
        hasAccessToken: !!data.accessToken,
      });

      // Smoothly navigate to main application tabs
      setTimeout(() => {
        router.replace("/(app)/(tabs)");
      }, 400);
    } catch (err: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      triggerErrorShake();

      let errorMessage = "An unexpected error occurred during login";

      if (err instanceof ApiError) {
        if (err.statusCode === 401) {
          errorMessage = "Invalid email or password";
        } else if (err.statusCode === 403) {
          const errorData = err.data as Record<string, unknown> | undefined;
          if (
            err.message?.toLowerCase().includes("email not verified") ||
            errorData?.requiresVerification
          ) {
            errorMessage =
              "Please verify your email before logging in. Check your inbox for the verification email.";
          } else if (err.message?.toLowerCase().includes("deactivated")) {
            errorMessage = "Account is deactivated. Please contact college administration.";
          } else {
            errorMessage = err.message || "Access forbidden (403)";
          }
        } else if (err.message) {
          errorMessage = err.message;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setGeneralError(errorMessage);
      logger.error("AUTH", "Login attempt failed", err, {
        email: credentials.email,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Navigate to Forgot Password screen with smooth transition and email prefill
  const handleForgotPassword = () => {
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    logger.info("AUTH", "Navigating to forgot-password screen with prefilled email", {
      email: credentials.email,
    });
    router.push({
      pathname: "/(auth)/forgot-password",
      params: credentials.email.trim()
        ? { email: credentials.email.trim() }
        : undefined,
    });
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
          {/* Header & College Portal Branding */}
          <Animated.View
            entering={FadeInDown.duration(280).springify().damping(20)}
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
                <Ionicons name="school" size={40} color="#FFFFFF" />
              </Animated.View>
            </TouchableOpacity>

            {/* Portal Badge */}
            <View className="bg-violet-100 dark:bg-violet-950/60 px-3 py-1 rounded-full mb-2 border border-violet-200 dark:border-violet-800">
              <Text className="text-xs font-semibold text-violet-700 dark:text-violet-300 tracking-wider">
                SCIS CONNECT • STUDENT PORTAL
              </Text>
            </View>

            {/* Main Title */}
            <Text className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white text-center">
              Welcome Back
            </Text>
            <Text className="text-sm text-slate-500 dark:text-slate-400 text-center mt-1.5 px-4">
              Sign in to access your dashboard, placement drives, and announcements
            </Text>
          </Animated.View>

          {/* Form Card with Jiggle / Error Shake */}
          <Animated.View
            entering={FadeInDown.delay(80).duration(300).springify().damping(20)}
            style={animatedCardShakeStyle}
          >
            <Card className="mb-6 border border-slate-200/80 dark:border-slate-800">
              {/* Success Banner */}
              {successMessage && (
                <View className="flex-row items-center bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-3.5 rounded-xl mb-4">
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  <View className="flex-1 ml-2.5">
                    <Text className="text-xs text-emerald-800 dark:text-emerald-200 font-semibold">
                      {successMessage}
                    </Text>
                    {loggedInUser?.name && (
                      <Text className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                        Logged in as {loggedInUser.name} ({loggedInUser.email})
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => setSuccessMessage(null)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close" size={16} color="#10B981" />
                  </TouchableOpacity>
                </View>
              )}

              {/* General Error Banner */}
              {generalError && (
                <View className="flex-row items-start bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 p-3 rounded-xl mb-4">
                  <Ionicons name="alert-circle" size={20} color="#EF4444" style={{ marginTop: 1 }} />
                  <Text className="flex-1 text-xs text-red-700 dark:text-red-300 ml-2 font-medium leading-4">
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

              {/* College Email Field */}
              <Input
                label="College Email Address"
                placeholder="Enter your college email (e.g. student@uohyd.ac.in)"
                value={credentials.email}
                onChangeText={(text) => handleChange("email", text)}
                error={errors.email}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="next"
                leftIcon={
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={errors.email ? "#EF4444" : "#64748B"}
                  />
                }
              />

              {/* Password Field */}
              <Input
                label="Password"
                placeholder="Enter your password"
                value={credentials.password}
                onChangeText={(text) => handleChange("password", text)}
                error={errors.password}
                isPassword
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                leftIcon={
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={errors.password ? "#EF4444" : "#64748B"}
                  />
                }
              />

              {/* Options Row: Remember Me & Forgot Password */}
              <View className="flex-row items-center justify-between mt-1 mb-6">
                <TouchableOpacity
                  onPress={() => {
                    Haptics.selectionAsync();
                    handleChange("rememberMe", !credentials.rememberMe);
                  }}
                  activeOpacity={0.7}
                  className="flex-row items-center"
                >
                  <View
                    className={`w-5 h-5 rounded-md border items-center justify-center mr-2 ${
                      credentials.rememberMe
                        ? "bg-violet-700 border-violet-700"
                        : "border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800"
                    }`}
                  >
                    {credentials.rememberMe && (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    )}
                  </View>
                  <Text className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Remember me
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleForgotPassword}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text className="text-xs font-semibold text-violet-700 dark:text-violet-400">
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Login Submit Button */}
              <Button
                title={isLoading ? "Signing In..." : "Sign In to Portal"}
                onPress={handleLogin}
                isLoading={isLoading}
                size="lg"
                rightIcon={
                  !isLoading && (
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                  )
                }
              />
            </Card>
          </Animated.View>

          {/* Help & Support Info Box */}
          <Animated.View
            entering={FadeInDown.delay(160).duration(300).springify().damping(20)}
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
                  Need Help Accessing Your Account?
                </Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400 leading-4">
                  Sign in with your registered college email and password. For credential issues, contact the SCIS department office or use Forgot Password.
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Security & Version Footer */}
          <Animated.View
            entering={FadeInDown.delay(220).duration(300).springify().damping(20)}
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
