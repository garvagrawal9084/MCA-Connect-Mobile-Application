/**
 * SCIS Connect Mobile - Notification Service Types
 * Defines the core interfaces for the scalable trigger-based notification engine.
 */

export type BuiltInTriggerType =
  | "JOB_POSTED"
  | "APPLICATION_DEADLINE"
  | "APPLICATION_STATUS_UPDATE"
  | "RESULT_PUBLISHED"
  | "CAMPUS_ANNOUNCEMENT"
  | "CHALLENGE_INVITE"
  | "CUSTOM_ALERT";

export type TriggerType = BuiltInTriggerType | (string & {});

export type NotificationPriority = "default" | "high" | "max" | "low" | "min";

export interface AndroidChannelConfig {
  id: string;
  name: string;
  description?: string;
  importance: "default" | "high" | "max" | "low" | "min";
  sound?: boolean | string;
  vibrationPattern?: number[];
  lightColor?: string;
}

export interface NotificationDeepLinkData {
  screen?: string;
  params?: Record<string, unknown>;
  jobId?: string;
  resultId?: string;
  announcementId?: string;
  url?: string;
  type?: TriggerType;
  [key: string]: unknown;
}

export interface TriggerPayloadMap {
  JOB_POSTED: {
    jobId: string;
    jobTitle: string;
    companyName: string;
    package?: number | string;
    stipend?: number | string;
    jobType?: string;
    location?: string;
    deadline?: string;
    link?: string;
  };
  APPLICATION_DEADLINE: {
    jobId: string;
    jobTitle: string;
    companyName: string;
    deadline: string;
    hoursRemaining?: number;
  };
  APPLICATION_STATUS_UPDATE: {
    jobId: string;
    jobTitle: string;
    companyName: string;
    status: string;
    feedback?: string;
  };
  RESULT_PUBLISHED: {
    resultId: string;
    testTitle: string;
    score?: number;
    totalMarks?: number;
    rank?: number;
  };
  CAMPUS_ANNOUNCEMENT: {
    announcementId: string;
    title: string;
    message: string;
    priority?: "normal" | "urgent";
  };
  CHALLENGE_INVITE: {
    challengeId: string;
    title: string;
    deadline?: string;
    points?: number;
  };
  CUSTOM_ALERT: {
    title: string;
    body: string;
    data?: NotificationDeepLinkData;
    channelId?: string;
  };
  [key: string]: Record<string, unknown>;
}

export interface FormattedNotification {
  title: string;
  body: string;
  subTitle?: string;
  channelId: string;
  priority: NotificationPriority;
  sound?: boolean | string;
  data: NotificationDeepLinkData;
}

export interface TriggerDefinition<T = Record<string, unknown>> {
  channelId: string;
  defaultPriority: NotificationPriority;
  preferenceKey?: string;
  formatter: (payload: T) => {
    title: string;
    body: string;
    subTitle?: string;
    data: NotificationDeepLinkData;
  };
}

export interface TriggerOptions {
  /** Override notification priority */
  priority?: NotificationPriority;
  /** Force notification even if duplicate was previously sent */
  force?: boolean;
  /** Delay in seconds before triggering (0 for immediate) */
  delaySeconds?: number;
  /** Unique deduplication key (defaults to trigger + entity ID) */
  dedupKey?: string;
}
