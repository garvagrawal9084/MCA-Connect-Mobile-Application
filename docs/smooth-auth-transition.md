# SCIS Connect Mobile — Smooth Auth Transition (Login ↔ Forgot Password)

> **Document Created:** Sunday, August 23, 2026 (`2026-08-23T22:43:00+05:30`)  
> **Module:** Navigation & Authentication (`(auth)/_layout`, `(auth)/login`, `(auth)/forgot-password`)  
> **Status:** Completed & Validated  
> **Conformity:** Strict adherence to [app/AGENTS.md](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/app/AGENTS.md) and [expo-animation skill](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/.agents/skills/expo-animation/SKILL.md)  

---

## 📋 Overview

This update delivers a seamless, native, and interactive transition flow between the **Login Screen** and the **Forgot Password Screen** within the `(auth)` route group.

---

## 🚀 Key Improvements & Mechanics

### 1. Native Stack Slide Transition & Interactive Gesture
- **Replaced Default Fade:** Upgraded from `animation: "fade"` to `animation: "slide_from_right"` with `animationDuration: 280`.
- **Interactive Swipe Back Gesture:** Enabled `gestureEnabled: true`, `gestureDirection: "horizontal"`, and `fullScreenGestureEnabled: true` in `app/(auth)/_layout.tsx`, allowing iOS and Android users to naturally swipe from the left edge to return to the Login screen.

### 2. UI-Thread Staggered Micro-Animations (`react-native-reanimated`)
- Configured cascading entrance animations (`FadeInDown.duration(280).springify().damping(20)`) for:
  1. Header Emblem and Academic Portal Badge
  2. Main Credential Form Card
  3. Support & IT Help Callout Box
  4. Security & Platform Footer
- Animations run strictly on the UI thread worklet runtime to guarantee 60fps/120fps fluid performance without JS thread contention.

### 3. State & Context Preservation (Auto Email Transfer)
- When a user enters their email or Student ID into the Login screen and subsequently taps **Forgot Password?**, the identifier is automatically passed as a route query parameter (`params: { email: ... }`).
- The **Forgot Password** screen reads `useLocalSearchParams<{ email?: string }>()` and pre-populates the email field, eliminating redundant typing.

### 4. Interactive "Jiggly" & Error Shake Physics (Reanimated Worklets)
- **Validation Error Shake (Login & Forgot Password):** When submitting invalid credentials/email or encountering API errors, `triggerErrorShake()` executes an oscillating horizontal shake sequence (`withSequence(withTiming(-10), withTiming(10), withTiming(-8), withTiming(8), ...)`), delivering a responsive error bounce paired with haptic alerts.
- **Emblem Wobble / Jiggle (School & Key Emblems):** Tapping the school emblem on Login or the key emblem on Forgot Password screen triggers a rotational wobble (`badgeRotate` with `[-14deg, +14deg, -10deg, +10deg, -4deg, 0deg]`) paired with light tactile haptics.

### 5. Tactile Touch & Haptic Feedback (`expo-haptics`)
- Light haptic pulse (`Haptics.impactAsync(ImpactFeedbackStyle.Light)`) when triggering navigation buttons ("Forgot Password?" and "Back to Sign In").
- Selection haptic (`Haptics.selectionAsync()`) for "Remember me" checkbox toggling.
- Action feedback (`Haptics.impactAsync(ImpactFeedbackStyle.Medium)`) on primary submission, paired with success / error notification feedback.

### 5. Keyboard Dismissal Prior to Transition
- Calling `Keyboard.dismiss()` prior to navigation prevents soft-keyboard jitter or visual layout jumps while the slide animation is executing.

---

## 📁 Modified Files

```text
SCIS-Connect-Mobile/
├── app/
│   └── (auth)/
│       ├── _layout.tsx               # Native slide transition & gesture configuration
│       ├── login.tsx                 # Staggered entrance, keyboard dismiss, haptics, email param pass
│       └── forgot-password.tsx       # Param reader, prefill, staggered entrance, haptic back navigation
│
└── docs/
    └── smooth-auth-transition.md     # Technical implementation documentation
```

---

## ✅ Quality & Verification Checks

- **TypeScript Typecheck:** `npx tsc --noEmit` passed with 0 errors.
- **ESLint Validation:** `npm run lint` passed with 0 warnings.
- **Expo Architecture:** Conforms with React Native New Architecture and Reanimated 4 Worklets conventions.
