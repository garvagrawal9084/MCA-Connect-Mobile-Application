# SCIS Connect Mobile — Forgot Password Module & API Integration

> **Document Created:** Sunday, August 23, 2026 at 7:14 PM IST (`2026-08-23T19:14:00+05:30`)  
> **Module:** Authentication (`(auth)/forgot-password`) & Core API Service Layer  
> **Status:** Live & Integrated with Production Backend  
> **Conformity:** Strict adherence to [app/AGENTS.md](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/app/AGENTS.md)  

---

## 📋 Overview

The **Forgot Password** module enables SCIS students to request a password recovery One-Time Password (OTP) or reset instructions to their registered university email address.

This module establishes the foundational API client layer (`services/api.ts`) and feature service layer (`features/auth/api.ts`) consuming the production backend deployed on Railway.

---

## 🌐 Backend API Contract

| Property | Value |
| :--- | :--- |
| **Base URL** | `https://mca-connect-backend-production.up.railway.app` |
| **Endpoint** | `POST /api/auth/forgot-password` |
| **Headers** | `Content-Type: application/json`, `Accept: application/json` |
| **Request Payload** | `{"email": "student@uohyd.ac.in"}` |
| **Success Response** | `{"success": true, "message": "OTP sent to your email"}` (HTTP 200) |
| **Validation Failure** | `{"success": false, "message": "Email is required"}` (HTTP 400) |
| **Server Error** | `{"success": false, "message": "Failed to send reset email. Please try again later."}` (HTTP 500) |

---

## 🏗️ Architecture & Created Files

```text
SCIS-Connect-Mobile/
├── app/
│   └── (auth)/
│       ├── _layout.tsx               # Auth Stack with login and forgot-password screens
│       ├── login.tsx                 # Student Login screen (links to forgot-password)
│       └── forgot-password.tsx       # Forgot Password screen with live API connection
│
├── constants/
│   ├── config.ts                     # API Base URL and central endpoint registry
│   ├── colors.ts                     # Centralized theme color tokens
│   └── images.ts                     # Centralized asset references
│
├── services/
│   └── api.ts                        # Standardized HTTP API client (timeout, fetch, ApiError)
│
├── features/
│   └── auth/
│       ├── types.ts                  # ForgotPasswordRequest, ForgotPasswordResponse, types
│       └── api.ts                    # Feature-specific auth API methods
│
├── utils/
│   └── logger.ts                     # Structured application and error logging
│
├── docs/
│   └── forgot-password.md            # This documentation file
│
└── logs/
    └── errors.log                    # Central audit and error tracking log
```

---

## 🎨 UI & UX Implementation

1. **Header & SCIS Portal Branding:**
   - Academic badge with key emblem (`key-outline` from Ionicons) in an indigo rounded container.
   - Portal pill: `SCIS CONNECT • PASSWORD RECOVERY`.
   - Title: `Forgot Password`.
   - Subtitle: `Enter your registered college email address to receive your password reset OTP`.

2. **Form Elements:**
   - **Back to Sign In Button:** Quick back button at the top and bottom of the form.
   - **College Email Input:**
     - Left icon: `mail-outline`.
     - Placeholder: `e.g. student@uohyd.ac.in`.
     - Real-time error clearance on user typing.
   - **Feedback States:**
     - **Error Banner:** Dynamic red alert banner with close button if request fails.
     - **Success Banner:** Emerald confirmation banner displaying backend message (`OTP Sent Successfully`) with advice to check inbox and spam folders.
   - **Submit Action Button:**
     - Primary button with loading spinner state and paper plane icon (`Send Reset OTP` / `Resend Reset OTP`).

3. **Student Support & Security:**
   - Support callout box for students needing manual department IT cell assistance.
   - Security badge: `SCIS Connect Secure Platform • v1.0.0`.

---

## 🧪 Client-Side Validation Rules

| Field | Rule | Error Message |
| :--- | :--- | :--- |
| `email` | Required (Non-empty) | "Please enter your college email address" |
| `email` | Standard RFC Regex Format | "Please enter a valid email address" |

---

## ✅ Verification & Health Checks

- **TypeScript Compilation:** `npx tsc --noEmit` verified with 0 errors.
- **ESLint Validation:** `npm run lint` verified with 0 warnings/errors.
- **Backend API Connectivity:** Verified `POST https://mca-connect-backend-production.up.railway.app/api/auth/forgot-password` with real payloads.
