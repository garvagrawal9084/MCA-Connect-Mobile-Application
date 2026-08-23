# MCA Connect Mobile — Setup & Progress Documentation

> **Document Created:** Sunday, August 23, 2026 at 4:28 PM IST (`2026-08-23T16:28:11+05:30`)  
> **Framework:** Expo SDK 54 (`~54.0.36`) • React Native `0.81.5` • React `19.1.0`  
> **Styling Engine:** NativeWind v4 (`^4.2.6`) + Tailwind CSS v3 (`~3.4.17`)  
> **Router:** Expo Router v6 (`~6.0.24`)  

---

## 📋 Overview

This document records the foundational configuration and progress for the **MCA Connect Mobile Application**. The styling layer has been initialized with **NativeWind v4** and **Tailwind CSS v3**, enabling utility-first styling across iOS, Android, and Web with full TypeScript support.

---

## 📦 Installed Packages & Dependencies

| Package | Version | Description |
| :--- | :--- | :--- |
| `nativewind` | `^4.2.6` | Tailwind CSS utility compiler for React Native |
| `tailwindcss` | `~3.4.17` | Utility-first CSS framework |
| `react-native-reanimated` | `~4.1.1` | Native-driven animation library |
| `react-native-safe-area-context` | `~5.6.0` | Inset handling for modern device safe areas |
| `react-native-screens` | `~4.16.0` | Native navigation screen primitives |
| `expo-router` | `~6.0.24` | File-based routing for Expo and React Native |

---

## ⚙️ Configuration Files Setup

### 1. `tailwind.config.js`
Configures Tailwind content scanning paths and registers the NativeWind preset.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./features/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

---

### 2. `babel.config.js`
Configures JSX runtime import source for NativeWind and registers the NativeWind Babel preset.

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
```

---

### 3. `metro.config.js`
Wraps Expo's Metro configuration with `withNativeWind` to process `./global.css`.

```javascript
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./global.css" });
```

---

### 4. `global.css`
Declares the base Tailwind directives for the application.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

### 5. `nativewind-env.d.ts` & `tsconfig.json`
Provides TypeScript definitions for `className` attributes on React Native components.

**`nativewind-env.d.ts`**:
```typescript
/// <reference types="nativewind/types" />
```

**`tsconfig.json`** (`include` array updated):
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    ".expo/types/**/*.ts",
    "expo-env.d.ts",
    "nativewind-env.d.ts"
  ],
  "exclude": ["app-example"]
}
```

---

### 6. `app.json`
Ensures Metro bundler is explicitly assigned for web platform builds.

```json
{
  "expo": {
    "web": {
      "bundler": "metro",
      "output": "static"
    }
  }
}
```

---

### 7. `app/_layout.tsx`
Imports the global stylesheet at the root level of the app.

```tsx
import "../global.css";
import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack />;
}
```

---

### 8. `app/index.tsx` (Verification Screen)
Demonstrates NativeWind styling with responsive dark/light mode support.

```tsx
import { Text, View } from "react-native";

export default function Index() {
  return (
    <View className="flex-1 justify-center items-center bg-white dark:bg-black">
      <Text className="text-xl font-bold text-gray-900 dark:text-white">
        Edit app/index.tsx to edit this screen.
      </Text>
    </View>
  );
}
```

---

## 🚀 Development Commands

| Command | Purpose |
| :--- | :--- |
| `npm run start` | Starts the Expo development server |
| `npx expo start -c` | Starts Expo while clearing the Metro cache (recommended after styling/config changes) |
| `npm run android` | Launches the app on connected Android device/emulator |
| `npm run ios` | Launches the app on iOS simulator |
| `npm run web` | Launches the web preview |
| `npm run lint` | Runs ESLint across the codebase |

---

## 💡 Notes & Best Practices

- **Metro Cache:** Whenever making modifications to `tailwind.config.js`, `babel.config.js`, or `global.css`, restart the bundler using `npx expo start -c`.
- **Component Folder Structure:** Place reusable UI primitives inside `./components/ui/` and feature-specific modules in `./features/` to maintain clean boundaries and automatic Tailwind scanning.
