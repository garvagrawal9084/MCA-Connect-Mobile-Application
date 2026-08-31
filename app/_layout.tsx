import "../global.css";
import React, { useEffect } from "react";
import { View, LogBox } from "react-native";
import { Stack, useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { notificationEngine } from "@/services/notifications";
import { usePlacementCenterStore } from "@/features/placement/store";
import { useNotificationsStore } from "@/features/notifications/store";
import { InAppNotificationBanner } from "@/components/notifications/InAppNotificationBanner";
import { logger } from "@/utils/logger";

// Suppress Expo Go Android remote push notification warning during development
LogBox.ignoreLogs([
  "expo-notifications: Android Push notifications",
  "Android Push notifications (remote notifications) functionality provided by expo-notifications was removed from Expo Go",
]);

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    // 1. Initialize notification engine, channels & permissions
    notificationEngine.init();

    // 2. Listener for when a user interacts with / taps a system bar notification
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        try {
          const data = response.notification.request.content.data as Record<string, unknown> | undefined;
          logger.info("NOTIFICATIONS", "Notification tapped in system bar", data);

          if (!data) return;

          // If notification contains a jobId, open Placement Center with that job
          if (data.jobId && typeof data.jobId === "string") {
            const fetchJobDetail = usePlacementCenterStore.getState().fetchJobDetail;
            const setSelectedJob = usePlacementCenterStore.getState().setSelectedJob;
            
            // Attempt to load and set selected job for the modal
            try {
              const job = await fetchJobDetail(data.jobId);
              if (job) setSelectedJob(job);
            } catch {
              // Best-effort
            }

            router.push("/(app)/placement/center" as never);
            return;
          }

          // Otherwise route to the target screen if specified
          if (data.screen && typeof data.screen === "string") {
            router.push(data.screen as never);
          }
        } catch (err) {
          logger.error("NOTIFICATIONS", "Error handling notification tap response", err);
        }
      }
    );

    // 3. Listener for foreground notification arrival
    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      logger.info("NOTIFICATIONS", "Received foreground notification", {
        title: notification.request.content.title,
      });

      const data = notification.request.content.data as Record<string, unknown> | undefined;
      useNotificationsStore.getState().showInAppBanner({
        id: `fg-${Date.now()}`,
        type: String(data?.type || "SYSTEM"),
        title: notification.request.content.title || "Notification",
        message: notification.request.content.body || "",
        subTitle: notification.request.content.subtitle || undefined,
        companyName: typeof data?.companyName === "string" ? data.companyName : undefined,
        jobId: typeof data?.jobId === "string" ? data.jobId : undefined,
        data,
      });
    });

    return () => {
      responseSubscription.remove();
      receivedSubscription.remove();
    };
  }, [router]);

  return (
    <View className="flex-1">
      <InAppNotificationBanner />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </View>
  );
}

