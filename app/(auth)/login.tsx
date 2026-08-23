import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LoginCredentials, LoginFormErrors } from "@/features/auth/types";
import { logger } from "@/utils/logger";

export default function LoginScreen() {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    identifier: "",
    password: "",
    rememberMe: false,
  });

  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

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
    const identifier = credentials.identifier.trim();
    const password = credentials.password;

    if (!identifier) {
      newErrors.identifier = "Please enter your Student ID or College Email";
    } else if (
      identifier.includes("@") &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)
    ) {
      newErrors.identifier = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Please enter your password";
    } else if (password.length < 4) {
      newErrors.password = "Password must be at least 4 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Login handler
  const handleLogin = async () => {
    setGeneralError(null);

    if (!validateForm()) {
      logger.warn("AUTH", "Form validation failed on login attempt", {
        identifier: credentials.identifier,
      });
      return;
    }

    try {
      setIsLoading(true);
      logger.info("AUTH", "Initiating login request", {
        identifier: credentials.identifier,
        rememberMe: credentials.rememberMe,
      });

      // NOTE: API request integration will be configured when endpoint details are provided.
      // Simulating a brief delay for UI demonstration
      await new Promise((resolve) => setTimeout(resolve, 800));

      logger.info("AUTH", "Ready for backend authentication API integration");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred during login";
      setGeneralError(errorMessage);
      logger.error("AUTH", "Login attempt failed", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot password dialog
  const handleForgotPassword = () => {
    Alert.alert(
      "Forgot Password?",
      "For student password reset requests, please contact your SCIS Department Administrator or College IT Cell with your Student Registration Number.",
      [{ text: "OK", style: "default" }]
    );
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
          <View className="items-center mb-6">
            {/* Emblem / Badge */}
            <View className="w-20 h-20 bg-indigo-600 dark:bg-indigo-500 rounded-3xl items-center justify-center shadow-lg shadow-indigo-600 mb-4">
              <Ionicons name="school" size={40} color="#FFFFFF" />
            </View>

            {/* Portal Badge */}
            <View className="bg-indigo-100 dark:bg-indigo-950/60 px-3 py-1 rounded-full mb-2 border border-indigo-200 dark:border-indigo-800">
              <Text className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 tracking-wider">
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
          </View>

          {/* Form Card */}
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

            {/* Student ID / Email Field */}
            <Input
              label="Student ID or College Email"
              placeholder="Enter your Student ID or Email"
              value={credentials.identifier}
              onChangeText={(text) => handleChange("identifier", text)}
              error={errors.identifier}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              returnKeyType="next"
              leftIcon={
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={errors.identifier ? "#EF4444" : "#64748B"}
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
                onPress={() =>
                  handleChange("rememberMe", !credentials.rememberMe)
                }
                activeOpacity={0.7}
                className="flex-row items-center"
              >
                <View
                  className={`w-5 h-5 rounded-md border items-center justify-center mr-2 ${
                    credentials.rememberMe
                      ? "bg-indigo-600 border-indigo-600"
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
                <Text className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </View>

            {/* Login Submit Button */}
            <Button
              title="Sign In to Portal"
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

          {/* Help & Support Info Box */}
          <View className="bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-4 mb-4">
            <View className="flex-row items-start">
              <Ionicons
                name="information-circle-outline"
                size={20}
                color="#6366F1"
              />
              <View className="flex-1 ml-2.5">
                <Text className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-0.5">
                  Need Help Accessing Your Account?
                </Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400 leading-4">
                  First-time users should use their university registration ID and default password provided by the SCIS department.
                </Text>
              </View>
            </View>
          </View>

          {/* Security & Version Footer */}
          <View className="items-center mt-2">
            <View className="flex-row items-center">
              <Ionicons name="shield-checkmark-outline" size={14} color="#94A3B8" />
              <Text className="text-xs text-slate-400 dark:text-slate-500 ml-1">
                SCIS Connect Secure Platform • v1.0.0
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
