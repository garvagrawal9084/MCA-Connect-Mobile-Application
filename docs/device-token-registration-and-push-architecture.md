# Device Token Registration and Push Architecture

## Overview
Alignment of the mobile client's push notification registration workflow with the backend's Expo Push API integration (`expo-server-sdk` + FCM V1).

## Backend Contract Reference
* **Primary Registration Endpoint:** `POST /api/notifications/register-device`
* **Fallback Alias Endpoint:** `POST /api/notifications/push-token`
* **Base URL:** `https://mca-connect-backend-production.up.railway.app`
* **Headers:**
  * `Authorization: Bearer <access_token>`
  * `Content-Type: application/json`
* **Payload Structure:**
```json
{
  "pushToken": "ExponentPushToken[xxxxxxxxxxxxxx]",
  "platform": "android",
  "deviceModel": "Samsung Galaxy A54"
}
```
* **Success Response:**
```json
{
  "success": true,
  "message": "Push token registered successfully",
  "data": {
    "registeredDevices": 1
  }
}
```

## Push Service Implementation
* **Project ID:** `97969023-a829-43e7-8bf0-00ad4847726a`
* **Token Format:** `ExponentPushToken[...]` or `ExpoPushToken[...]`
* **Timing:** Executed immediately upon user authentication (post-login and session bootstrap) so that the required `Bearer <access_token>` is attached.

## Push Payload Handling (`JOB_POSTED`)
```json
{
  "to": "<registered Expo token>",
  "sound": "default",
  "priority": "high",
  "channelId": "placement-jobs",
  "title": "📢 New Job at <Company Name>",
  "body": "<Job Title> — Package/Stipend and deadline information",
  "data": {
    "type": "JOB_POSTED",
    "jobId": "<jobId>",
    "screen": "/(app)/placement/center",
    "companyName": "<company name>",
    "jobTitle": "<job title>"
  }
}
```
When tapped (either cold start or active background), the app:
1. Extracts `data.jobId`.
2. Fetches job details via `usePlacementCenterStore.getState().fetchJobDetail(data.jobId)`.
3. Sets `selectedJob` in store.
4. Navigates to `/(app)/placement/center`, automatically launching the `PlacementJobDetailModal`.
