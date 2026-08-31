/**
 * SCIS Connect Mobile - Notification Types
 */

export type NotificationType =
  | "NEW_PLACEMENT_NOTICE"
  | "APPLICATION_UPDATE"
  | "JOB_DEADLINE_REMINDER"
  | "SYSTEM"
  | "ACADEMIC"
  | "CHALLENGE"
  | string;

export interface NotificationMetadata {
  jobId?: string;
  jobTitle?: string;
  companyName?: string;
  jobType?: string;
  employmentType?: string;
  location?: string;
  package?: number;
  stipend?: number;
  deadline?: string;
  skills?: string;
  link?: string;
  [key: string]: unknown;
}

export interface NotificationItem {
  _id: string;
  id?: string;
  user?: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  isRead?: boolean;
  metadata?: NotificationMetadata;
  createdAt: string;
  updatedAt?: string;
}

export interface NotificationPreferences {
  newJobs: boolean;
  deadlineReminders: boolean;
  applicationUpdates: boolean;
  challengeUpdates: boolean;
}

export interface InAppNotificationBannerData {
  id: string;
  type: string;
  title: string;
  message: string;
  subTitle?: string;
  companyName?: string;
  package?: string | number;
  location?: string;
  jobId?: string;
  data?: Record<string, unknown>;
}

/**
 * Normalizes any backend notification payload shape into a consistent NotificationItem
 */
export function normalizeNotification(raw: unknown, index: number = 0): NotificationItem {
  if (!raw || typeof raw !== "object") {
    return {
      _id: `notif-${index}`,
      id: `notif-${index}`,
      type: "SYSTEM",
      title: "Notification",
      message: "",
      read: true,
      isRead: true,
      createdAt: new Date().toISOString(),
    };
  }

  const item = raw as Record<string, unknown>;
  const idStr = String(item._id || item.id || `notif-${index}`);
  const isRead = Boolean(
    item.read === true ||
    item.isRead === true ||
    item.status === "read" ||
    item.readAt ||
    item.is_read === true
  );

  return {
    _id: idStr,
    id: idStr,
    user: typeof item.user === "string" ? item.user : (item.user as Record<string, unknown>)?._id ? String((item.user as Record<string, unknown>)._id) : "",
    type: (item.type as NotificationType) || (item.category as NotificationType) || "SYSTEM",
    title: String(item.title || item.subject || "Notification"),
    message: String(item.message || item.body || item.description || item.content || ""),
    read: isRead,
    isRead: isRead,
    metadata: (item.metadata || item.meta || {}) as NotificationMetadata,
    createdAt: String(item.createdAt || item.created_at || item.timestamp || item.date || new Date().toISOString()),
    updatedAt: item.updatedAt ? String(item.updatedAt) : undefined,
  };
}
