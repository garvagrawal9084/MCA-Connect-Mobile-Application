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
let inFlightRegistrationPromise: Promise<string | null> | null = null;
let lastRegisteredToken: string | null = null;
let lastRegisteredAccessToken: string | null = null;
let isRegisteringWithBackend = false;

export function getActiveExpoPushToken(): string | null {
  return activeExpoPushToken;
}

export function setActiveExpoPushToken(token: string | null): void {
  activeExpoPushToken = token;
}

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
 * Request notification permissions and fetch Expo Push Token.
 * Accepts an optional access token override to guarantee immediate registration upon login
 * before storageService has finished persisting to SecureStore.
 */
export async function registerForPushNotificationsAsync(
  tokenOverride?: string
): Promise<string | null> {
  // If a registration is already executing, reuse the in-flight Promise
  if (inFlightRegistrationPromise) {
    logger.debug("NOTIFICATIONS", "Push registration already in-flight, returning active promise");
    return inFlightRegistrationPromise;
  }

  inFlightRegistrationPromise = (async () => {
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
        logger.warn(
          "NOTIFICATIONS",
          `Notification permission status is '${finalStatus}'. Remote push token registration deferred until permission is granted.`
        );
        return null;
      }

      // 3. Obtain the Expo push token (development build, standalone APK, or Expo Go with EAS project)
      try {
        const projectId =
          Constants.expoConfig?.extra?.eas?.projectId ??
          Constants.easConfig?.projectId ??
          "97969023-a829-43e7-8bf0-00ad4847726a";

        if (!projectId) {
          logger.error("NOTIFICATIONS", "EAS project ID is missing; push token cannot be created");
          return null;
        }

        logger.info("NOTIFICATIONS", `Requesting Expo Push Token with EAS projectId: ${projectId}`);
        const pushTokenData = await Notifications.getExpoPushTokenAsync({ projectId });
        const token = pushTokenData.data;

        if (!token || (!token.startsWith("ExponentPushToken[") && !token.startsWith("ExpoPushToken["))) {
          logger.warn("NOTIFICATIONS", `Unexpected push token format received: ${token}`);
          return null;
        }

        activeExpoPushToken = token;
        logger.info("NOTIFICATIONS", `Acquired Expo Push Token: ${token}`);

        // Check if user is currently authenticated with a valid Bearer token
        const accessToken = tokenOverride || storageService.getAccessToken();
        if (!accessToken) {
          logger.info(
            "NOTIFICATIONS",
            "Acquired Expo push token, but user is not logged in yet. Device registration will execute immediately upon login."
          );
          return token;
        }

        // Register token with backend (deduplicated)
        await registerTokenWithBackend(token, accessToken);
        return token;
      } catch (tokenErr) {
        logger.error(
          "NOTIFICATIONS",
          "Failed to acquire Expo Push Token. In standalone Android APK builds, Firebase Cloud Messaging (google-services.json) and EAS FCM V1 credentials must be configured.",
          tokenErr
        );
        return null;
      }
    } catch (error) {
      logger.error("NOTIFICATIONS", "Error during notification registration", error);
      return null;
    } finally {
      inFlightRegistrationPromise = null;
    }
  })();

  return inFlightRegistrationPromise;
}

/**
 * Register device push token with backend using official /api/notifications/register-device endpoint
 */
export async function registerTokenWithBackend(
  token: string,
  tokenOverride?: string
): Promise<boolean> {
  if (!token) return false;

  const accessToken = tokenOverride || storageService.getAccessToken();

  // Deduplication: prevent duplicate registrations for the same active session
  if (lastRegisteredToken === token && lastRegisteredAccessToken === accessToken) {
    logger.debug("NOTIFICATIONS", "Device already registered with backend for this session, skipping duplicate call");
    return true;
  }

  if (isRegisteringWithBackend) {
    logger.debug("NOTIFICATIONS", "Backend device registration call already in progress, skipping concurrent duplicate");
    return true;
  }

  isRegisteringWithBackend = true;

  const payload = {
    pushToken: token,
    platform: Platform.OS,
    deviceModel:
      Device.modelName ||
      Device.deviceName ||
      (Platform.OS === "android" ? "Android Device" : Platform.OS === "ios" ? "iPhone" : "Mobile Device"),
  };

  try {
    const res = await notificationsApi.registerDevice(payload, tokenOverride);
    if (res.success || (res.statusCode && res.statusCode < 400)) {
      lastRegisteredToken = token;
      lastRegisteredAccessToken = accessToken;
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
  } finally {
    isRegisteringWithBackend = false;
  }
}

/** Remove this phone from the signed-in account before clearing auth state. */
export async function unregisterPushNotificationsAsync(): Promise<void> {
  lastRegisteredToken = null;
  lastRegisteredAccessToken = null;
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
