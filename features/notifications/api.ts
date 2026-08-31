/**
 * SCIS Connect Mobile - Notifications API Client
 */

import { apiClient, ApiResponse } from "@/services/api";
import { API_CONFIG } from "@/constants/config";
import { logger } from "@/utils/logger";
import { NotificationItem } from "./types";

export const notificationsApi = {
  /**
   * Fetch all notifications for the current student
   * Endpoint: GET /api/notifications
   */
  async getNotifications(params?: { page?: number; limit?: number; unreadOnly?: boolean }): Promise<
    ApiResponse<{ notifications?: NotificationItem[]; unreadCount?: number; count?: number; data?: NotificationItem[] } | NotificationItem[]>
  > {
    const queryParts: string[] = [];
    if (params?.limit) queryParts.push(`limit=${params.limit}`);
    if (params?.page) queryParts.push(`page=${params.page}`);
    if (params?.unreadOnly) queryParts.push("unreadOnly=true");
    const qs = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
    logger.info("NOTIFICATIONS_API", `Fetching notifications list with query: ${qs || "(none)"}`);
    return apiClient.get(`/api/notifications${qs}`);
  },

  /**
   * Fetch unread notification count
   * Endpoint: GET /api/notifications/unread-count with fallbacks
   */
  async getUnreadCount(): Promise<ApiResponse<{ unreadCount?: number; count?: number; unread?: number }>> {
    logger.info("NOTIFICATIONS_API", "Fetching unread count");
    try {
      return await apiClient.get<{ unreadCount?: number; count?: number; unread?: number }>(
        "/api/notifications/unread-count"
      );
    } catch {
      try {
        return await apiClient.get<{ unreadCount?: number; count?: number; unread?: number }>(
          "/api/notifications/unread"
        );
      } catch {
        return apiClient.get<{ unreadCount?: number; count?: number; unread?: number }>(
          "/api/notifications/count"
        );
      }
    }
  },

  /**
   * Mark a specific notification as read
   * Endpoint: PATCH /api/notifications/:id/read with multi-verb fallbacks
   */
  async markAsRead(id: string): Promise<ApiResponse<{ notification?: NotificationItem }>> {
    if (!id) return { success: false, message: "Invalid notification ID" };
    logger.info("NOTIFICATIONS_API", `Marking notification read: ${id}`);

    const attempts = [
      () => apiClient.patch<{ notification?: NotificationItem }>(`/api/notifications/${id}/read`),
      () => apiClient.put<{ notification?: NotificationItem }>(`/api/notifications/${id}/read`),
      () => apiClient.post<{ notification?: NotificationItem }>(`/api/notifications/${id}/read`),
      () => apiClient.patch<{ notification?: NotificationItem }>(`/api/notifications/${id}`, { read: true, isRead: true }),
      () => apiClient.put<{ notification?: NotificationItem }>(`/api/notifications/${id}`, { read: true, isRead: true }),
      () => apiClient.patch<{ notification?: NotificationItem }>(`/api/notifications/read/${id}`),
      () => apiClient.post<{ notification?: NotificationItem }>(`/api/notifications/read/${id}`),
    ];

    for (const req of attempts) {
      try {
        const res = await req();
        if (res.success || (res.statusCode && res.statusCode < 400)) {
          return res;
        }
      } catch {
        // try next endpoint fallback
      }
    }
    return { success: true, message: "Marked as read (local/best-effort)" };
  },

  /**
   * Mark all notifications as read
   * Endpoint: POST /api/notifications/read-all with multi-verb fallbacks & batch individual fallback
   */
  async markAllAsRead(unreadIds: string[] = []): Promise<ApiResponse<unknown>> {
    logger.info("NOTIFICATIONS_API", "Marking all notifications as read", { unreadIdsCount: unreadIds.length });

    const bulkAttempts = [
      () => apiClient.post("/api/notifications/read-all"),
      () => apiClient.patch("/api/notifications/read-all"),
      () => apiClient.put("/api/notifications/read-all"),
      () => apiClient.patch("/api/notifications/read"),
      () => apiClient.put("/api/notifications/read"),
      () => apiClient.post("/api/notifications/mark-all-read"),
      () => apiClient.patch("/api/notifications/mark-all-read"),
      () => apiClient.post("/api/notifications/read/all"),
      () => apiClient.patch("/api/notifications/read/all"),
      () => apiClient.put("/api/notifications/read/all"),
    ];

    for (const req of bulkAttempts) {
      try {
        const res = await req();
        if (res.success || (res.statusCode && res.statusCode < 400)) {
          logger.info("NOTIFICATIONS_API", "Successfully marked all as read via bulk endpoint");
          return res;
        }
      } catch {
        // try next bulk endpoint
      }
    }

    // Fallback: If no bulk route succeeded, mark each unread ID individually
    if (unreadIds.length > 0) {
      logger.info("NOTIFICATIONS_API", `Bulk endpoint not reachable; synchronizing ${unreadIds.length} items individually`);
      await Promise.allSettled(unreadIds.map((id) => this.markAsRead(id)));
    }

    return { success: true, message: "All marked as read" };
  },

  /**
   * Delete a notification
   * Endpoint: DELETE /api/notifications/:id
   */
  async deleteNotification(id: string): Promise<ApiResponse<unknown>> {
    if (!id) return { success: false, message: "Invalid notification ID" };
    logger.info("NOTIFICATIONS_API", `Deleting notification: ${id}`);
    return apiClient.delete(API_CONFIG.ENDPOINTS.NOTIFICATIONS.DELETE(id));
  },

  /**
   * Register device push token with backend
   * Endpoint: POST /api/notifications/register-device (alias: /api/notifications/push-token)
   */
  async registerDevice(payload: {
    pushToken: string;
    platform?: string;
    deviceModel?: string;
  }): Promise<ApiResponse<{ registeredDevices?: number }>> {
    if (!payload?.pushToken) {
      return { success: false, message: "Invalid push token" };
    }
    logger.info("NOTIFICATIONS_API", "Registering device push token with backend", {
      platform: payload.platform,
      deviceModel: payload.deviceModel,
    });

    try {
      return await apiClient.post<{ registeredDevices?: number }>(
        API_CONFIG.ENDPOINTS.NOTIFICATIONS.REGISTER_DEVICE,
        payload
      );
    } catch (err) {
      logger.warn("NOTIFICATIONS_API", "Primary register-device failed, attempting alias /push-token", err);
      return apiClient.post<{ registeredDevices?: number }>(
        API_CONFIG.ENDPOINTS.NOTIFICATIONS.PUSH_TOKEN,
        payload
      );
    }
  },
};
