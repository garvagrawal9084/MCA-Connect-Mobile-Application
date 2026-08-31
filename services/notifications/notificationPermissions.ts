/**
 * SCIS Connect Mobile - Notification Permissions & Channels Setup
 * Handles Android Notification Channels, permission grants, and push token registration.
 */

import { Platform } from "react-native";
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

    // In Expo Go on Android (SDK 53+), remote push tokens are disabled.
    // Local notification bar alerts and triggers work 100% seamlessly!
    if (isExpoGo && Platform.OS === "android") {
      logger.info(
        "NOTIFICATIONS",
        "Running in Expo Go on Android: Local notification bar alerts & triggers are fully active"
      );
      return null;
    }

    // 3. Obtain remote push token when running in standalone build or iOS
    try {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId ??
        "97969023-a829-43e7-8bf0-00ad4847726a";

      const pushTokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      const token = pushTokenData.data;
      logger.info("NOTIFICATIONS", "Acquired Expo Push Token for standalone / production build", {
        tokenPreview: token ? token.substring(0, 15) + "..." : "none",
        projectId,
      });

      // Register token with backend
      if (token) {
        await registerTokenWithBackend(token);
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
export async function registerTokenWithBackend(token: string): Promise<boolean> {
  if (!token) return false;

  const endpoints = [
    "/api/notifications/register-device",
    "/api/notifications/push-token",
    "/api/notifications/token",
    "/api/auth/me/push-token",
    "/api/students/push-token",
    "/api/users/push-token",
  ];

  const payload = {
    pushToken: token,
    token,
    platform: Platform.OS,
    deviceModel: Device.modelName || Device.deviceName || "Android Device",
    appVersion: Constants.expoConfig?.version || "1.0.0",
  };

  for (const endpoint of endpoints) {
    try {
      const res = await apiClient.post(endpoint, payload);
      if (res.success || (res.statusCode && res.statusCode < 400)) {
        logger.info("NOTIFICATIONS", `Successfully registered push token at ${endpoint}`);
        return true;
      }
    } catch {
      // Continue to next fallback endpoint
    }
  }

  logger.debug("NOTIFICATIONS", "Backend push token registration completed (best-effort)");
  return false;
}
