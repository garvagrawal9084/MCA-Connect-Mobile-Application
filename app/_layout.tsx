import "../global.css";
import React, { useEffect, useRef } from "react";
import { View, LogBox, AppState, AppStateStatus } from "react-native";
import { Stack, useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { notificationEngine, registerBackgroundNotificationTaskAsync } from "@/services/notifications";
import { registerForPushNotificationsAsync } from "@/services/notifications/notificationPermissions";
import { notificationWatcher } from "@/services/notifications/notificationWatcher";
import { jobWatcher } from "@/features/placement/jobWatcher";
import { usePlacementCenterStore } from "@/features/placement/store";
import { useNotificationsStore } from "@/features/notifications/store";
import { InAppNotificationBanner } from "@/components/notifications/InAppNotificationBanner";
import { logger } from "@/utils/logger";

// Suppress Expo Go remote push notification warning during local development in Expo Go
LogBox.ignoreLogs([
  "expo-notifications: Android Push notifications",
  "Android Push notifications (remote notifications) functionality provided by expo-notifications was removed from Expo Go",
  "`expo-notifications` functionality is not fully supported in Expo Go",
  "Use a development build instead of Expo Go",
  "We recommend you instead use a development build",
]);

export default function RootLayout() {
  const router = useRouter();
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    // 1. Initialize notification engine, channels & permissions
    notificationEngine.init().then(() => {
      // Register headless background notification task with Android OS
      registerBackgroundNotificationTaskAsync().catch((err) => {
        logger.debug("LAYOUT", "Background task registration skipped", err);
      });

      // Synchronize latest published jobs & server notifications on startup (alerts if new ones arrived while closed)
      jobWatcher.syncAndCheckJobs().catch((err) => {
        logger.debug("LAYOUT", "Initial job sync skipped", err);
      });
      notificationWatcher.syncAndCheckNotifications().catch((err) => {
        logger.debug("LAYOUT", "Initial notification sync skipped", err);
      });
    });

    // 2. AppState change listener: sync jobs, notifications & push tokens when app comes to foreground
    const appStateSubscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        logger.info("LAYOUT", "App returned to foreground: synchronizing jobs and notifications");
        jobWatcher.syncAndCheckJobs({ silent: false }).catch((e) =>
          logger.debug("LAYOUT", "Foreground job sync deferred", e)
        );
        notificationWatcher.syncAndCheckNotifications({ silent: false }).catch((e) =>
          logger.debug("LAYOUT", "Foreground notification sync deferred", e)
        );
        useNotificationsStore.getState().fetchNotifications().catch(() => {});
        useNotificationsStore.getState().fetchUnreadCount().catch(() => {});
        registerForPushNotificationsAsync().catch((e) =>
          logger.debug("LAYOUT", "Foreground push token sync deferred", e)
        );
      }
      appState.current = nextAppState;
    });

    // 3. Periodic real-time job & notification polling interval (every 30 seconds while active)
    const pollInterval = setInterval(() => {
      if (appState.current === "active") {
        jobWatcher.syncAndCheckJobs({ silent: false }).catch((e) =>
          logger.debug("LAYOUT", "Periodic job sync skipped", e)
        );
        notificationWatcher.syncAndCheckNotifications({ silent: false }).catch((e) =>
          logger.debug("LAYOUT", "Periodic notification sync skipped", e)
        );
      }
    }, 15000);

    // Helper function to handle notification tap navigation & job inspection
    const handleNotificationTap = async (data: Record<string, unknown> | undefined) => {
      if (!data) return;
      logger.info("NOTIFICATIONS", "Handling notification tap response with payload", data);

      const nestedData = (typeof data.data === "object" && data.data !== null)
        ? (data.data as Record<string, unknown>)
        : undefined;

      const rawJobId = data.jobId || nestedData?.jobId;
      const jobId = typeof rawJobId === "string" && rawJobId.trim().length > 0 ? rawJobId.trim() : undefined;

      if (jobId) {
        logger.info("NOTIFICATIONS", `Notification tap has jobId: ${jobId}. Fetching details & opening Placement Center`);
        const fetchJobDetail = usePlacementCenterStore.getState().fetchJobDetail;
        const setSelectedJob = usePlacementCenterStore.getState().setSelectedJob;

        try {
          const job = await fetchJobDetail(jobId);
          if (job) {
            setSelectedJob(job);
          }
        } catch (err) {
          logger.warn("NOTIFICATIONS", `Failed to pre-fetch job ${jobId} on notification tap`, err);
        }

        router.push("/(app)/placement/center" as never);
        return;
      }

      // If jobId is unavailable, navigate using data.screen
      const rawScreen = data.screen || nestedData?.screen;
      const targetScreen = typeof rawScreen === "string" && rawScreen.trim().length > 0 ? rawScreen.trim() : undefined;

      if (targetScreen) {
        logger.info("NOTIFICATIONS", `Navigating to screen from notification data: ${targetScreen}`);
        router.push(targetScreen as never);
      }
    };

    // 4. Cold-start check: user launched app by tapping a notification while app was closed
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response) {
          const data = response.notification.request.content.data as Record<string, unknown> | undefined;
          handleNotificationTap(data);
        }
      })
      .catch((err) => {
        logger.debug("LAYOUT", "Cold start notification response check skipped", err);
      });

    // 5. Listener for when a user interacts with / taps a system bar notification while app is running
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        try {
          const data = response.notification.request.content.data as Record<string, unknown> | undefined;
          await handleNotificationTap(data);
        } catch (err) {
          logger.error("NOTIFICATIONS", "Error handling notification tap response", err);
        }
      }
    );

    // 5. Listener for foreground notification arrival
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

      // Synchronize in-app notifications store & unread count in real-time
      useNotificationsStore.getState().fetchNotifications().catch(() => {});
      useNotificationsStore.getState().fetchUnreadCount().catch(() => {});
    });

    return () => {
      appStateSubscription.remove();
      clearInterval(pollInterval);
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

