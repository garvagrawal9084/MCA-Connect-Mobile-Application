/**
 * SCIS Connect Mobile - Notification Permissions & Channels Setup
 * Handles Android Notification Channels, permission grants, and push token registration.
 */

import { Platform, Linking, Alert } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { NOTIFICATION_CHANNELS } from "./channels";
import { logger } from "@/utils/logger";
import { apiClient } from "@/services/api";

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  Constants.appOwnership === "expo";

// Configure default in-app foreground notification presentation behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Configure Android notification channels for distinct notification priority & styling
 */
export async function setupAndroidNotificationChannels(): Promise<void> {
  if (Platform.OS !== "android") return;

  try {
    for (const channelKey of Object.keys(NOTIFICATION_CHANNELS)) {
      const channel = NOTIFICATION_CHANNELS[channelKey];
      let importance = Notifications.AndroidImportance.DEFAULT;

      switch (channel.importance) {
        case "max":
          importance = Notifications.AndroidImportance.MAX;
          break;
        case "high":
          importance = Notifications.AndroidImportance.HIGH;
          break;
        case "low":
          importance = Notifications.AndroidImportance.LOW;
          break;
        case "min":
          importance = Notifications.AndroidImportance.MIN;
          break;
        default:
          importance = Notifications.AndroidImportance.DEFAULT;
      }

      await Notifications.setNotificationChannelAsync(channel.id, {
        name: channel.name,
        description: channel.description,
        importance,
        vibrationPattern: channel.vibrationPattern || [0, 250, 250, 250],
        lightColor: channel.lightColor || "#8B0000",
        sound: channel.sound ? "default" : undefined,
        enableLights: true,
        enableVibrate: true,
        showBadge: true,
      });
    }
    logger.info("NOTIFICATIONS", "Android notification channels registered successfully");
  } catch (error) {
    logger.error("NOTIFICATIONS", "Failed to setup Android notification channels", error);
  }
}

/**
 * Check current system notification permissions status
 */
export async function checkNotificationPermissions(): Promise<Notifications.PermissionStatus> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  } catch (error) {
    logger.warn("NOTIFICATIONS", "Failed to get permission status", error);
    return Notifications.PermissionStatus.UNDETERMINED;
  }
}

/**
 * Directs the user to the device's system application settings
 */
export async function openAppSettings(): Promise<void> {
  try {
    if (Platform.OS === "ios") {
      await Linking.openURL("app-settings:");
    } else {
      await Linking.openSettings();
    }
  } catch (e) {
    logger.warn("NOTIFICATIONS", "Could not open system app settings", e);
  }
}

/**
 * Request notification permissions from the OS.
 * If permission was previously denied or blocked, prompts with an alert offering to open system settings.
 */
export async function requestNotificationPermissionsWithPrompt(): Promise<boolean> {
  try {
    await setupAndroidNotificationChannels();

    const { status: existingStatus, canAskAgain } = await Notifications.getPermissionsAsync();
    if (existingStatus === "granted") {
      return true;
    }

    if (!canAskAgain && existingStatus === "denied") {
      Alert.alert(
        "Notification Permission Required",
        "System notifications are turned off for SCIS Connect in your device settings. Please enable them to receive new job alerts, campus announcements, and test results.",
        [
          { text: "Not Now", style: "cancel" },
          {
            text: "Open Settings",
            onPress: () => openAppSettings(),
          },
        ]
      );
      return false;
    }

    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });

    if (status === "granted") {
      logger.info("NOTIFICATIONS", "System notification permissions granted by user");
      // Synchronize push token in background
      registerForPushNotificationsAsync().catch((e) =>
        logger.debug("NOTIFICATIONS", "Push token sync after grant skipped", e)
      );
      return true;
    }

    return false;
  } catch (error) {
    logger.error("NOTIFICATIONS", "Error requesting notification permissions", error);
    return false;
  }
}

