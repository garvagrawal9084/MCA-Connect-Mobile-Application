# 📱 Bug Fix Documentation: Mentorship Request Input Occluded by Keyboard on Profile & Mentors

> **Module:** SCIS Family / Alumni & Student Profile & Mentors Screens (`app/(app)/alumni/profile.tsx`, `app/(app)/alumni/mentors.tsx`)  
> **Status:** Resolved  
> **Type:** UI/UX Keyboard Avoidance, Soft Input Mode Resolution & Auto-Focus Scroll  
> **Conformity:** Strict adherence to [app/AGENTS.md](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/app/AGENTS.md)  
> **Version Target:** `v2.1.4`

---

## 1. Issue Overview

### 1.1 Symptoms
When a student navigated to **Placement -> SCIS Family**, selected any student or alumni profile (e.g. *Akshay Guru*), and tapped the **"Mentorship"** button:
1. The **Mentorship Request** bottom sheet modal opened.
2. Tapping into the **"Areas (comma separated)"** or **"Message *"** text input triggered the native software keyboard (Gboard / MIUI / HyperOS / Android / iOS).
3. The software keyboard opened directly on top of the text inputs and "Send Request" submit button.
4. The user could not see the area where they were writing, what characters were being entered, or how to submit the request without dismissing the keyboard.

### 1.2 Root Cause Analysis
1. **Android Translucent Modal Conflict with `adjustResize`**:
   The `<Modal>` component previously specified `statusBarTranslucent={true}`. Under Android's native WindowManager, dialog windows that draw underneath system bars (`FLAG_LAYOUT_NO_LIMITS` or `SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN`) have native window resizing (`adjustResize`) automatically disabled by the Android OS. As a result, the dialog window remained 100% of the display height, allowing the software keyboard to draw directly over the modal.
2. **`KeyboardAvoidingView` Evaluation Breakdown on Android**:
   Under React Native on Android with `adjustResize`, `ReactRootView` reports `screenY = mVisibleViewArea.bottom` in keyboard show events. `KeyboardAvoidingView` calculates `Math.max(frame.y + frame.height - keyboardY, 0)`, which resolves to `0`. Consequently, `behavior="height"` on Android fails to apply height compensation, while setting `flex: 0` inside the Modal view tree.
3. **In-Flow Flex Container Space Theft**:
   The backdrop dismiss touchable was previously implemented as `<TouchableWithoutFeedback><View className="flex-1" /></TouchableWithoutFeedback>` inside the same vertical flex column as the bottom sheet. When total available height was constrained, this in-flow flex child competed with the sheet and pushed it downwards into the keyboard.
4. **Lack of Input Focus Auto-Scrolling**:
   The inner `<ScrollView>` had static bottom padding and lacked active focus listeners to automatically scroll the active `TextInput` (especially the multiline Message input) into full view above the keyboard.

---

## 2. Changes Implemented

### 2.1 Removed `statusBarTranslucent` from `<Modal>`
By omitting `statusBarTranslucent`, the Android native Dialog conforms to standard window policies, allowing Android's native `windowSoftInputMode="adjustResize"` to automatically resize the Dialog viewport above the software keyboard without clipping or freezing.

### 2.2 Platform-Aware `KeyboardAvoidingView` Configuration
Configured:
```tsx
<KeyboardAvoidingView
  behavior={Platform.OS === "ios" ? "padding" : undefined}
  className="flex-1 justify-end bg-black/60"
>
```
- **Android (`undefined`)**: Delegates window resizing to Android's native `adjustResize` engine without conflicting layout calculations.
- **iOS (`padding`)**: Dynamically pads the bottom of the container by the exact software keyboard height.

### 2.3 Absolute Overlay Backdrop Dismissal
Replaced the in-flow `flex-1` backdrop view with an absolute positioned overlay:
```tsx
<TouchableWithoutFeedback
  onPress={() => {
    Keyboard.dismiss();
    setShowMentorshipModal(false);
  }}
>
  <View className="absolute inset-0" />
</TouchableWithoutFeedback>
```
- Covers the full background without occupying any vertical flex layout space.
- Eliminates flex competition, guaranteeing the bottom sheet receives 100% of available vertical height.
- Dismisses keyboard and closes modal on backdrop taps.

### 2.4 Focus-Driven Auto-Scrolling & Keyboard Dismissal
- Attached `ref={mentorshipScrollRef}` to the form `<ScrollView>`.
- Added active `Keyboard.addListener` subscription tracking `keyboardVisible`.
- Increased form content padding when keyboard is visible: `contentContainerStyle={{ paddingBottom: keyboardVisible ? 60 : 24 }}`.
- Added `onFocus` auto-scrolling:
  - **Areas Input**: `mentorshipScrollRef.current?.scrollTo({ y: 0, animated: true })`
  - **Message Input**: `setTimeout(() => mentorshipScrollRef.current?.scrollToEnd({ animated: true }), 120)`
- Added a header "Done" button when `keyboardVisible` is active.
- Configured `keyboardDismissMode="on-drag"` and `keyboardShouldPersistTaps="handled"`.

### 2.5 Uniform Fix on Both Screens
Applied the identical fix to:
- `app/(app)/alumni/profile.tsx` (Student / Alumni Profile mentorship modal)
- `app/(app)/alumni/mentors.tsx` (Mentors Directory mentorship modal)

---

## 3. Verification & Quality Assurance

- **TypeScript Compilation:** `npx tsc --noEmit` passed with **0 errors**.
- **ESLint:** Verified no new lint errors introduced on modified files.
- **Version Bump:** Updated `package.json` and `app.json` to version `2.1.4`.
- **EAS Update:** Deployed Over-The-Air (OTA) update to `production` channel.
- **Error Log:** Logged in `logs/errors.log` under `[MENTORSHIP_MODAL_KEYBOARD_OCCLUSION_FIX]`.
