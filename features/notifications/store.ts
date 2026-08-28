/**
 * SCIS Connect Mobile - Notifications Zustand Store
 */

import { create } from "zustand";
import { NotificationItem } from "./types";
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
      let list: NotificationItem[] = [];

      if (res.data) {
        if (Array.isArray(res.data)) {
          list = res.data;
        } else if (Array.isArray(res.data.notifications)) {
          list = res.data.notifications;
        }
      }

      const unread = list.filter((n) => !n.read).length;

      set({
        notifications: list,
        unreadCount: unread,
        isLoading: false,
      });
    } catch (err) {
      logger.warn("NOTIFICATIONS_STORE", "Failed to fetch notifications", err);
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const res = await notificationsApi.getUnreadCount();
      if (typeof res.data?.unreadCount === "number") {
        set({ unreadCount: res.data.unreadCount });
      }
    } catch {
      // Best effort
    }
  },

  markAsRead: async (id: string) => {
    // Optimistic update
    const prev = get().notifications;
    set({
      notifications: prev.map((n) => (n._id === id ? { ...n, read: true } : n)),
      unreadCount: Math.max(0, get().unreadCount - 1),
    });

    try {
      await notificationsApi.markAsRead(id);
    } catch (err) {
      logger.warn("NOTIFICATIONS_STORE", `Failed to mark notification ${id} as read`, err);
    }
  },

  markAllAsRead: async () => {
    const prev = get().notifications;
    set({
      notifications: prev.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    });

    try {
      await notificationsApi.markAllAsRead();
    } catch (err) {
      logger.warn("NOTIFICATIONS_STORE", "Failed to mark all notifications as read", err);
    }
  },

  toggleJobAlerts: (enabled: boolean) => {
    set({ jobAlertsEnabled: enabled });
    logger.info("NOTIFICATIONS_STORE", `Job alerts toggled: ${enabled}`);
  },
}));
