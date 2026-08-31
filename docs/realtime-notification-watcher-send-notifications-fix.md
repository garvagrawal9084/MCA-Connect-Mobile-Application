# Real-Time Server Notification Watcher & Job Broadcast Fix

## 1. Problem Summary
When a new job was published to the SCIS Connect database, the mobile app detected it via `jobWatcher` and dispatched system alerts. However, when an admin or student triggered reminders or broadcasts for an existing job via:
`POST /api/placement/jobs/:id/send-notifications`
the app did not display notifications or floating banners until manually pulling down to refresh.

---

## 2. Root Cause Analysis
1. **Existing Job Baseline**: `jobWatcher` was designed strictly to check for newly created job IDs in `GET /api/placement/jobs`. Because the job was already posted earlier, its ID was already marked as known.
2. **Missing Notification Stream Watcher**: The backend creates an unread notification record under `/api/notifications` upon receiving `POST /api/placement/jobs/:id/send-notifications`. The client previously did not have an active background watcher monitoring `/api/notifications` for incoming broadcast/reminder items.

---

## 3. Implementation Solution

### A. Notification Watcher (`services/notifications/notificationWatcher.ts`)
- Manages persistent `scis_known_notification_ids` in `SecureStore` (and `localStorage` on web).
- Baselines existing server notifications on initial boot.
- Actively detects incoming unread server notifications (sent via `POST /api/placement/jobs/:id/send-notifications`, reminders, or announcements).
- Dispatches:
  - Native system notification bar alerts with sound and vibration on the appropriate Android channel (`deadlines`, `placement_jobs`, or `general`).
  - Animated in-app floating banner via `useNotificationsStore.showInAppBanner(...)`.
  - Immediate update of `fetchNotifications()` and `fetchUnreadCount()`.

### B. App Lifecycle & Periodic Polling (`app/_layout.tsx`)
- Baseline sync on startup.
- Real-time sync on `AppState` return to active foreground.
- 30-second polling interval while active to catch any server-triggered notifications.

### C. Direct Broadcast Trigger Enhancement (`components/placement/PlacementJobDetailModal.tsx`)
- Sends `{ sendEmail: true, sendWeb: true }` in `placementCenterApi.sendJobNotifications(job._id)`.

---

## 4. Verification
- TypeScript compilation: `npx tsc --noEmit` (**0 errors**).
