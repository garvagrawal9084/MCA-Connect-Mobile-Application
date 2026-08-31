import "../global.css";
import React, { useEffect, useRef } from "react";
import { View, LogBox, AppState, AppStateStatus } from "react-native";
import { Stack, useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { notificationEngine, recordRemotePushEvent, registerBackgroundNotificationTaskAsync } from "@/services/notifications";
import { registerForPushNotificationsAsync } from "@/services/notifications/notificationPermissions";
import { notificationWatcher } from "@/services/notifications/notificationWatcher";
import { jobWatcher } from "@/features/placement/jobWatcher";
import { usePlacementCenterStore } from "@/features/placement/store";
import { useNotificationsStore } from "@/features/notifications/store";
import { useAuthStore } from "@/features/auth/authStore";
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

      // Protected API synchronization starts only after an authenticated
      // session has been restored. Login itself registers the push token.
      if (useAuthStore.getState().isAuthenticated) {
        jobWatcher.syncAndCheckJobs().catch((err) => {
          logger.debug("LAYOUT", "Initial job sync skipped", err);
        });
        notificationWatcher.syncAndCheckNotifications().catch((err) => {
          logger.debug("LAYOUT", "Initial notification sync skipped", err);
        });
      }
    });

    // 2. AppState change listener: sync jobs, notifications & push tokens when app comes to foreground
    const appStateSubscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        if (!useAuthStore.getState().isAuthenticated) {
          appState.current = nextAppState;
          return;
        }
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
      if (appState.current === "active" && useAuthStore.getState().isAuthenticated) {
        jobWatcher.syncAndCheckJobs({ silent: false }).catch((e) =>
          logger.debug("LAYOUT", "Periodic job sync skipped", e)
        );
        notificationWatcher.syncAndCheckNotifications({ silent: false }).catch((e) =>
          logger.debug("LAYOUT", "Periodic notification sync skipped", e)
        );
      }
    }, 15000);

    // 4. Listener for when a user interacts with / taps a system bar notification
    const handledResponseIds = new Set<string>();
    const handleNotificationResponse = async (response: Notifications.NotificationResponse) => {
      const responseId = response.notification.request.identifier;
      if (handledResponseIds.has(responseId)) return;
      handledResponseIds.add(responseId);

      try {
        const data = response.notification.request.content.data as Record<string, unknown> | undefined;
        logger.info("NOTIFICATIONS", "Notification tapped in system bar", data);

        recordRemotePushEvent(data, "opened").catch(() => {});

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
    };

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    );
    // A tap that launches a fully closed app can occur before the listener is
    // mounted. Consume Expo's persisted response once so it is still counted.
    Notifications.getLastNotificationResponseAsync()
      .then(async (response) => {
        if (!response) return;
        await handleNotificationResponse(response);
        await Notifications.clearLastNotificationResponseAsync();
      })
      .catch((error) => logger.debug("NOTIFICATIONS", "No launch notification response", error));

    // 5. Listener for foreground notification arrival
    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      logger.info("NOTIFICATIONS", "Received foreground notification", {
        title: notification.request.content.title,
      });

      const data = notification.request.content.data as Record<string, unknown> | undefined;
      recordRemotePushEvent(data, "received").catch(() => {});
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

