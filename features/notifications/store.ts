/**
 * SCIS Connect Mobile - Notifications Zustand Store
 */

import { create } from "zustand";
import { NotificationItem, normalizeNotification, InAppNotificationBannerData } from "./types";
import { notificationsApi } from "./api";
import { storageService, NotificationPreferences } from "@/services/storage";
import {
  checkNotificationPermissions,
  requestNotificationPermissionsWithPrompt,
} from "@/services/notifications/notificationPermissions";
import { notificationWatcher } from "@/services/notifications/notificationWatcher";
import { logger } from "@/utils/logger";

interface NotificationsState {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  activeBanner: InAppNotificationBannerData | null;

  // Preferences & System Status
  masterNotificationsEnabled: boolean;
  jobAlertsEnabled: boolean;
  announcementsEnabled: boolean;
  deadlineRemindersEnabled: boolean;
  resultsPublishedEnabled: boolean;
  systemPermissionStatus: "granted" | "denied" | "undetermined";
  isPreferencesLoaded: boolean;

  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  showInAppBanner: (banner: InAppNotificationBannerData) => void;
  dismissInAppBanner: () => void;

  // Preferences Actions
  loadPreferences: () => Promise<void>;
  setPreference: <K extends keyof NotificationPreferences>(key: K, value: boolean) => Promise<void>;
  toggleJobAlerts: (enabled: boolean) => Promise<void>;
  checkSystemPermissions: () => Promise<string>;
  requestSystemPermissions: () => Promise<boolean>;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  activeBanner: null,

  // Default Preferences
  masterNotificationsEnabled: true,
  jobAlertsEnabled: true,
  announcementsEnabled: true,
  deadlineRemindersEnabled: true,
  resultsPublishedEnabled: true,
  systemPermissionStatus: "undetermined",
  isPreferencesLoaded: false,

  showInAppBanner: (banner: InAppNotificationBannerData) => {
    set({ activeBanner: banner });
    logger.info("NOTIFICATIONS_STORE", "Displaying in-app notification banner", { id: banner.id, title: banner.title });
  },

  dismissInAppBanner: () => {
    set({ activeBanner: null });
  },

  loadPreferences: async () => {
    try {
      const stored = await storageService.getNotificationPreferences();
      const status = await checkNotificationPermissions();

      set({
        masterNotificationsEnabled: stored?.masterNotificationsEnabled ?? true,
        jobAlertsEnabled: stored?.jobAlertsEnabled ?? true,
        announcementsEnabled: stored?.announcementsEnabled ?? true,
        deadlineRemindersEnabled: stored?.deadlineRemindersEnabled ?? true,
        resultsPublishedEnabled: stored?.resultsPublishedEnabled ?? true,
        systemPermissionStatus: (status as "granted" | "denied" | "undetermined") || "undetermined",
        isPreferencesLoaded: true,
      });

      logger.info("NOTIFICATIONS_STORE", "Loaded persisted notification preferences", {
        jobAlerts: stored?.jobAlertsEnabled ?? true,
        systemStatus: status,
      });
    } catch (err) {
      logger.debug("NOTIFICATIONS_STORE", "Failed to load notification preferences", err);
      set({ isPreferencesLoaded: true });
    }
  },

  setPreference: async <K extends keyof NotificationPreferences>(key: K, value: boolean) => {
    // If enabling any notification, ensure system permissions are verified
    if (value === true) {
      const status = await checkNotificationPermissions();
      if (status !== "granted") {
        const granted = await requestNotificationPermissionsWithPrompt();
        if (!granted) {
          set({
            systemPermissionStatus: "denied",
            [key]: false,
          });
          return;
        }
        set({ systemPermissionStatus: "granted" });
      }
    }

    set({ [key]: value });

    const current = get();
    const updated: NotificationPreferences = {
      masterNotificationsEnabled: current.masterNotificationsEnabled,
      jobAlertsEnabled: current.jobAlertsEnabled,
      announcementsEnabled: current.announcementsEnabled,
      deadlineRemindersEnabled: current.deadlineRemindersEnabled,
      resultsPublishedEnabled: current.resultsPublishedEnabled,
      [key]: value,
    };

    await storageService.saveNotificationPreferences(updated);
    logger.info("NOTIFICATIONS_STORE", `Updated notification preference [${key}] = ${value}`);
  },

  toggleJobAlerts: async (enabled: boolean) => {
    await get().setPreference("jobAlertsEnabled", enabled);
  },

  checkSystemPermissions: async () => {
    const status = await checkNotificationPermissions();
    const normalized = (status as "granted" | "denied" | "undetermined") || "undetermined";
    set({ systemPermissionStatus: normalized });
    return normalized;
  },

