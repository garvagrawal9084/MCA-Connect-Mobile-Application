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
import { storageService } from "@/services/storage";
import { notificationsApi } from "@/features/notifications/api";

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  Constants.appOwnership === "expo";

let activeExpoPushToken: string | null = null;

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

    // 3. Obtain the Expo push token in a standalone/development build.
    try {
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      if (!projectId) {
        logger.error("NOTIFICATIONS", "EAS project ID is missing; push token cannot be created");
        return null;
      }

      const pushTokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      const token = pushTokenData.data;

      if (!token || (!token.startsWith("ExponentPushToken[") && !token.startsWith("ExpoPushToken["))) {
        logger.warn("NOTIFICATIONS", `Unexpected push token format received: ${token}`);
        return null;
      }

      activeExpoPushToken = token;
      logger.info("NOTIFICATIONS", `Acquired Expo Push Token: ${token}`);

      // Check if user is currently authenticated with a valid Bearer token
      const accessToken = storageService.getAccessToken();
      if (!accessToken) {
        logger.info(
          "NOTIFICATIONS",
          "Acquired Expo push token, but user is not logged in yet. Device registration will execute immediately upon login."
        );
        return token;
      }

      // Register token with backend
      await registerTokenWithBackend(token);
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
 * Register device push token with backend using official /api/notifications/register-device endpoint
 */
export async function registerTokenWithBackend(token: string): Promise<boolean> {
  if (!token) return false;

  const payload = {
    pushToken: token,
    platform: Platform.OS,
    deviceModel: Device.modelName || Device.deviceName || "Unknown mobile device",
  };

  try {
    const res = await notificationsApi.registerDevice(payload);
    if (res.success || (res.statusCode && res.statusCode < 400)) {
      logger.info("NOTIFICATIONS", "Successfully registered push token with backend", {
        registeredDevices: res.data?.registeredDevices,
        platform: payload.platform,
      });
      return true;
    }
    logger.warn("NOTIFICATIONS", "Failed to register push token with backend", res);
    return false;
  } catch (err) {
    logger.error("NOTIFICATIONS", "Error registering push token with backend", err);
    return false;
  }
}

/** Remove this phone from the signed-in account before clearing auth state. */
export async function unregisterPushNotificationsAsync(): Promise<void> {
  if (!activeExpoPushToken) return;
  try {
    await notificationsApi.unregisterDevice(activeExpoPushToken);
    activeExpoPushToken = null;
    logger.info("NOTIFICATIONS", "Push token unregistered from backend");
  } catch (error) {
    logger.warn("NOTIFICATIONS", "Could not unregister push token", error);
  }
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
