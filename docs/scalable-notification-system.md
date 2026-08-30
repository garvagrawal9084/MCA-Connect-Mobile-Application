# Scalable Trigger-Based Notification System Architecture

> **Conformity:** Strict adherence to [app/AGENTS.md](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/app/AGENTS.md) guidelines

---

## 1. Overview

The **Scalable Trigger-Based Notification System** provides instant, heads-up notifications in the Android and iOS **System Notification Bar** whenever critical domain events occur (e.g. when a new job posting or placement drive is published). 

In addition to handling immediate job postings, the system is designed around a decoupled, registry-driven event engine (`NotificationTriggerRegistry`). This allows any future feature (Assessment Results, Campus Announcements, Mentorship Alerts, Coding Challenges, etc.) to trigger system notification bar alerts with minimal code changes.

---

## 2. Architecture & Data Flow

```
   ┌────────────────────────────────────────────────────────┐
   │                  Domain Event Triggers                 │
   └────────────────────────────────────────────────────────┘
            │                   │                    │
     [JOB_POSTED]     [RESULT_PUBLISHED]    [CAMPUS_ANNOUNCEMENT]
            │                   │                    │
            ▼                   ▼                    ▼
   ┌────────────────────────────────────────────────────────┐
   │            Notification Trigger Engine                 │
   │   (services/notifications/notificationEngine.ts)       │
   ├────────────────────────────────────────────────────────┤
   │ 1. Matches trigger against TriggerRegistry             │
   │ 2. Validates User Preferences (jobAlertsEnabled, etc.) │
   │ 3. Performs Deduplication (Set & Storage Cache)        │
   │ 4. Formats Title, Body, Sound, Priority & Channel      │
   │ 5. Dispatches to System Notification Bar (OS)          │
   │ 6. Syncs with In-App Zustand Notification Store        │
   └────────────────────────────────────────────────────────┘
               │                                 │
               ▼                                 ▼
   ┌───────────────────────┐         ┌───────────────────────┐
   │ System Bar Alert (OS) │         │ Deep-Link Router      │
   │ (Android/iOS Banners) │         │ (Tapping opens modal) │
   └───────────────────────┘         └───────────────────────┘
```

---

## 3. Core Modules & Files

### A. Notification Engine (`services/notifications/notificationEngine.ts`)
- Dispatches triggers to the native operating system notification bar using `expo-notifications`.
- Enforces deduplication using entity IDs (`triggerType_entityId`) to avoid spamming students for the same event multiple times.
- Checks student notification preferences before presenting alerts.
- Optimistically updates the in-app `useNotificationsStore` and badge counter.

### B. Trigger Registry (`services/notifications/triggerRegistry.ts`)
- Central repository containing trigger metadata, payload transformers, Android channel mappings, and default priority levels.
- Pre-configured triggers:
  - `JOB_POSTED`: Triggered when a new job is published. Formats CTC/stipend, company name, role, and location. Deep-links directly to the Job Detail modal.
  - `APPLICATION_DEADLINE`: Alerts students before job applications close.
  - `APPLICATION_STATUS_UPDATE`: Notifies on shortlisted/interview/selection progress.
  - `RESULT_PUBLISHED`: Notifies when assessment marks or ranks are published.
  - `CAMPUS_ANNOUNCEMENT`: Broadcasts college circulars.
  - `CHALLENGE_INVITE`: Coding challenge notices.
  - `CUSTOM_ALERT`: Ad-hoc notification trigger.

### C. Android Notification Channels (`services/notifications/channels.ts`)
Configures Android notification channels (Android 8.0+ / API 26+):
| Channel ID | Channel Name | Importance | Sound / Vibration |
| :--- | :--- | :--- | :--- |
| `placement-jobs` | Job Opportunities & Drives | HIGH | Yes (`[0, 250, 250, 250]`) |
| `application-updates` | Application Status & Reminders | HIGH | Yes (`[0, 200, 100, 200]`) |
| `academic-results` | Assessment & Exam Results | HIGH | Yes (`[0, 300, 150, 300]`) |
| `campus-announcements`| Campus Announcements | DEFAULT | Yes |
| `general-notifications`| General Alerts | DEFAULT | Yes |

### D. Placement Job Watcher (`features/placement/jobWatcher.ts`)
- Monitors placement job feeds during `fetchJobs()` and `fetchDashboardStats()`.
- On cold launch, silently seeds known job IDs.
- On subsequent refreshes and background fetches, detects any new job postings and automatically dispatches `JOB_POSTED` to the `NotificationEngine`.
- Provides developer simulation helper `simulateNewJobTrigger()`.

### E. Floating In-App Notification Banner (`components/notifications/InAppNotificationBanner.tsx`)
- High-fidelity floating card rendered at the app root level with Reanimated spring drop-down physics.
- Displays company logo, role title, package badge, live indicator dot, and "View Job" / "Dismiss" actions.
- Automatically dismisses after 5.5s or swipe/close, and navigates directly into the target modal on press.

### F. Root Layout Notification Interceptor (`app/_layout.tsx`)
- Initializes notification engine and channels on app launch.
- Registers `addNotificationResponseReceivedListener` to intercept when a student taps a notification in the system notification bar and routes directly to the relevant screen and opens the job modal.
- Registers `addNotificationReceivedListener` to trigger the in-app floating banner when alerts arrive while the student is actively using the app.

---

## 4. How to Add New Notification Triggers in the Future

To add a new trigger for any future feature:

1. **Add Trigger Definition to `services/notifications/triggerRegistry.ts`:**
   ```ts
   NEW_FEATURE_TRIGGER: {
     channelId: NOTIFICATION_CHANNELS.GENERAL.id,
     defaultPriority: "high",
     preferenceKey: "newFeatureAlerts",
     formatter: (payload) => ({
       title: `✨ Feature Update: ${payload.title}`,
       body: payload.description,
       subTitle: "SCIS Connect",
       data: {
         screen: "/(app)/some-feature",
         featureId: payload.id,
       },
     }),
   }
   ```

2. **Trigger Anywhere in the App:**
   ```ts
   import { notificationEngine } from "@/services/notifications";

   await notificationEngine.trigger("NEW_FEATURE_TRIGGER", {
     id: "123",
     title: "Mentorship Session Available",
     description: "An alumnus is ready to review your resume.",
   });
   ```

No modifications are needed in notification permissions, listeners, OS channel setup, or background dispatchers.

---

## 5. Verification & Testing

- **Trigger Simulation:** Students / testers can tap the **"Test Alert"** button in the Notification Center header or call `jobWatcher.simulateNewJobTrigger()` to verify system notification bar banner delivery.
- **TypeScript Check:** `npx tsc --noEmit` passed with 0 errors.
- **Lint Check:** `npm run lint` passed with 0 errors.
