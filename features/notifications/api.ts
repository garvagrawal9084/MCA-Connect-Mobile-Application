/**
 * SCIS Connect Mobile - Notifications API Client
 */

import { apiClient, ApiResponse } from "@/services/api";
import { logger } from "@/utils/logger";
import { NotificationItem } from "./types";

export const notificationsApi = {
  /**
   * Fetch all notifications for the current student
   * Endpoint: GET /api/notifications
   */
  async getNotifications(params?: { page?: number; limit?: number; unreadOnly?: boolean }): Promise<
    ApiResponse<{ notifications: NotificationItem[]; unreadCount?: number } | NotificationItem[]>
  > {
    const qs = params?.unreadOnly ? "?unreadOnly=true" : "";
    logger.info("NOTIFICATIONS_API", "Fetching notifications list");
    return apiClient.get(`/api/notifications${qs}`);
  },

  /**
   * Fetch unread notification count
   * Endpoint: GET /api/notifications/unread-count
   */
  async getUnreadCount(): Promise<ApiResponse<{ unreadCount: number }>> {
    logger.info("NOTIFICATIONS_API", "Fetching unread count");
    return apiClient.get<{ unreadCount: number }>("/api/notifications/unread-count");
  },

  /**
   * Mark a specific notification as read
   * Endpoint: PATCH /api/notifications/:id/read
   */
  async markAsRead(id: string): Promise<ApiResponse<{ notification: NotificationItem }>> {
    logger.info("NOTIFICATIONS_API", `Marking notification read: ${id}`);
    try {
      return await apiClient.patch<{ notification: NotificationItem }>(`/api/notifications/${id}/read`);
    } catch {
      return apiClient.post<{ notification: NotificationItem }>(`/api/notifications/${id}/read`);
    }
  },

  /**
   * Mark all notifications as read
   * Endpoint: POST /api/notifications/read-all
   */
  async markAllAsRead(): Promise<ApiResponse<unknown>> {
    logger.info("NOTIFICATIONS_API", "Marking all notifications as read");
    return apiClient.post("/api/notifications/read-all");
  },

  /**
   * Delete a notification
   * Endpoint: DELETE /api/notifications/:id
   */
  async deleteNotification(id: string): Promise<ApiResponse<unknown>> {
    logger.info("NOTIFICATIONS_API", `Deleting notification: ${id}`);
    return apiClient.delete(`/api/notifications/${id}`);
  },
};
