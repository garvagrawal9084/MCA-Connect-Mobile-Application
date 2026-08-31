# Job Posted Push Notification Handling

## Overview
Detailed verification and flow specification for handling incoming job push notifications triggered by the admin portal.

## Admin Trigger Contract (Reference Only - Admin Portal Route)
* **Route:** `POST /api/placement/jobs/<jobId>/send-notifications`
* **Execution:** Handled exclusively by the admin portal / backend server. The Android client does not trigger or call this route.

## Mobile Client Push Payload Structure
```json
{
  "type": "JOB_POSTED",
  "jobId": "<jobId>",
  "screen": "/(app)/placement/center",
  "companyName": "<company name>",
  "jobTitle": "<job title>"
}
```

## Notification Tap Navigation Workflow
1. **Extraction:**
   * Reads `data.jobId` (supporting top-level and nested payload formats).
2. **Deep-linking & Inspection:**
   * If `jobId` is present:
     1. Fetches the job detail asynchronously via `usePlacementCenterStore.getState().fetchJobDetail(jobId)`.
     2. Sets the active job via `usePlacementCenterStore.getState().setSelectedJob(job)`.
     3. Navigates to the Placement Center route (`/(app)/placement/center`).
     4. `PlacementCenterScreen` automatically opens the `PlacementJobDetailModal` displaying the specific job's CTC, description, deadlines, and application links.
3. **Fallback Navigation:**
   * If `jobId` is missing, navigates using `data.screen`.
4. **Lifecycle Coverage:**
   * **Cold start:** Handled via `Notifications.getLastNotificationResponseAsync()` on root layout mount.
   * **Background / Foreground tap:** Handled via `Notifications.addNotificationResponseReceivedListener`.
   * **In-app Banner tap:** Handled via `InAppNotificationBanner` component with identical logic.
