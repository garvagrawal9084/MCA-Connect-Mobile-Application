# 📱 MCA-Connect (SCIS Connect) Mobile App

The official mobile app for students of the **School of Computer and Information Sciences (SCIS), University of Hyderabad**. It brings career preparation and the SCIS community into one app: a placement hub with live job alerts and coding-challenge reminders, an alumni network directory, real-time notifications and a student profile.

Built with **React Native and Expo**, with file-based routing, NativeWind (Tailwind CSS) styling and push notifications.

![Expo](https://img.shields.io/badge/Expo-SDK_57-000020?logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-0.86-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![NativeWind](https://img.shields.io/badge/NativeWind-4-38BDF8?logo=tailwindcss&logoColor=white)
![Platforms](https://img.shields.io/badge/Platforms-Android%20%7C%20iOS-green)

## Features

- **Authentication:** student login with the session stored securely on the device (`expo-secure-store`)
- **Home hub:** a personalized welcome screen with two spaces, Placement Studio and Alumni Network
- **Placement Center:**
  - Browse published job openings and view job details
  - Automatic background sync checks for new jobs, including when the app is closed
  - Daily **LeetCode reminders** that open the placement challenges screen
- **Alumni Network:** a directory to explore and connect with SCIS alumni
- **Smart notifications:**
  - Push notifications through Expo, with an in-app banner when the app is open
  - Unread-count badge on the notifications tab
  - Tapping a notification deep-links to the right screen, such as a specific job
  - Delivery and open events are reported back for admin broadcast statistics
- **Profile:** view and manage student details, with avatar support
- **Certificates:** save verified certificates to the photo gallery
- **Dark mode:** follows the system theme automatically
- **Over-the-air updates:** ship fixes instantly with `expo-updates` and EAS Update

## Tech Stack

| Area | Technology |
| --- | --- |
| Framework | React Native 0.86, React 19, Expo SDK 57 |
| Language | TypeScript |
| Navigation | Expo Router (file-based routing, typed routes) |
| Styling | NativeWind 4 + Tailwind CSS |
| State management | Zustand |
| Animations | React Native Reanimated, Gesture Handler |
| Notifications | expo-notifications, expo-background-fetch, expo-task-manager |
| Storage and security | expo-secure-store |
| Build and release | EAS Build, EAS Update |
| Services | Firebase (Android push via `google-services.json`) |

## Project Structure

```
MCA-Connect-Mobile-Application/
├── app/                # Screens and routes (Expo Router)
│   ├── (auth)/         # Login and authentication screens
│   └── (app)/          # Main app: tabs (Home, Placement, Notifications, Profile), alumni, placement center
├── components/         # Reusable UI components (home cards, notification banner, ui/)
├── features/           # Feature modules (auth, placement, notifications): stores, APIs, watchers
├── services/           # Notification engine, background tasks, secure storage
├── constants/          # App constants and image assets
├── types/              # Shared TypeScript types
├── utils/              # Helpers such as the logger
├── assets/             # Images, icons and fonts
├── docs/               # Project documentation
├── scripts/            # Build and patch scripts
├── app.json            # Expo configuration
├── eas.json            # EAS build profiles
└── tailwind.config.js  # Tailwind / NativeWind theme
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- [Expo CLI](https://docs.expo.dev/get-started/installation/) via `npx expo`
- Android Studio (emulator) and/or Xcode (iOS simulator), or a physical device
- For push notifications and EAS builds, an [Expo account](https://expo.dev)

### Installation

```bash
git clone https://github.com/garvagrawal9084/MCA-Connect-Mobile-Application.git
cd MCA-Connect-Mobile-Application
npm install
```

A `postinstall` script (`scripts/patch-expo-notifications.js`) applies a small patch to `expo-notifications` automatically.

### Run the app

```bash
npx expo start          # start the dev server
npm run android         # build and run on an Android device or emulator
npm run ios             # build and run on an iOS simulator
npm run web             # run in the browser
```

> Push notifications and background tasks are limited in **Expo Go**. Use a [development build](https://docs.expo.dev/develop/development-builds/introduction/) (`npm run android` or `npm run ios`) to test the full notification flow.

### Backend configuration

The app talks to the SCIS Connect backend API for authentication, jobs, alumni and notifications. Point the app at your backend by setting the API base URL in the services/constants layer, and add your own `google-services.json` from the Firebase console for Android push notifications.

## Building for Release

Build profiles are defined in `eas.json`:

| Profile | Purpose |
| --- | --- |
| `development` | Development client, internal distribution |
| `preview` | Internal-distribution Android APK for testers |
| `production` | Store-ready build with auto-incrementing version |

```bash
npm install -g eas-cli
eas login

eas build --profile preview --platform android      # shareable APK
eas build --profile production --platform all       # store builds
eas update --channel production                     # push an OTA update
```

App identifiers: `com.scis.connect` (Android package and iOS bundle ID).

## Scripts

| Command | Description |
| --- | --- |
| `npm start` | Start the Expo dev server |
| `npm run android` | Run on Android |
| `npm run ios` | Run on iOS |
| `npm run web` | Run on web |
| `npm run lint` | Lint the project with Expo's ESLint config |

## Roadmap

- [ ] Add screenshots and a demo video to this README
- [ ] Add automated tests (unit and E2E)
- [ ] Add offline caching for jobs and alumni
- [ ] Publish to the Google Play Store and App Store

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes and push the branch
4. Open a pull request

## Author

**Garv Agrawal**: [GitHub](https://github.com/garvagrawal9084)

## License

No license has been specified yet. Add a `LICENSE` file to define how others may use this project.
