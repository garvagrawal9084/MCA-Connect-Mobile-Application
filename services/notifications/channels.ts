/**
 * SCIS Connect Mobile - Android Notification Channels Configuration
 * Defines channels to organize notifications in Android notification bar settings.
 */

import { AndroidChannelConfig } from "./types";

export const NOTIFICATION_CHANNELS: Record<string, AndroidChannelConfig> = {
  PLACEMENT_JOBS: {
    id: "placement-jobs",
    name: "Job Opportunities & Drives",
    description: "Instant alerts when new placement or internship drives are published",
    importance: "high",
    sound: true,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#8B0000",
  },
  APPLICATION_UPDATES: {
    id: "application-updates",
    name: "Application Status & Reminders",
    description: "Updates on your submitted job applications and deadline alerts",
    importance: "high",
    sound: true,
    vibrationPattern: [0, 200, 100, 200],
    lightColor: "#8B0000",
  },
  ACADEMIC_RESULTS: {
    id: "academic-results",
    name: "Assessment & Exam Results",
    description: "Notifications when assessment test results or rankings are published",
    importance: "high",
    sound: true,
    vibrationPattern: [0, 300, 150, 300],
    lightColor: "#1E3A8A",
  },
  CAMPUS_ANNOUNCEMENTS: {
    id: "campus-announcements",
    name: "Campus Announcements",
    description: "Important college circulars, schedules, and administrative news",
    importance: "default",
    sound: true,
    vibrationPattern: [0, 200, 200],
    lightColor: "#059669",
  },
  GENERAL: {
    id: "general-notifications",
    name: "General Alerts",
    description: "General app notifications and updates",
    importance: "default",
    sound: true,
  },
};
