# 📱 Bug Fix Documentation: Mentorship Request Sheet Hidden Behind Keyboard on Profile

> **Module:** SCIS Family / Alumni Profile & Mentors Screens (`app/(app)/alumni/profile.tsx`, `app/(app)/alumni/mentors.tsx`)  
> **Status:** Resolved  
> **Type:** UI/UX Bottom Sheet Keyboard Avoidance & Overlay Polish  
> **Conformity:** Strict adherence to [app/AGENTS.md](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/app/AGENTS.md)  
> **Version Target:** `v2.1.3`

---

## 1. Issue Overview

### 1.1 Symptoms
When a student navigated to **Placement -> SCIS Family**, selected any alumni or student profile (e.g., *Adarsh Kumar Pandey*), and tapped the **"Mentorship"** button:
1. The **Mentorship Request** bottom sheet modal opened up.
2. Tapping inside the text inputs ("Areas" or "Message") triggered the device's native software keyboard (MIUI / HyperOS / Android / iOS).
3. The keyboard slid up and completely obscured the bottom sheet content.
4. Only the sheet's top header ("MENTORSHIP REQUEST to [Name]" and the close button "x") remained barely visible above the keyboard.
5. Both text inputs and the "Send Request" CTA button were pushed behind the soft keyboard, making it impossible to fill in or submit the form.
6. Tapping on the darkened backdrop outside the sheet did not dismiss the modal.

### 1.2 Root Cause Analysis
- **Missing KeyboardAvoidingView**: The Mentorship Request Modal in `app/(app)/alumni/profile.tsx` (and `app/(app)/alumni/mentors.tsx`) rendered a bare `<Modal>` directly containing `<View className="flex-1 bg-black/60 justify-end">` without any `<KeyboardAvoidingView>` wrapper.
- **Android Translucent Modal Window Constraint**: In React Native Android, modal dialogs do not automatically adjust layout for software keyboards when rendered as full-screen overlays without explicit keyboard avoidance behaviors. Because the container was anchored to the bottom with `justify-end`, it remained pinned to the bottom of the device display while the keyboard rendered on top of it.
- **Missing Status Bar Translucency**: The modal was configured with `animationType="fade"` and lacked `statusBarTranslucent`, creating visual clipping against system status bars.
- **Missing Backdrop Tap Dismissal**: The sheet backdrop had no `TouchableWithoutFeedback` touch handler, requiring users to explicitly find the close button.
- **Missing Tap Persistence**: The nested form `<ScrollView>` did not have `keyboardShouldPersistTaps="handled"`, causing initial taps on the "Send Request" button while the keyboard was open to be consumed solely by keyboard dismissal rather than triggering form submission.

---

## 2. Changes Implemented

### 2.1 Keyboard Avoidance Integration (`profile.tsx` & `mentors.tsx`)
Wrapped the modal overlay container in `<KeyboardAvoidingView>` with platform-aware behavior:
```tsx
<KeyboardAvoidingView
  behavior={Platform.OS === "ios" ? "padding" : "height"}
  className="flex-1"
>
```
- **Android**: Dynamically adjusts height to fit the visible viewport above the keyboard when active, lifting the bottom sheet so that the text inputs and submit button sit comfortably above the software keyboard.
- **iOS**: Fluidly translates modal contents upwards with bottom padding equal to keyboard height.

### 2.2 Native Modal Overlay & Animation Polish
- Replaced `animationType="fade"` with `animationType="slide"` for authentic bottom sheet entry and exit.
- Added `statusBarTranslucent` to ensure full screen coverage.
- Configured native Android back button handling via `onRequestClose`.

### 2.3 Backdrop Touch Dismissal
Implemented backdrop tap dismissal:
```tsx
<TouchableWithoutFeedback onPress={() => setShowMentorshipModal(false)}>
  <View className="flex-1" />
</TouchableWithoutFeedback>
```
Tapping anywhere outside the bottom sheet seamlessly closes the modal and dismisses the keyboard.

### 2.4 Scroll & Tap Polish
- Configured `keyboardShouldPersistTaps="handled"` on the inner `<ScrollView>` so users can tap "Send Request" directly without requiring a prior keyboard dismissal tap.
- Added `contentContainerStyle={{ paddingBottom: 24 }}` to provide clear bottom spacing.
- Added `numberOfLines={1}` and flex constraints to long recipient names in the sheet header to prevent overflow.

---

## 3. Verification & Quality Assurance

- **TypeScript Compilation:** `npx tsc --noEmit` passed with **0 errors**.
- **ESLint:** Verified no new lint errors introduced (`mentors.tsx` 0 errors, `profile.tsx` 0 errors on modified code).
- **Version Bump:** Updated `app.json` and `package.json` to version `2.1.3`.
- **EAS Update:** Deployed OTA update to `production` channel.
- **Log Entry:** Recorded in `logs/errors.log` under `[UI_MODAL_KEYBOARD_AVOIDANCE_FIX]`.
