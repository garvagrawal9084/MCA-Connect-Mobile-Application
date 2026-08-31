import React, { useEffect } from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNotificationsStore } from "@/features/notifications/store";

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const unreadCount = useNotificationsStore((state) => state.unreadCount);
  const fetchUnreadCount = useNotificationsStore((state) => state.fetchUnreadCount);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Compute precise bottom clearance for Android gesture nav bar / iOS Home bar
  const bottomInset = insets.bottom > 0 ? insets.bottom : (Platform.OS === "android" ? 18 : 12);
  const tabHeight = 60 + bottomInset;
  const paddingBottom = bottomInset + 4;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isDark ? "#F87171" : "#B91C1C",
        tabBarInactiveTintColor: isDark ? "#94A3B8" : "#64748B",
        tabBarStyle: {
          height: tabHeight,
          paddingBottom: paddingBottom,
          paddingTop: 8,
          backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: isDark ? "#1E293B" : "#E2E8F0",
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: isDark ? 0.25 : 0.05,
          shadowRadius: 6,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="placement"
        options={{
          title: "Placement",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "briefcase" : "briefcase-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notifications",
          tabBarBadge: unreadCount > 0 ? (unreadCount > 99 ? "99+" : unreadCount) : undefined,
          tabBarBadgeStyle: {
            backgroundColor: "#DC2626",
            fontSize: 10,
            fontWeight: "bold",
          },
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "notifications" : "notifications-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