/**
 * Request notification permissions and fetch Expo Push Token
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  try {
    // 1. Android Channel registration
    await setupAndroidNotificationChannels();

    if (!Device.isDevice) {
      logger.info("NOTIFICATIONS", "Simulator/Emulator detected - local notifications active");
    }

    // 2. Notification Permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      logger.warn("NOTIFICATIONS", "Permission not granted for notifications");
      return null;
    }

    // In Expo Go (SDK 53+), remote push notifications from FCM/APNs are disabled.
    // Local notification bar alerts, Android channels, scheduled reminders, and in-app banners work 100% seamlessly!
    if (isExpoGo) {
      logger.info(
        "NOTIFICATIONS",
        "Running in Expo Go: Local notification bar alerts & triggers are fully active. Remote push tokens are reserved for standalone APK/IPA builds."
      );
      return null;
    }

    // 3. Obtain remote push token and native FCM device token when running in standalone build
    try {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId ??
        "97969023-a829-43e7-8bf0-00ad4847726a";

      const pushTokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      const token = pushTokenData.data;

      let nativeToken: string | undefined;
      try {
        const devTokenPromise = Notifications.getDevicePushTokenAsync();
        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500));
        const devicePushData = await Promise.race([devTokenPromise, timeoutPromise]);
        if (devicePushData && typeof devicePushData === "object" && "data" in devicePushData) {
          nativeToken = (devicePushData as any).data;
        }
      } catch {
        // Fallback for environments without direct native token
      }

      logger.info("NOTIFICATIONS", "Acquired Push Tokens for standalone / production build", {
        expoTokenPreview: token ? token.substring(0, 15) + "..." : "none",
        nativeTokenPreview: nativeToken ? nativeToken.substring(0, 15) + "..." : "none",
        projectId,
      });

      // Register tokens with backend
      if (token || nativeToken) {
        await registerTokenWithBackend(token, nativeToken);
      }

      return token;
    } catch (tokenErr) {
      logger.warn("NOTIFICATIONS", "Remote push token not available in current environment", tokenErr);
      return null;
    }
  } catch (error) {
    logger.error("NOTIFICATIONS", "Error during notification registration", error);
    return null;
  }
}

/**
 * Best-effort token synchronization with the backend across multiple API endpoints
 */
export async function registerTokenWithBackend(token: string, nativeToken?: string): Promise<boolean> {
  if (!token && !nativeToken) return false;

  const endpoints = [
    "/api/notifications/register-device",
    "/api/notifications/push-token",
    "/api/notifications/token",
    "/api/notifications/register",
    "/api/notifications/subscribe",
    "/api/notifications/device-token",
    "/api/auth/me/push-token",
    "/api/students/push-token",
    "/api/users/push-token",
  ];

  const payload = {
    pushToken: token,
    token: token || nativeToken,
    expoPushToken: token,
    deviceToken: nativeToken || token,
    fcmToken: nativeToken || token,
    nativeToken: nativeToken,
    platform: Platform.OS,
    deviceModel: Device.modelName || Device.deviceName || "Android Device",
    appVersion: Constants.expoConfig?.version || "1.0.0",
  };

  let registered = false;

  for (const endpoint of endpoints) {
    try {
      const res = await apiClient.post(endpoint, payload);
      if (res.success || (res.statusCode && res.statusCode < 400)) {
        logger.info("NOTIFICATIONS", `Successfully registered push token at ${endpoint}`);
        registered = true;
      }
    } catch {
      // Continue to next fallback endpoint
    }
  }

  // Also sync into user profile if supported
  try {
    await apiClient.patch("/api/auth/me", { pushToken: token, fcmToken: nativeToken });
  } catch {
    // Best-effort
  }

  logger.debug("NOTIFICATIONS", "Backend push token registration completed", { registered });
  return registered;
}

/**
 * Dispatch an immediate diagnostic test notification to verify channel routing,
 * vibration, sound, and notification bar presentation on the device.
 */
export async function sendTestNotification(): Promise<string | null> {
  try {
    await setupAndroidNotificationChannels();

    const channelId = NOTIFICATION_CHANNELS.GENERAL.id;
    const scheduleTrigger: Notifications.NotificationTriggerInput =
      Platform.OS === "android"
        ? ({ channelId } as Notifications.ChannelAwareTriggerInput)
        : null;

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "🔔 SCIS Connect Notification Test",
        body: "Success! Notification bar alerts, sound, and channels are fully operational on this device.",
        subtitle: "System Diagnostics",
        sound: "default",
        color: "#8B0000",
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: {
          type: "TEST_NOTIFICATION",
          screen: "/(app)/(tabs)/notifications",
          timestamp: new Date().toISOString(),
        },
      },
      trigger: scheduleTrigger,
    });

    logger.info("NOTIFICATIONS", `Dispatched diagnostic test notification: ${notificationId}`);
    return notificationId;
  } catch (error) {
    logger.error("NOTIFICATIONS", "Failed to dispatch test notification", error);
    return null;
  }
}

