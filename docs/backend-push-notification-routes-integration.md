# Backend Push Notification Routes & Device Lifecycle Integration

## Overview
This document records the exact backend API routes, contracts, and frontend implementation details for push notifications in **SCIS Connect Mobile**.

---

## 1. Backend Routes & API Specifications

### Base URL
```text
https://mca-connect-backend-production.up.railway.app/api
```
*(Or your active Railway Backend URL)*

---

### Route 1: Register Device Push Token
* **Path:** `POST /api/notifications/register-device`
* **Fallback Alias:** `POST /api/notifications/push-token`
* **Headers:**
  ```http
  Authorization: Bearer <access_token>
  Content-Type: application/json
  ```
* **Request Body:**
  ```json
  {
    "pushToken": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
    "platform": "android",
    "deviceModel": "Samsung SM-A546E"
  }
  ```
* **Success Response (HTTP 200 / 201):**
  ```json
  {
    "success": true,
    "message": "Push token registered successfully",
    "data": {
      "registeredDevices": 1
    }
  }
  ```

---

### Route 2: Unregister Device on Logout
* **Path:** `POST /api/notifications/unregister-device`
* **Headers:**
  ```http
  Authorization: Bearer <access_token>
  Content-Type: application/json
  ```
* **Request Body:**
  ```json
  {
    "pushToken": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
  }
  ```
* **Success Response (HTTP 200):**
  ```json
  {
    "success": true,
    "message": "Device unregistered successfully"
  }
  ```

---

### Route 3: Push Events Telemetry (Received / Opened)
* **Path:** `POST /api/notifications/push-events`
* **Headers:**
  ```http
  Authorization: Bearer <access_token>
  Content-Type: application/json
  ```
* **Request Body:**
  ```json
  {
    "broadcastId": "<broadcast_id_from_push_data>",
    "event": "received",
    "pushToken": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
  }
  ```
  *(Or `"event": "opened"` when user taps/clicks the notification)*
* **Success Response (HTTP 200):**
  ```json
  {
    "success": true,
    "message": "Event recorded"
  }
  ```

---

## 2. Where is this Implemented in the Codebase?

1. **API Endpoints Configuration:**
   - [`constants/config.ts`](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/constants/config.ts): Added `PUSH_EVENTS: "/api/notifications/push-events"` alongside `REGISTER_DEVICE`, `UNREGISTER_DEVICE`, and `PUSH_TOKEN`.

2. **TypeScript Contracts & Types:**
   - [`features/notifications/types.ts`](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/features/notifications/types.ts): Added `RegisterDevicePayload`, `RegisterDeviceResponse`, `UnregisterDevicePayload`, and `PushEventPayload`.

3. **API Service Client:**
   - [`features/notifications/api.ts`](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/features/notifications/api.ts):
     - `registerDevice(payload)`: Sends device push token with automatic fallback to `/api/notifications/push-token`.
     - `unregisterDevice(pushToken)`: Calls `/api/notifications/unregister-device`.
     - `reportPushEvent(payload)`: Calls `/api/notifications/push-events` for `"received"` and `"opened"` push analytics.

4. **Permissions, Token Acquisition & Registration Service:**
   - [`services/notifications/notificationPermissions.ts`](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/services/notifications/notificationPermissions.ts):
     - Acquires Expo Push Token via `Notifications.getExpoPushTokenAsync`.
     - Resolves `Platform.OS` and `Device.modelName || Device.deviceName`.
     - `registerTokenWithBackend(token)`: Passes token, OS platform, and device model to `notificationsApi.registerDevice`.
     - `unregisterPushNotificationsAsync()`: Dispatches unregister call to backend before clearing auth session.
     - Exports `getActiveExpoPushToken()` & `setActiveExpoPushToken()`.

5. **Authentication Lifecycle & Logout:**
   - [`features/auth/authStore.ts`](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/features/auth/authStore.ts):
     - Triggers registration on `login` and session restore bootstrap `initializeAuth`.
     - Calls `unregisterPushNotificationsAsync()` on `logout` before wiping tokens and session storage.

6. **Notification Event Listeners & Tap Handlers:**
   - [`app/_layout.tsx`](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/app/_layout.tsx):
     - `Notifications.addNotificationReceivedListener`: Dispatches `notificationsApi.reportPushEvent({ broadcastId, event: "received", pushToken })`.
     - `handleNotificationTap` & `Notifications.addNotificationResponseReceivedListener`: Dispatches `notificationsApi.reportPushEvent({ broadcastId, event: "opened", pushToken })`.

---

## 3. When Will the App Register a Device?

The device push token is automatically registered with the backend in the following lifecycle moments:

1. **User Login (`useAuthStore.login`)**:
   Immediately after the student enters their credentials and receives a valid `accessToken`, `registerForPushNotificationsAsync()` is executed. It requests system permissions if needed, retrieves the Expo Push Token via EAS `projectId`, and posts it to `POST /api/notifications/register-device` with the user's `Bearer <token>`.

2. **App Startup / Session Bootstrap (`useAuthStore.initializeAuth`)**:
   When the student opens the app with an existing saved session (or silent refresh token), the app verifies the active session and registers the device token with the backend.

3. **App Returned to Foreground (`AppState` change to `active`)**:
   When the student switches back to the app from the background, the app checks and synchronizes the push token with the backend in `app/_layout.tsx`.

4. **User Explicitly Grants Notification Permissions**:
   If the user enabled notifications via the settings modal / OS prompt (`requestNotificationPermissionsWithPrompt`), the token is immediately fetched and registered with the backend.

5. **Token Refresh (`useAuthStore.refreshToken`)**:
   When tokens are refreshed, the push token registration is re-verified.

> **Fix Applied:** Removed the previous `if (isExpoGo) return null;` guard in `notificationPermissions.ts` which previously skipped token fetching and backend registration when running development builds or Expo Go sessions. Now `Notifications.getExpoPushTokenAsync({ projectId })` and `registerTokenWithBackend(token)` run directly in all environments.
