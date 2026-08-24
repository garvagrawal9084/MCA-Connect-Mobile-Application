# SCIS Connect Mobile — Remember Me & Conditional Cookie Storage

> **Document Created:** Monday, August 24, 2026 at 9:44 AM IST (`2026-08-24T09:44:00+05:30`)  
> **Module:** Storage Layer (`services/storage.ts`), Core API Client (`services/api.ts`), Auth Feature API (`features/auth/api.ts`), & Login UI (`app/(auth)/login.tsx`)  
> **Status:** Completed & Validated  
> **Conformity:** Strict adherence to [app/AGENTS.md](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/app/AGENTS.md)  

---

## 📋 Overview & Requirement

Per project specifications:
> **"only store cookie when user click remember me in login page"**

This requirement ensures student privacy and strict session boundaries across shared and personal devices:
1. **When "Remember Me" is checked (`rememberMe: true`)**:
   - The application stores the authentication session cookies (such as `refreshToken` received from backend `Set-Cookie` response headers or response payloads) in `storageService`.
   - `storageService.setRememberMe(true)` is activated.
   - Subsequent authenticated API requests will include active cookies in the HTTP `Cookie` header.

2. **When "Remember Me" is UNCHECKED (`rememberMe: false`)**:
   - The application **does NOT** store or persist any authentication cookies.
   - Any `Set-Cookie` response header sent by the server during login or subsequent calls is ignored and discarded.
   - `storageService.clearCookies()` is executed to purge any residual cookie data.
   - `storageService.setRememberMe(false)` ensures the cookie store remains empty.
   - In-memory access token and current user profile are maintained only for the duration of the current active session.

---

## 🏗️ Technical Implementation Details

### 1. Storage Service (`services/storage.ts`)
- Added private `rememberMe: boolean` field with getter `isRememberMe()` and setter `setRememberMe(value: boolean)`.
- When `setRememberMe(false)` is invoked, `clearCookies()` is automatically called to purge any stored cookies.
- In `clearSession()`, `rememberMe` is cleanly reset to `false` alongside token and user state.

### 2. Core API Client (`services/api.ts`)
- Added `saveCookies?: boolean` to `RequestOptions`.
- In `apiClient.request()`:
  - Extracts and persists `Set-Cookie` headers **only** when `saveCookies === true` or when `saveCookies !== false && storageService.isRememberMe()`.
  - When `saveCookies` is disabled, cookie parsing is bypassed and a debug log is recorded.

### 3. Feature Auth API (`features/auth/api.ts`)
- In `authApi.login(credentials)`:
  - Reads `const shouldRemember = Boolean(credentials.rememberMe)`.
  - Invokes `storageService.setRememberMe(shouldRemember)`.
  - Passes `{ saveCookies: shouldRemember }` to `apiClient.post`.
  - If `shouldRemember` is `true`: saves `refreshToken` to `storageService.setCookie("refreshToken", response.data.refreshToken)`.
  - If `shouldRemember` is `false`: calls `storageService.clearCookies()` and logs that the session was established without cookies.

### 4. UI Layer (`app/(auth)/login.tsx`)
- The "Remember me" checkbox state (`credentials.rememberMe`) is passed directly to `authApi.login`.

---

## 🔍 Verification & Audit

| Check | Result |
| :--- | :--- |
| **TypeScript Compilation (`npx tsc --noEmit`)** | Passed (0 errors) |
| **ESLint (`npm run lint`)** | Passed (0 errors) |
| **State Sanitization on Logout / Untoggle** | Verified via `clearSession()` & `clearCookies()` |
| **AGENTS.md Compliance** | All documentation & logging constraints satisfied |
