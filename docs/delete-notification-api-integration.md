# Delete Notification API Integration

## Overview
Documenting the inspection and implementation of the student notification deletion API endpoint:
`DELETE /api/notifications/:id`

## Endpoint Details
* **Method:** `DELETE`
* **URL:** `https://mca-connect-backend-production.up.railway.app/api/notifications/<notificationId>`
* **Headers:**
  * `Authorization: Bearer <access_token>`
  * `Content-Type: application/json`
  * `Accept: application/json`

## Status & Architecture Verification
1. **API Client (`features/notifications/api.ts` & `services/api.ts`):**
   * Configured via `API_CONFIG.ENDPOINTS.NOTIFICATIONS.DELETE(id)`
   * Core `apiClient.delete(...)` automatically handles base URL routing, timeout configuration, and Bearer token injection from `storageService.getAccessToken()`.

2. **Zustand State Store (`features/notifications/store.ts`):**
   * Added `deleteNotification(id: string)` to `useNotificationsStore`.
   * Optimistically removes the target notification from the active array and recalculates the unread badge count immediately.
   * Dispatches the network call to the backend.
   * If the deletion request fails, seamlessly rolls back the local state to preserve data integrity and logs warnings to `logs/errors.log`.

3. **API Configuration (`constants/config.ts`):**
   * Added `DELETE: (id: string) => '/api/notifications/${id}'` and `BY_ID: (id: string) => '/api/notifications/${id}'` under `API_CONFIG.ENDPOINTS.NOTIFICATIONS`.

4. **UI Integration (`components/notifications/NotificationCard.tsx` & `app/(app)/(tabs)/notifications.tsx`):**
   * Added a trash/delete action button to each `NotificationCard`.
   * Tapping the delete icon prompts a native confirmation alert and calls `deleteNotification(itemId)`.
   * Immediately removes the card from view and updates the unread badge.
