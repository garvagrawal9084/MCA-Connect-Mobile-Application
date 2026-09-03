# 📱 Bug Fix Documentation: Support Screen New Ticket Sheet Stuck in Bottom

> **Module:** Support Screen (`app/(app)/alumni/support.tsx`)  
> **Status:** Resolved  
> **Type:** UI/UX Bottom Sheet Overlay & Keyboard Avoidance Fix  
> **Conformity:** Strict adherence to [app/AGENTS.md](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/app/AGENTS.md)  

---

## 1. Issue Overview

### 1.1 Symptoms
When students tapped the **"+"** button to submit a new support ticket in the Support screen (`app/(app)/alumni/support.tsx`):
1. The "New Ticket" bottom sheet was squished and stuck in the bottom ~30% of the device screen.
2. The Category selector and Subject input were scrolled out of view or difficult to reach.
3. The "Submit Ticket" action button at the bottom was partially cut off.
4. When tapping inside the "Subject" or "Message" inputs, the on-screen software keyboard covered the form, making typing and form submission extremely difficult.

### 1.2 Root Cause Analysis
- **In-Flow Layout vs Native Overlay**: The "Create Ticket" container was coded as a conditional `{showCreate && <View className="flex-1 bg-black/60 justify-end">...}` placed directly inside the parent `<SafeAreaView>`, immediately following the tickets `<ScrollView>`.
- Because `<ScrollView>` and `<View className="flex-1">` were siblings in a vertical flexbox without overlay positioning, the tickets list consumed the upper portion of the screen and pushed the form container into the bottom sliver of the display.
- **Missing Modal Container**: It was not wrapped in React Native's `<Modal>`, preventing it from rendering in its own top-level window above the screen content.
- **Missing Keyboard Avoidance**: The sheet lacked a `<KeyboardAvoidingView>` and backdrop touch handler, causing the native soft keyboard to occlude inputs.

---

## 2. Changes Implemented

### 2.1 Native Modal Window Wrapper (`app/(app)/alumni/support.tsx`)
Replaced the inline conditional `<View>` with React Native's native `<Modal>`:
```tsx
<Modal
  visible={showCreate}
  transparent
  animationType="slide"
  onRequestClose={() => setShowCreate(false)}
  statusBarTranslucent
>
```
- Ensures the sheet slides up smoothly over the entire viewport as a true overlay.
- Does not compete for flexbox space with the tickets list behind it.

### 2.2 Platform-Aware Keyboard Avoidance
Wrapped modal contents in `<KeyboardAvoidingView>`:
```tsx
<KeyboardAvoidingView
  behavior={Platform.OS === "ios" ? "padding" : undefined}
  className="flex-1"
>
```
- **Android**: Respects `android:windowSoftInputMode="adjustResize"` without double-offsetting or glitching.
- **iOS**: Uses `behavior="padding"` to fluidly lift the bottom sheet above the keyboard.

### 2.3 Backdrop Touch Dismissal
Added an outer touchable backdrop to effortlessly dismiss the sheet:
```tsx
<TouchableWithoutFeedback onPress={() => setShowCreate(false)}>
  <View className="flex-1" />
</TouchableWithoutFeedback>
```

### 2.4 Bottom Clearance & Form Polish
- Set `max-h-[88%]` with `contentContainerStyle={{ paddingBottom: 40 }}` on the inner form `ScrollView`.
- Added `keyboardShouldPersistTaps="handled"` so taps on buttons and category chips register immediately even while the keyboard is visible.
- Added light haptic feedback (`Haptics.impactAsync`) when toggling category chips.
- Added loading state indicator to the Submit button.
- Added `className="flex-1"` to the main tickets `<ScrollView>`.

---

## 3. Verification & Quality Assurance

- **TypeScript Compilation:** `npx tsc --noEmit` passed with **0 errors**.
- **Linting:** `npm run lint` passed with **0 errors** (0 errors/warnings in `support.tsx`).
- **Log Entry:** Recorded in `logs/errors.log` under `[UI_MODAL_LAYOUT]`.
