# SCIS Connect Mobile — Login API Integration & Cookie Management

> **Document Created:** Monday, August 24, 2026 at 9:34 AM IST (`2026-08-24T09:34:00+05:30`)  
> **Module:** Authentication (`(auth)/login`), Core API Service (`services/api.ts`), & Storage Layer (`services/storage.ts`)  
> **Status:** Live & Integrated with Production Backend  
> **Conformity:** Strict adherence to [app/AGENTS.md](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/app/AGENTS.md)  

---

## 📋 Overview

The **Login API Integration** connects the **SCIS Connect Mobile** client directly to the production backend authentication service deployed on Railway. It enables students to sign in with their registered college email address and password, securely receives and stores the `refreshToken` cookie, saves the `accessToken` and user profile, and provides robust handling for all backend error states (401, 403, 400).

---

## 🌐 Backend API Contract

| Property | Specification |
| :--- | :--- |
| **Endpoint** | `POST https://mca-connect-backend-production.up.railway.app/api/auth/login` |
| **Request Headers** | `Content-Type: application/json`, `Accept: application/json` |
| **Request Payload** | `{"email": "student@uohyd.ac.in", "password": "securePassword123"}` |
| **Success Response (200 OK)** | `{"success": true, "message": "Login successful", "data": {"user": {...}, "accessToken": "..."}}` |
| **Set-Cookie Header** | `refreshToken=<token>; Path=/; HttpOnly; SameSite=Strict; Secure` |
| **Invalid Credentials (401)** | `{"success": false, "message": "Invalid email or password"}` |
| **Email Not Verified (403)** | `{"success": false, "message": "Email not verified", "data": {"requiresVerification": true, "email": "..."}}` |
| **Account Deactivated (403)** | `{"success": false, "message": "Account is deactivated"}` |
| **Validation Error (400)** | `{"success": false, "message": "Validation failed: ...", "errors": [...]}` |

---

## 🏗️ Architecture & Component Layout

```text
SCIS-Connect-Mobile/
├── app/
│   └── (auth)/
│       ├── _layout.tsx               # Auth Stack Navigator
│       ├── login.tsx                 # Student Login screen with live API connection
│       └── forgot-password.tsx       # Password recovery screen
│
├── constants/
│   ├── config.ts                     # API Base URL & endpoint registry
│   └── colors.ts                     # Color tokens (Violet, Slate)
│
├── services/
│   ├── api.ts                        # Core API Client (Bearer token, cookie handling, ApiError)
│   └── storage.ts                    # In-memory & session storage for cookies, tokens, and user
│
├── features/
│   └── auth/
│       ├── types.ts                  # LoginCredentials, AuthUser, LoginResponseData, error types
│       └── api.ts                    # Feature-specific auth API methods (authApi.login)
│
├── utils/
│   └── logger.ts                     # Centralized application & error logging utility
│
├── docs/
│   ├── login.md                      # UI and Layout Documentation
│   └── login-api-integration.md      # This API & Session Integration documentation
│
└── logs/
    └── errors.log                    # Central application audit and error log
```

---

## 🔐 Cookie & Session Management Layer (`services/storage.ts`)

To ensure cross-platform compatibility across iOS, Android, and Web:

1. **Conditional Cookie Storage (Remember Me)**: Cookies are **only** stored and retained if the student toggles the "Remember me" option during login. If "Remember me" is false, cookie storage is skipped and any cached cookies are immediately purged.
2. **`storageService.setCookie(name, value, options)`**: Stores named cookies in memory and session when Remember Me is active.
3. **`storageService.getCookieHeader()`**: Formats active cookies as an RFC 6265 compliant HTTP `Cookie` header string (e.g. `refreshToken=...`).
4. **`storageService.parseAndStoreSetCookie(header)`**: Automatically parses `Set-Cookie` response headers and updates the internal cookie store when Remember Me is enabled.
5. **`storageService.setAccessToken(token)`**: Stores the Bearer JWT token.
6. **`storageService.setUser(user)`**: Stores the authenticated user profile.
7. **`storageService.clearSession()`**: Clears cookies, access token, Remember Me preference, and user state on sign out.

---

## 🛡️ Core API Client Enhancements (`services/api.ts`)

- **Credentials Inclusion:** Configured `credentials: "include"` for web/CORS cookie support.
- **Conditional Cookie Synchronization:** Extracts `Set-Cookie` / `getSetCookie()` from backend responses **only** when `saveCookies === true` or `storageService.isRememberMe()` is true.
- **Bearer Token Header:** Automatically injects `Authorization: Bearer <accessToken>` when available.
- **Enriched ApiError Handling:** Passes the parsed backend payload (`parsedData.data` or `parsedData`) into `ApiError.data` to preserve metadata such as `requiresVerification`.

---

## 📱 UI & Form Error Handling (`app/(auth)/login.tsx`)

1. **Client-Side Validation:**
   - Email format regex validation (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`).
   - Password minimum length validation (minimum 4 characters).
   - Instant inline error indicator and haptic warning on missing fields.
2. **Live Backend API Response Handling:**
   - **401 Unauthorized:** Displays `"Invalid email or password"` and triggers card shake animation.
   - **403 Email Not Verified:** Displays `"Please verify your email before logging in. Check your inbox for the verification email."`.
   - **403 Account Deactivated:** Displays `"Account is deactivated. Please contact college administration."`.
   - **400 Validation Error:** Displays specific validation guidance from the backend.
   - **200 OK Success:** Shows confirmation banner (`Logged in as <Name>`), stores session tokens & cookies, and emits success haptic feedback.

---

## ✅ Verification & Health Checks

- **TypeScript Compilation:** `npx tsc --noEmit` passed with 0 errors.
- **ESLint Checks:** `npm run lint` passed with 0 errors.
- **Live Endpoint Test:** Verified live Railway endpoint (`https://mca-connect-backend-production.up.railway.app/api/auth/login`) responding with expected JSON contracts and HTTP status codes (400, 401).
