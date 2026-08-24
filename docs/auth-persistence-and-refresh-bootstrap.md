# SCIS Connect Mobile — Auth Persistence, Remember Me & App Startup Token Refresh

> **Document Created:** Monday, August 24, 2026 at 11:38 AM IST (`2026-08-24T11:38:00+05:30`)  
> **Module:** Session & Storage Layer (`services/storage.ts`), Global Auth Store (`features/auth/authStore.ts`), Auth Hooks (`features/auth/hooks.ts`), Core API Client (`services/api.ts`), App Entry (`app/index.tsx`), and Profile/Home Screens (`app/(app)/(tabs)/...`)  
> **Status:** Live, Integrated, & Validated  
> **Conformity:** Strict adherence to [app/AGENTS.md](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/app/AGENTS.md)  

---

## 📋 Problem Statement & Root Cause

### Previous Limitation
1. **In-Memory Only Sessions:** Tokens, cookies (`refreshToken`), and user profile state in `services/storage.ts` were stored in memory variables. When the application was restarted, closed, or reloaded, all in-memory variables returned to default `null`/empty state.
2. **Synchronous Redirection on Startup:** `app/index.tsx` immediately checked `storageService.getUser() || storageService.getAccessToken()` synchronously without performing any asynchronous storage lookup or silent token refresh.
3. **Missing Auth Bootstrap Lifecycle:** The app lacked an initialization lifecycle to restore the student's session from secure persistent storage and validate it against the production backend (`POST /api/auth/refresh`).

---

## 🏗️ Technical Architecture & Workflow

### 1. Storage Layer (`services/storage.ts`)
- **Secure Persistence via `expo-secure-store`:**
  - Encrypts and persists sensitive credentials on iOS and Android devices:
    - `scis_auth_remember_me`: Stores boolean preference (`"true"` / `"false"`).
    - `scis_auth_refresh_token`: Stores active refresh token.
    - `scis_auth_cookies`: Stores serialized session cookies.
    - `scis_auth_access_token`: Stores active access token.
    - `scis_auth_user`: Stores JSON stringified `AuthUser` data.
  - Safe fallback for Web environments using `localStorage`.
- **`storageService.init()`:**
  - Asynchronously reads persisted keys on app launch.
  - If `rememberMe === true`, populates in-memory maps, tokens, and active user profile.
  - If `rememberMe === false`, ensures no credentials are loaded and clears any stale persisted data.
- **Atomic Session Purge:**
  - `storageService.clearSession()` removes all in-memory state and deletes all keys from `SecureStore`.

---

### 2. Global State Management (`features/auth/authStore.ts` & `features/auth/hooks.ts`)
- Implemented using **Zustand** per `app/AGENTS.md`:
  - **State:**
    - `user: AuthUser | null`
    - `accessToken: string | null`
    - `isAuthenticated: boolean`
    - `isLoading: boolean`
    - `isInitialized: boolean`
    - `rememberMe: boolean`
    - `error: string | null`
  - **`initializeAuth()` Action:**
    1. Invokes `storageService.init()`.
    2. If `rememberMe && hasRefreshToken()`, triggers `authApi.refreshToken()`.
    3. On `200 OK`: Sets `isAuthenticated = true`, updates user profile and access token.
    4. On `401 Unauthorized`: Calls `storageService.clearSession()` and sets `isAuthenticated = false`.
    5. Flags `isInitialized = true` and `isLoading = false`.
  - **`login(credentials)` Action:**
    - Calls `authApi.login(credentials)`.
    - Updates Zustand store reactive state and sets `isAuthenticated = true`.
  - **`logout()` Action:**
    - Clears storage and resets auth state.
  - **`refreshToken()` Action:**
    - Tests or refreshes tokens in background/foreground.

---

### 3. Application Startup Bootstrap (`app/index.tsx`)
```text
App Starts (app/index.tsx)
          │
          ▼
initializeAuth() triggered
          │
  ┌───────┴───────────────────────────────┐
  │ While !isInitialized || isLoading     │
  │ Render SCIS Connect Branded Splash    │
  └───────────────────────────────────────┘
          │
          ▼
Is Student Authenticated?
          │
    ┌─────┴─────┐
   YES          NO
    │           │
    ▼           ▼
/(app)/(tabs)  /(auth)/login
```

---

## 🛡️ "Remember Me" Privacy Matrix

| User Action | Stored in Memory? | Persisted in SecureStore? | Behavior on App Restart |
| :--- | :--- | :--- | :--- |
| **Login with "Remember Me" checked** | ✅ Yes | ✅ Yes (`refreshToken`, cookies, user) | **Silent token refresh (`POST /api/auth/refresh`) restores session. User goes straight to Dashboard.** |
| **Login with "Remember Me" unchecked** | ✅ Yes | ❌ No (Purged) | **Session expires on app close. App asks user to sign in.** |
| **Sign Out / Logout** | ❌ Cleared | ❌ Cleared | **Redirects to `/login`. App restarts go to `/login`.** |

---

## 🔍 Verification & Audit

| Test / Check | Result |
| :--- | :--- |
| **TypeScript Compilation (`npx tsc --noEmit`)** | Passed (0 errors) |
| **ESLint (`npm run lint`)** | Passed (0 errors, 0 warnings) |
| **Backend Integration (`POST /api/auth/refresh`)** | Verified against production backend API with Cookie header |
| **app/AGENTS.md Compliance** | Fully compliant with Zustand, SecureStore, NativeWind, and documentation rules |
