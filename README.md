# SCIS Connect (MCA Connect Mobile Application)

A cross-platform mobile app for students of the School of Computer and Information Sciences (SCIS). It brings campus placements, the alumni network, coding challenges, results, and notifications into one app, backed by the SCIS Connect REST API.

Built with **React Native, Expo (SDK 57), and TypeScript**. Runs on Android and iOS, with a web target through Expo.

---

## Features

### Authentication
- Login with email and password, plus a forgot-password and OTP reset flow
- Session persistence ("remember me") using secure storage, with silent token refresh when the app starts
- Automatic token refresh and retry on expired sessions

### Placement Center
- Browse jobs and internships with search, job type, work mode, and "closing soon" filters
- Job detail view with eligibility information, an apply flow, and official apply links
- Save/bookmark jobs, set deadline reminders, and track your applications
- Dashboard stats: open jobs, internships, new this week, applications, saved, and reminders
- Interview experiences shared by seniors and peers
- Tests and results from the Placement Studio, including result analysis

### Alumni Network
- Alumni directory with search and filter chips
- Mentors, companies, batches, events, community forum topics, and referrals
- Follow list, alumni profiles, and a support / contact screen

### Challenges and Certificates
- Coding challenges with a live leaderboard and daily-max solvers
- Join challenges and track your score and rank
- Digital certificates with a verification link

### Notifications
- Push notifications through Expo Notifications (FCM on Android)
- In-app notification banners and a notification center with read/unread sync
- Per-category notification settings
- Real-time job-posted alerts
- Background tasks (Expo Background Fetch and Task Manager) and native Android alarm scheduling for streak reminders, so reminders arrive even when the app is closed

### Profile
- Section-based profile editing: bio, contact, education, skills and links

---

## Tech Stack

| Area | Technology |
| :--- | :--- |
| Framework | React Native 0.86, Expo ~57, React 19 |
| Language | TypeScript |
| Routing | Expo Router (file-based routing) |
| State management | Zustand |
| Styling | NativeWind v4 (Tailwind CSS) |
| Animation / gestures | React Native Reanimated, Gesture Handler |
| Notifications | Expo Notifications, Expo Background Fetch, Expo Task Manager |
| Secure storage | Expo Secure Store |
| Builds and updates | EAS Build, Expo Updates |

---

## Project Structure

```
app/                 Screens and routes (file-based routing)
  (auth)/            Login and forgot password
  (app)/
    (tabs)/          Home, Placement, Notifications, Profile
    alumni/          Alumni network screens
    placement/       Placement center and tests
components/          Reusable UI (alumni, home, notifications, placement, profile, ui)
features/            Feature modules, each with api, store, hooks, and types
  alumni/ auth/ challenges/ notifications/ placement/ profile/ results/
services/            API client, storage, and the notification engine
constants/           API config, colors, theme
utils/               Logger and URL helpers
docs/                Implementation notes for each feature and fix
scripts/             Postinstall patch for expo-notifications
```

### Architecture

Each feature is split into four layers. Screens call hooks, hooks read and update a Zustand store, and the store calls the feature's API module. All HTTP goes through one API client in `services/api.ts`, which handles timeouts, auth headers, cookies, and token refresh.

```
Screen -> hooks -> Zustand store -> feature api -> services/api.ts -> backend
```

---

## Getting Started

### Prerequisites
- Node.js 20 or later
- npm
- Android Studio (Android) or Xcode (iOS) for native builds
- An Expo account, if you want to use EAS Build

### Install

```bash
git clone https://github.com/garvagrawal9084/MCA-Connect-Mobile-Application.git
cd MCA-Connect-Mobile-Application
npm install
```

### Run

```bash
npm start            # start the Expo dev server
npm run android      # build and run on Android
npm run ios          # build and run on iOS
npm run web          # run the web target
```

Push notifications and background tasks do not work in Expo Go. Use a development build (`npm run android` or `npm run ios`) to test them.

### Configuration

API endpoints are defined in `constants/config.ts` (`API_CONFIG.BASE_URL` and `ENDPOINTS`). Point `BASE_URL` at your own backend to run against a different environment.

Android push notifications need a Firebase `google-services.json`, referenced from `app.json`.

### Lint

```bash
npm run lint
```

---

## Documentation

The `docs/` folder holds implementation notes for individual features and bug fixes. Good starting points:

- `placement-center-implementation.md`: placement endpoints and screens
- `alumni-network-implementation.md`: alumni architecture
- `challenges-and-certificates-integration.md`: challenges, leaderboard, certificates
- `device-token-registration-and-push-architecture.md`: push notification setup
- `auth-persistence-and-refresh-bootstrap.md`: session handling
- `closed-app-native-alarm-streak-reminder.md`: reminders when the app is closed
- `google-play-store-build-guide.md`: building for the Play Store

---

## Author

**Garv Agrawal**: [GitHub](https://github.com/garvagrawal9084) · [LinkedIn](https://www.linkedin.com/in/garv-agrawal-b11a14318/)
