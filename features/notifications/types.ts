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
  user: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
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
