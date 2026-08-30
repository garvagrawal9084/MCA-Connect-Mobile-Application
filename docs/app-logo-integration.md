# 🎓 App Logo & University Branding Integration

## 1. Overview & Objective

This document records the integration of the official **SCIS / University of Hyderabad emblem (`logo.png`)** across the **SCIS Connect Mobile** application.

In accordance with `app/AGENTS.md` guidelines and image centralization conventions, all static images are managed centrally through `constants/images.ts` and consumed cleanly across the presentation and routing layers.

---

## 2. Updated Asset Map & Configurations

### A. Centralized Image Asset Export (`constants/images.ts`)

```typescript
/**
 * SCIS Connect Mobile - Centralized Image Assets
 */
import logo from "@/assets/images/logo.png";
import appIcon from "@/assets/images/icon.png";
import splashIcon from "@/assets/images/splash-icon.png";
import androidIconForeground from "@/assets/images/android-icon-foreground.png";

export const images = {
  logo,
  appIcon,
  splashIcon,
  androidIconForeground,
};

export default images;
```

### B. Expo App Manifest (`app.json`)

Updated app metadata to bind `assets/images/logo.png` for app icons, splash screens, Android adaptive foregrounds, and web favicons:

```json
{
  "expo": {
    "name": "SCIS-CONNECT",
    "slug": "SCIS-CONNECT",
    "icon": "./assets/images/logo.png",
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#ffffff",
        "foregroundImage": "./assets/images/logo.png"
      }
    },
    "web": {
      "favicon": "./assets/images/logo.png"
    },
    "plugins": [
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/logo.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#ffffff"
        }
      ]
    ]
  }
}
```

---

## 3. Screen Integrations

### 1. App Launch & Bootstrapping (`app/index.tsx`)
- Replaced the generic Ionicons school placeholder with the high-resolution University emblem `<Image source={images.logo} />` wrapped in an animated Reanimated pulse container with smooth spring scaling.
- Configured a crisp white / slate card container with rounded corners and subtle shadow.

### 2. Student Login Screen (`app/(auth)/login.tsx`)
- In the top card header, replaced the placeholder icon with `<Image source={images.logo} className="w-14 h-14" resizeMode="contain" />`.
- Retained interactive spring/jiggle feedback on press (`triggerBadgeJiggle`).

### 3. Forgot Password Screen (`app/(auth)/forgot-password.tsx`)
- Synchronized top header identity badge to display the official emblem for consistent branding across authentication flows.

### 4. Spaces Hub Landing Page (`app/(app)/(tabs)/index.tsx`)
- Enhanced the bottom university verification badge (`School of Computer and Information Sciences · UoH`) with `<Image source={images.logo} className="w-4 h-4 mr-1.5" />`.

---

## 4. Verification & Quality Assurance

- **TypeScript Verification**: Ran `npx tsc --noEmit` — passed with 0 errors.
- **Image Import Standard**: All screens strictly consume `images.logo` via `@/constants/images`.
