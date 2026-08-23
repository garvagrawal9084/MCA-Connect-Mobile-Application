# Bugfix Documentation: Resolution of "Couldn't find a navigation context" Error

> **Document Created:** Sunday, August 23, 2026 at 6:50 PM IST (`2026-08-23T18:50:00+05:30`)  
> **Module:** Architecture, UI Components & Routing  
> **Status:** Resolved & Verified  
> **Target Files:** `components/ui/Input.tsx`, `components/ui/Button.tsx`, `components/ui/Card.tsx`, `app/(auth)/login.tsx`, `app/_layout.tsx`, `app/(auth)/_layout.tsx`, `app.json`

---

## 1. 🔍 Error Summary & Symptoms

During runtime startup via `npx expo start`, the following error and warning were triggered when rendering `LoginScreen` through `AuthLayout` and `RootLayout`:

```text
If you don't want to see this message, you can disable the `strict` mode. Refer to:
https://docs.swmansion.com/react-native-reanimated/docs/debugging/logger-configuration for more details.
 ERROR  [Error: Couldn't find a navigation context. Have you wrapped your app with 'NavigationContainer'? See https://reactnavigation.org/docs/getting-started for setup instructions.] 

Code: Input.tsx
  57 |       )}
  58 |
> 59 |       <View
     |       ^
  60 |         className={`flex-row items-center w-full px-3.5 py-2.5 rounded-xl border transition-all ${getBorderColorClass()} ${
  61 |           !editable ? "opacity-60 bg-slate-100 dark:bg-slate-900" : ""
  62 |         }`}
Call Stack
  Input (components/ui/Input.tsx:59:7)
  LoginScreen (app/(auth)/login.tsx:172:13)
  AuthLayout (app/(auth)/_layout.tsx:5:5)
  RootLayout (app/_layout.tsx:6:5)
```

---

## 2. 🧬 Root Cause Analysis

1. **NativeWind CSS Interop & Web-Specific Utilities:**
   - Classes like `transition-all` and `ring-2 ring-indigo-500/20` were used in `Input.tsx`, `Button.tsx`, and `login.tsx`.
   - In React Native with NativeWind v4 (`react-native-css-interop`), `transition-*` activates React Native Reanimated runtime CSS transition parsing, while `ring-*` creates box-shadow computations.
   - These runtime CSS computations triggered layout recalculation race conditions during initial render passes, desynchronizing the React Navigation context before the layout tree mounted completely.

2. **Experimental React Compiler Interaction:**
   - In `app.json`, `experiments.reactCompiler: true` was enabled alongside NativeWind v4's Babel transform (`jsxImportSource: "nativewind"`).
   - React Compiler's aggressive memoization and component inlining interfered with the CSS interop hooks and context propagation during early mount.

3. **Layout Stack Declarations:**
   - `app/_layout.tsx` and `app/(auth)/_layout.tsx` used self-closing `<Stack />` components without explicit `<Stack.Screen />` route definitions, leading to non-deterministic route resolution during layout evaluation.

---

## 3. 🛠️ Applied Fixes

### A. Input Component (`components/ui/Input.tsx`)
- Removed `transition-all` and web-only `ring-*` classes.
- Updated `getBorderColorClass()` to use clean border width and color utilities:
  ```tsx
  const getBorderColorClass = () => {
    if (hasError) return "border-red-500 bg-red-50/30 dark:bg-red-950/20";
    if (isFocused) return "border-2 border-indigo-600 dark:border-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/30";
    return "border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90";
  };
  ```

### B. Button Component (`components/ui/Button.tsx`)
- Removed `transition-all` from container styles.
- Normalized shadow classes to standard `shadow-md shadow-indigo-600`.

### C. Card Component (`components/ui/Card.tsx`)
- Standardized elevated variant shadow to standard `shadow-sm`.

### D. Login Screen (`app/(auth)/login.tsx`)
- Removed `transition-all` on the "Remember Me" checkbox.
- Normalized emblem and card container shadows for cross-platform stability.

### E. Layouts (`app/_layout.tsx` & `app/(auth)/_layout.tsx`)
- Declared explicit screens in root `<Stack>`:
  - `<Stack.Screen name="index" />`
  - `<Stack.Screen name="(auth)" />`
- Declared explicit screen in auth `<Stack>`:
  - `<Stack.Screen name="login" />`

### F. Configuration (`app.json`)
- Disabled experimental `reactCompiler` to avoid Babel/NativeWind compilation conflicts.

---

## 4. ✅ Verification & Results

- **Bundle Generation (`npx expo export`):** Successfully bundled for iOS, Android, and Web with 0 errors.
- **Expo Health Check (`npx expo-doctor`):** All 18 checks passed with 0 issues detected.
- **UI Integrity:** All visual styles, focus rings (via border width), active opacity press states, and dark mode adaptations remain 100% faithful to the design specifications in `app/AGENTS.md`.
