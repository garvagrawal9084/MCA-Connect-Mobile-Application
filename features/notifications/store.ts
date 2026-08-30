/**
 * SCIS Connect Mobile - Notifications Zustand Store
 */

import { create } from "zustand";
import { NotificationItem, normalizeNotification } from "./types";
import { notificationsApi } from "./api";
import { logger } from "@/utils/logger";

interface NotificationsState {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  jobAlertsEnabled: boolean;

  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  toggleJobAlerts: (enabled: boolean) => void;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  jobAlertsEnabled: true,

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

      const unread = list.filter((n) => !n.read && !n.isRead).length;

      set({
        notifications: list,
        unreadCount: unread,
        isLoading: false,
      });
      logger.info("NOTIFICATIONS_STORE", `Fetched ${list.length} notifications (${unread} unread)`);
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

  toggleJobAlerts: (enabled: boolean) => {
    set({ jobAlertsEnabled: enabled });
    logger.info("NOTIFICATIONS_STORE", `Job alerts toggled: ${enabled}`);
  },
}));

