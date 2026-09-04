# SCIS Connect Mobile — Asset & File Audit Cleanup Documentation

> **Document Created:** Thursday, September 3, 2026 (`2026-09-03T12:42:00+05:30`)  
> **Module:** Workspace & Repository Maintenance  
> **Conformity:** Strict adherence to [app/AGENTS.md](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/app/AGENTS.md) guidelines  

---

## 📋 Overview

A deep audit across all directories, configuration files (`app.json`, `babel.config.js`, `eas.json`, `package.json`, `tailwind.config.js`, `tsconfig.json`), source code (`app/`, `components/`, `features/`, `services/`, `constants/`, `utils/`), and build scripts was conducted to identify and safely remove redundant boilerplate assets, obsolete stubs, and unused files without affecting app runtime, native builds, or branding.

---

## 🗑️ Removed Unnecessary Files & Assets

| Item | Path / Location | Type | Rationale |
| :--- | :--- | :--- | :--- |
| `favicon.png` | `assets/images/favicon.png` | Image (48x48) | Unused Expo template favicon. `app.json` configures `"favicon": "./assets/images/logo.png"`. Never imported in code. |
| `icon.png` | `assets/images/icon.png` | Image (1024x1024) | Unused Expo template icon. `app.json` configures `"icon": "./assets/images/logo.png"`. Never used in any UI component. |
| `splash-icon.png` | `assets/images/splash-icon.png` | Image (1024x1024) | Unused Expo template splash icon. `app.json` splash plugin configures `"image": "./assets/images/logo.png"`. Never used in UI. |
| `android-icon-foreground.png` | `assets/images/android-icon-foreground.png` | Image (512x512) | Unused Expo template adaptive foreground icon. `app.json` adaptive icon configures `"foregroundImage": "./assets/images/logo.png"`. Never used in UI. |
| `mockData.ts` | `features/placement/mockData.ts` | TypeScript file | Deprecated mock data stub (`export {};`). Deprecated per zero-dummy-data policy in favor of live APIs. Not exported by `features/placement/index.ts`. |
| `AlumniCommunityModal.tsx` | `components/home/AlumniCommunityModal.tsx` | React component | Early "Under Construction" modal created prior to full Alumni implementation. The Alumni feature has since been fully built into `app/(app)/alumni/` (with 11 dedicated screens), and the home screen button directly navigates to `app/(app)/alumni`. Completely unreferenced. |
| `dist/` | `dist/` | Build directory | Static web export directory containing ~500KB of temporary `.html`/`.js` build outputs. Ignored in `.gitignore`. |

---

## 🛡️ Preserved Essential Assets

The following assets were verified as strictly required for production and were kept intact:
1. **`assets/images/logo.png`**: Official SCIS emblem (920x920) used for:
   - App icon (`app.json`)
   - Android adaptive icon foreground (`app.json`)
   - Web favicon (`app.json`)
   - Native splash screen image (`app.json`)
   - Push notification icon (`app.json`)
   - Auth gateway and login screens (`app/index.tsx`, `app/(auth)/login.tsx`, `app/(auth)/forgot-password.tsx`, `app/(app)/(tabs)/index.tsx`)
2. **`assets/images/android-icon-background.png`**: 512x512 background layer for Android adaptive icon (`app.json`).
3. **`assets/images/android-icon-monochrome.png`**: 432x432 monochrome layer for Android 13+ themed icons (`app.json`).

---

## 🛠️ Code Updates

### `constants/images.ts`
Updated to cleanly export only active application images:

```typescript
/**
 * SCIS Connect Mobile - Centralized Image Assets
 */
import logo from "@/assets/images/logo.png";

export const images = {
  logo,
};

export default images;
```

---

## ✅ Verification & Health Checks

- **TypeScript Compilation:** `npx tsc --noEmit` passed with **0 errors**.
- **ESLint:** `npm run lint` passed with **0 errors**.
- **Expo Bundler:** Validated that the asset map and module resolution are healthy.
