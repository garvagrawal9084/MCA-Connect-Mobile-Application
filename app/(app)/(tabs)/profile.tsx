import React from "react";
import { View, Text, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/features/auth/authStore";
import { logger } from "@/utils/logger";

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out of SCIS Connect?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            logger.info("AUTH", "User signed out from profile screen", {
              email: user?.email,
            });
            logout();
            router.replace("/(auth)/login");
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC] dark:bg-slate-950 px-5 pt-4">
      <StatusBar style="auto" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="mb-6">
          <Text className="text-xs font-bold text-red-800 dark:text-red-400 tracking-wider">
            SCIS CONNECT
          </Text>
          <Text className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Student Profile
          </Text>
        </View>

        <Card className="items-center py-8 mb-5 border border-slate-200/80 dark:border-slate-800">
          <View className="w-20 h-20 bg-red-800 dark:bg-red-900 rounded-full items-center justify-center mb-3 shadow-md shadow-red-900/30">
            <Text className="text-2xl font-bold text-white">
              {user?.name ? user.name.charAt(0).toUpperCase() : "S"}
            </Text>
          </View>
          <Text className="text-lg font-bold text-slate-900 dark:text-white">
            {user?.name || "Student"}
          </Text>
          <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {user?.email || "No email available"}
          </Text>
          <View className="mt-2 bg-red-50 dark:bg-red-950/60 px-3 py-1 rounded-full border border-red-200 dark:border-red-800">
            <Text className="text-xs font-semibold text-red-800 dark:text-red-300">
              {user?.role || "Student"}
            </Text>
          </View>
        </Card>

        <Card className="mb-6 border border-slate-200/80 dark:border-slate-800">
          <View className="flex-row justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <Text className="text-xs font-medium text-slate-500 dark:text-slate-400">Account ID</Text>
            <Text className="text-xs font-mono font-semibold text-slate-900 dark:text-white">
              {user?.id || user?._id || "N/A"}
            </Text>
          </View>
          <View className="flex-row justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <Text className="text-xs font-medium text-slate-500 dark:text-slate-400">Email Status</Text>
            <Text className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {user?.isEmailVerified ? "Verified" : "Pending"}
            </Text>
          </View>
          <View className="flex-row justify-between py-2">
            <Text className="text-xs font-medium text-slate-500 dark:text-slate-400">Course</Text>
            <Text className="text-xs font-semibold text-slate-900 dark:text-white">
              {user?.course || "SCIS Department"}
            </Text>
          </View>
        </Card>

        <Button
          title="Sign Out"
          variant="outline"
          onPress={handleLogout}
          leftIcon={<Ionicons name="log-out-outline" size={18} color="#EF4444" />}
          className="border-red-300 dark:border-red-800"
          textClassName="text-red-600 dark:text-red-400"
        />
      </ScrollView>
    </SafeAreaView>
  );
}
