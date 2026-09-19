# Contact API Category & Validation Fix

## Overview
When attempting to submit queries through the Contact Us screen (`/(app)/alumni/contact`), submissions failed with `HTTP 400 Bad Request: "Category is required"`. This document records the root cause, backend API contract discovery, frontend UI adjustments, validation rules, and verification.

---

## 1. Problem Statement & Root Cause

### Error Log
```json
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "success": false,
  "message": "Category is required"
}
```

### Root Cause
1. **Missing Backend Parameter**: The previous implementation of [contact.tsx](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/app/(app)/alumni/contact.tsx) only transmitted `{ subject, message }`. The backend's validation middleware strictly requires a `category` property.
2. **Category Enum Restriction**: Passing arbitrary or lowercase categories (e.g. `"general"`) resulted in `{"success": false, "message": "Invalid contact category"}` because the backend validates against a strict PascalCase/TitleCase enum.
3. **Length Validation**: The backend enforces `minLength: 20` and `maxLength: 2000` on the `message` string. Previously, the mobile client only checked for non-empty strings.
4. **Keyboard Obstruction**: The scrollable container lacked `KeyboardAvoidingView`, causing the on-screen keyboard to occlude text inputs and the submit button.

---

## 2. Backend Contract Specification

### Endpoint: `POST /api/contact`
- **Authentication**: Optional for web guests; Bearer token attached for mobile authenticated users.
- **Request Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <accessToken>`
- **Request Body**:
  ```json
  {
    "subject": "String (Required, 1-200 chars)",
    "category": "String (Required, must match valid enum)",
    "message": "String (Required, 20-2000 chars)",
    "source": "String (Optional, e.g. 'mobile')"
  }
  ```

### Valid Contact Categories
```ts
export const CONTACT_CATEGORIES = [
  "General Query",
  "Bug Report",
  "Feature Request",
  "Challenge Issue",
  "Leaderboard Issue",
  "Profile Issue",
  "Account Issue",
  "Placement Related",
  "Other",
] as const;
```

### Endpoint: `GET /api/contact/my`
- **Query Params**: `?page=1&limit=20`
- **Response Structure**:
  ```json
  {
    "success": true,
    "message": "Contact messages",
    "data": {
      "messages": [
        {
          "_id": "6aadcbdd78f6474497cb4f2f",
          "subject": "Mobile App Verification Test",
          "category": "General Query",
          "message": "Testing message submission from SCIS Connect mobile client verification.",
          "status": "OPEN",
          "adminReply": "",
          "createdAt": "2026-09-18T23:40:13.149Z"
        }
      ],
      "pagination": { "page": 1, "limit": 20, "total": 2, "totalPages": 1 }
    }
  }
  ```

---

## 3. Implementation Details

### Configuration ([config.ts](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/constants/config.ts))
Added contact endpoint definitions to `API_CONFIG.ENDPOINTS`:
```ts
CONTACT: {
  SUBMIT: "/api/contact",
  MY_MESSAGES: "/api/contact/my",
}
```

### UI & Interaction ([contact.tsx](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/app/(app)/alumni/contact.tsx))
1. **Category Selection Chips**:
   - Interactive horizontal wrapping chips with light haptic feedback (`Haptics.impactAsync`).
   - Active category highlighted with brand `#8B0000` (`bg-red-800`), with `"General Query"` as default.
2. **Character Count & Helper**:
   - Live character counter: `${message.length}/2000`.
   - Amber warning message when `0 < message.length < 20`: `Min 20 characters required (X more needed)`.
   - Emerald styling when threshold is satisfied (`message.length >= 20`).
3. **Form Validation**:
   - `subject`: Checked for non-empty and `<= 200` chars.
   - `message`: Checked for `>= 20` and `<= 2000` chars.
   - `category`: Checked for valid selection.
4. **Keyboard Avoidance & Focus Auto-Scroll**:
   - Wrapped in `<KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 25}>`.
   - Removed wrapping `<TouchableWithoutFeedback>` that interfered with Android scroll responder chains.
   - Added `keyboardDismissMode="on-drag"` and `keyboardShouldPersistTaps="handled"` on the `<ScrollView>`.
   - Added `scrollViewRef` with auto-scrolling on input focus (`scrollToEnd({ animated: true })` on Message focus, `scrollTo({ y: 140 })` on Subject focus).
   - Set dynamic bottom padding `paddingBottom: keyboardVisible ? 280 : 40` so users can scroll well above the soft keyboard.
   - Added a header "Done" button to dismiss the keyboard cleanly.
   - Set explicit high-contrast text styling (`color: isDark ? "#FFFFFF" : "#0F172A"`).
5. **Dynamic Error Handling**:
   - Catches `ApiError` and surfaces `err.message` in `Alert.alert` rather than masking with a generic fallback.

---

## 4. Verification

1. **Live Backend API Test**:
   - `POST /api/contact` returned `{"success":true,"message":"Message sent successfully. Our team will get back to you soon."}`.
   - `GET /api/contact/my` confirmed the message was recorded under the student's account.
2. **TypeScript Compilation**:
   - `npx tsc --noEmit` exited with code 0 (0 errors).
3. **ESLint**:
   - `npm run lint` passed with 0 errors.
