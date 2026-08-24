# SCIS Connect Mobile — Token Refresh API Integration (`/api/auth/refresh`)

> **Document Created:** Monday, August 24, 2026 at 9:53 AM IST (`2026-08-24T09:53:00+05:30`)  
> **Module:** Core API Service (`services/api.ts`), Auth Feature API (`features/auth/api.ts`), & Storage Layer (`services/storage.ts`)  
> **Status:** Live & Integrated with Production Backend  
> **Conformity:** Strict adherence to [app/AGENTS.md](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/app/AGENTS.md)  

---

## 📋 Overview

The **Token Refresh Integration** connects the **SCIS Connect Mobile** client to the production backend's `/api/auth/refresh` endpoint. When a student possesses a valid `refreshToken` (persisted via session cookies or storage when Remember Me is active), the client can perform silent session restoration and automatically obtain fresh access tokens without requiring the student to re-enter their credentials.

---

## 🌐 Backend API Contract

| Property | Specification |
| :--- | :--- |
| **Endpoint** | `POST https://mca-connect-backend-production.up.railway.app/api/auth/refresh` |
| **Request Headers** | `Content-Type: application/json`, `Accept: application/json`, `Cookie: refreshToken=<token>` |
| **Request Payload** | `{"refreshToken": "<token>"}` *(optional if passed in Cookie header)* |
| **Success Response (200 OK)** | `{"success": true, "message": "Token refreshed", "data": {"user": {...}, "accessToken": "..."}}` |
| **Refresh Token Not Found (401)** | `{"success": false, "message": "Refresh token not found"}` |
| **Invalid Refresh Token (401)** | `{"success": false, "message": "Invalid refresh token"}` |
| **Email Not Verified (403)** | `{"success": false, "message": "Email not verified", "data": {"requiresVerification": true, "email": "..."}}` |

---

## 🏗️ Architecture & Component Flow

```text
[App Launch / Protected API Request]
              │
              ▼
   Does Refresh Token Exist?
              │
       ┌──────┴──────┐
      YES            NO
       │             │
       ▼             ▼
POST /api/auth/refresh   Redirect to /login
       │
   ┌───┴───────────────────────┐
   ▼                           ▼
[200 OK Success]          [401 / 403 Failure]
   │                           │
   ├── Store accessToken       ├── 401: Clear session & redirect to login
   ├── Store formatted user    └── 403: Email verification required
   └── Continue / Retry API
```

---

## 🔐 Storage Layer Enhancements (`services/storage.ts`)

- **`storageService.getRefreshToken()`**: Returns the active refresh token from memory or stored cookie header.
- **`storageService.setRefreshToken(token)`**: Updates the stored refresh token and synchronizes the `refreshToken` cookie.
- **`storageService.hasRefreshToken()`**: Boolean helper checking for the existence of an active refresh token.
- **`storageService.clearSession()`**: Atomically clears access token, refresh token, cookies, user profile, and Remember Me preference.

---

## 🛡️ Core API Client & Silent Retry (`services/api.ts`)

- **Automatic 401 Interceptor**: When any protected endpoint (such as dashboard, placements, notifications, or profile) returns a `401 Unauthorized`:
  1. Checks if `storageService.hasRefreshToken()` is true and the request was not already a retry attempt.
  2. Issues a silent call to `POST /api/auth/refresh`.
  3. On success, updates the session's `accessToken` and retries the original request seamlessly.
  4. On failure, clears the session and logs the warning.

---

## 📱 Auth API Integration (`features/auth/api.ts`)

- **`authApi.refreshToken(customRefreshToken?)`**:
  - Resolves active token from memory, cookies, or argument.
  - Sends request to `API_CONFIG.ENDPOINTS.AUTH.REFRESH`.
  - Parses response and updates `storageService.setAccessToken` and `storageService.setUser`.
  - Handles 401 (clears session) and 403 (propagates email verification requirement).
  - Emits structured log entries via `utils/logger.ts`.

---

## ✅ Verification & Health Checks

- **TypeScript Compilation:** `npx tsc --noEmit` passed with 0 errors.
- **ESLint Checks:** `npm run lint` passed with 0 errors.
- **Live Endpoint Verification:** Verified against Railway production server:
  - Missing token: `401 {"success":false,"message":"Refresh token not found"}`
  - Invalid token: `401 {"success":false,"message":"Invalid refresh token"}`
