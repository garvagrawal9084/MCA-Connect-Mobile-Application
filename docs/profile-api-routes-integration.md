# 👤 Profile API Routes Integration & Architecture

## Overview
This document details the assessment and client-side implementation of the 15 backend profile endpoints from `src/routes/profileRoutes.js` into **SCIS Connect Mobile**.

---

## 1. Evaluated Endpoints

| # | Method | Path | Handled in Client (`profileApi`) | Description |
|---|---|---|---|---|
| 1 | `GET` | `/api/profile/` | `profileApi.getProfile()` | Fetches logged-in user profile, with graceful fallback to `/api/auth/me`. |
| 2 | `PATCH` | `/api/profile/` | `profileApi.updateProfile(data)` | Updates general profile details (`bio`, `openToWork`, `location`, `batchYear`, etc.). |
| 3 | `GET` | `/api/profile/:userId` | `profileApi.getProfileById(userId)` | Fetches another user's public profile (alumni/peer view). |
| 4 | `GET` | `/api/profile/completion` | `profileApi.getCompletion()` | Fetches profile completion score, percentage, and missing fields checklist. |
| 5 | `PATCH` | `/api/profile/contact` | `profileApi.updateContact(data)` | Updates mobile, alternate mobile, WhatsApp, email, and visibility flags. |
| 6 | `PATCH` | `/api/profile/education` | `profileApi.updateEducation(data)` | Updates 10th, 12th, graduation, post-graduation, and SGPA. |
| 7 | `DELETE` | `/api/profile/image` | `profileApi.deleteImage()` | Removes avatar image from cloud storage and resets profile picture. |
| 8 | `POST` | `/api/profile/image` | `profileApi.uploadImage(formData)` | Uploads avatar image as `multipart/form-data`. |
| 9 | `POST` | `/api/profile/password` | `profileApi.changePassword(data)` | Submits password change request (`currentPassword`, `newPassword`). |
| 10 | `PATCH` | `/api/profile/professional` | `profileApi.updateProfessional(data)` | Updates skills, career objective, and coding profile handles (GitHub, LinkedIn, GFG, Codeforces, CodeChef). |
| 11 | `POST` | `/api/profile/resume` | `profileApi.uploadResume(formData)` | Uploads resume PDF as `multipart/form-data`. |
| 12 | `DELETE` | `/api/profile/resume/:resumeId` | `profileApi.deleteResume(resumeId)` | Deletes a specific resume document. |
| 13 | `PATCH` | `/api/profile/resume/:resumeId/primary` | `profileApi.setPrimaryResume(resumeId)` | Designates a resume as primary. |
| 14 | `PATCH` | `/api/profile/resume/:resumeId/rename` | `profileApi.renameResume(resumeId, title)` | Renames resume title. |
| 15 | `POST` | `/api/profile/sync-leetcode` | `profileApi.syncLeetCode()` | Triggers backend sync for LeetCode statistics and streak data. |

---

## 2. Infrastructure Enhancements

### `services/api.ts`
- Added multipart `upload<T>(endpoint, formData, options)` helper method.
- Updated `requestHeaders` resolution to automatically omit `"Content-Type": "application/json"` when `customConfig.body instanceof FormData`, allowing the mobile runtime (React Native / Expo) to properly append multipart boundary headers.

### `constants/config.ts`
- Expanded `API_CONFIG.ENDPOINTS.PROFILE` to include all 15 endpoints with parameterized functions for dynamic route parameters (`:userId`, `:resumeId`).

### `features/profile/types.ts`
- Added comprehensive TypeScript DTOs:
  - `UpdateProfileRequest`
  - `UpdateContactRequest`
  - `UpdateEducationRequest`
  - `UpdateProfessionalRequest`
  - `ChangePasswordRequest`
  - `ProfileCompletionResponse`
  - `RenameResumeRequest`
  - `LeetCodeSyncResponse`

### `features/profile/api.ts` & `features/profile/hooks.ts`
- Implemented all 15 API methods with automatic fallback handling.
- Integrated automated cache and state synchronization: whenever an update endpoint returns fresh user data, it is persisted to `storageService.setUser` and synchronized across the app via `useAuthStore.getState().setUser`.
- Exposed mutations and loading states in `useProfile` with `expo-haptics` feedback and error logging.
