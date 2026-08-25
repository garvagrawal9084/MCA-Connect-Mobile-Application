import React from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "@/components/ui/Card";

export default function NotificationsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC] dark:bg-slate-950 px-5 pt-4">
      <StatusBar style="auto" />
      <View className="mb-6">
        <Text className="text-xs font-bold text-red-800 dark:text-red-400 tracking-wider">
          SCIS CONNECT
        </Text>
        <Text className="text-2xl font-extrabold text-slate-900 dark:text-white">
          Notification Center
        </Text>
      </View>

      <Card className="items-center justify-center py-12 border border-slate-200/80 dark:border-slate-800">
        <View className="w-16 h-16 bg-orange-50 dark:bg-orange-950/60 rounded-full items-center justify-center mb-4 border border-orange-200 dark:border-orange-800">
          <Ionicons name="notifications-outline" size={32} color="#EA580C" />
        </View>
        <Text className="text-lg font-bold text-slate-900 dark:text-white text-center">
          College Announcements
        </Text>
        <Text className="text-xs text-slate-500 dark:text-slate-400 text-center mt-2 px-6">
          Department notices, academic alerts, and important broadcasts will be shown here.
        </Text>
      </Card>
    </SafeAreaView>
  );
}
