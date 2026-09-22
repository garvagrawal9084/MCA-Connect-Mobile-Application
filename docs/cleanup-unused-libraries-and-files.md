# SCIS Connect Mobile — Cleanup of Unused Libraries & Legacy Components

> **Document Created:** Tuesday, September 22, 2026 (`2026-09-22T23:28:00+05:30`)  
> **Release Version:** `v2.1.1`  
> **Module:** Workspace, Dependency & Architecture Maintenance  
> **Conformity:** Strict adherence to [app/AGENTS.md](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/app/AGENTS.md) guidelines  

---

## 📋 Overview

In accordance with [app/AGENTS.md](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/app/AGENTS.md), an audit was executed across all dependencies, modules, and repository files to eliminate redundant libraries, obsolete stubs, and unused legacy components without affecting runtime functionality, native builds, or OTA update capabilities.

---

## 🗑️ Removed Unused Libraries (`package.json`)

The following packages were verified to have zero imports, no references in configuration manifests (`app.json`, `babel.config.js`, `metro.config.js`), and were safely uninstalled:

| Package | Version | Rationale |
| :--- | :--- | :--- |
| `expo-image-picker` | `~57.0.19` | Unused in the mobile app. Student avatar and profile pictures are served via existing backend image URLs. Not declared in `app.json` plugins. |
| `expo-symbols` | `~57.0.3` | Unused. Iconography across all screens utilizes `@expo/vector-icons` (`Ionicons`). |
| `@react-navigation/bottom-tabs` | `^7.4.0` | Redundant top-level dependency. Bottom tab routing is powered directly by `expo-router` (`Tabs`). |
| `@react-navigation/elements` | `^2.6.3` | Redundant top-level boilerplate dependency; zero imports in codebase. |
| `@react-navigation/native` | `^7.1.8` | Redundant top-level dependency. Routing primitives and navigation containers are abstracted by Expo Router. |
| `expo-system-ui` | `~57.0.4` | Zero imports in the codebase; not registered in `app.json` plugins; system UI appearance is handled natively by `userInterfaceStyle` and `expo-status-bar`. |

---

## 🛡️ Preserved Essential Packages

The following packages were retained as critical dependencies:
- **`expo-updates`**: Required for OTA updates via EAS Update (`npx eas update --channel production`).
- **`react-native-screens`**, **`react-native-gesture-handler`**, **`react-native-safe-area-context`**, **`react-native-reanimated`**, **`expo-linking`**: Required peer dependencies of Expo Router and gesture/animation subsystems.
- **`react-dom`**, **`react-native-web`**: Required for web bundler scripts and static export runtime.
- **`react-native-worklets`**: Required by `react-native-reanimated@4.5.1`.

---

## 🗑️ Removed Unused Components & Repository Files

| Item | Path | Type | Rationale |
| :--- | :--- | :--- | :--- |
| `AlumniFilterChips.tsx` | `components/alumni/AlumniFilterChips.tsx` | React Component | Unused legacy filter chip component. Active alumni screens use custom inline tags and native search filters. |
| `PostCard.tsx` | `components/alumni/PostCard.tsx` | React Component | Unused legacy card component. Community and forum feeds render specialized post cards (`ForumTopicCard.tsx`, inline cards). |
| `download-bundle.py` | `scripts/download-bundle.py` | Python Script | Deprecated temporary helper script. |
| `test_chunk.bin` | Root directory | Binary file | Temporary test chunk. |
| `scis-connect-v2.1.0.aab` | Root directory | Binary archive (80.7 MB) | Build artifact in project root. Clean, verified production AAB was validated and saved directly to `~/Downloads/scis-connect-v2.1.0.aab`. |
| `dist/` | Root directory | Build directory | Static web export directory containing temporary HTML/JS build outputs. |

---

## 📦 Version Bump

- **`package.json`**: Bumped `version` to `2.1.1`.
- **`app.json`**: Bumped `expo.version` to `2.1.1`.

---

## ✅ Verification & Health Checks

- **Expo Doctor:** `npx expo-doctor` passed **21/21 checks** with zero issues.
- **TypeScript:** `npx tsc --noEmit` compiled with **0 errors**.
- **AAB Integrity:** `unzip -t ~/Downloads/scis-connect-v2.1.0.aab` validated with **0 errors** across all 1,483 files.