  requestSystemPermissions: async () => {
    const granted = await requestNotificationPermissionsWithPrompt();
    const status = granted ? "granted" : "denied";
    set({ systemPermissionStatus: status });
    return granted;
  },

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const res = await notificationsApi.getNotifications();
      let rawList: unknown[] = [];

      if (res.data) {
        if (Array.isArray(res.data)) {
          rawList = res.data;
        } else if (typeof res.data === "object" && res.data !== null) {
          const d = res.data as Record<string, unknown>;
          if (Array.isArray(d.notifications)) {
            rawList = d.notifications;
          } else if (Array.isArray(d.data)) {
            rawList = d.data;
          } else if (d.data && typeof d.data === "object" && Array.isArray((d.data as Record<string, unknown>).notifications)) {
            rawList = (d.data as Record<string, unknown>).notifications as unknown[];
          }
        }
      }

      const list: NotificationItem[] = rawList.map((item, idx) =>
        normalizeNotification(item, idx)
      );

      // Preserve recent locally triggered notifications (e.g. created in this session)
      // that might not have appeared in server response yet
      const currentList = get().notifications;
      const recentLocalItems = currentList.filter((n) => {
        if (!n._id.startsWith("local-")) return false;
        const existsInServer = list.some(
          (s) =>
            s._id === n._id ||
            (s.type === n.type && s.title === n.title && s.message === n.message)
        );
        return !existsInServer;
      });

      const mergedList = [...recentLocalItems, ...list];
      const unread = mergedList.filter((n) => !n.read && !n.isRead).length;

      set({
        notifications: mergedList,
        unreadCount: unread,
        isLoading: false,
      });
      logger.info("NOTIFICATIONS_STORE", `Fetched ${list.length} server notifications (${unread} total unread)`);

      // Check for newly arrived unread notifications and trigger alerts
      if (list.length > 0) {
        notificationWatcher.inspectAndNotifyNewNotifications(list).catch(() => {});
      }
    } catch (err) {
      logger.warn("NOTIFICATIONS_STORE", "Failed to fetch notifications", err);
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const res = await notificationsApi.getUnreadCount();
      if (res.data && typeof res.data === "object") {
        const d = res.data as Record<string, unknown>;
        const count =
          typeof d.unreadCount === "number"
            ? d.unreadCount
            : typeof d.count === "number"
            ? d.count
            : typeof d.unread === "number"
            ? d.unread
            : null;

        if (count !== null) {
          set({ unreadCount: Math.max(0, count) });
          return;
        }
      }
    } catch {
      // Best effort
    }

    // Fallback: Calculate from notification list if separate unread count endpoint fails
    try {
      const res = await notificationsApi.getNotifications();
      let rawList: unknown[] = [];
      if (res.data) {
        if (Array.isArray(res.data)) {
          rawList = res.data;
        } else if (typeof res.data === "object" && res.data !== null) {
          const d = res.data as Record<string, unknown>;
          if (Array.isArray(d.notifications)) {
            rawList = d.notifications;
          } else if (Array.isArray(d.data)) {
            rawList = d.data;
          }
        }
      }
      const list = rawList.map((item, idx) => normalizeNotification(item, idx));
      const unread = list.filter((n) => !n.read && !n.isRead).length;
      set({
        notifications: list.length > 0 ? list : get().notifications,
        unreadCount: unread,
      });
    } catch {
      // Best effort
    }
  },

  markAsRead: async (id: string) => {
    if (!id) return;
    // Optimistic update
    const prev = get().notifications;
    const updated = prev.map((n) =>
      n._id === id || n.id === id ? { ...n, read: true, isRead: true } : n
    );
    const unread = updated.filter((n) => !n.read && !n.isRead).length;

    set({
      notifications: updated,
      unreadCount: unread,
    });

    try {
      await notificationsApi.markAsRead(id);
    } catch (err) {
      logger.warn("NOTIFICATIONS_STORE", `Failed to mark notification ${id} as read`, err);
    }
  },

  markAllAsRead: async () => {
    const prev = get().notifications;
    const unreadIds = prev
      .filter((n) => !n.read && !n.isRead)
      .map((n) => n._id || n.id || "")
      .filter((id) => id.length > 0);

    // Optimistic update
    set({
      notifications: prev.map((n) => ({ ...n, read: true, isRead: true })),
      unreadCount: 0,
    });

    try {
      await notificationsApi.markAllAsRead(unreadIds);
    } catch (err) {
      logger.warn("NOTIFICATIONS_STORE", "Failed to mark all notifications as read", err);
    }
  },
}));


