# 🚫 Zero Dummy Data & Live API Fallback Policy

## Overview
This document specifies the data integrity architecture and empty-state patterns across SCIS Connect Mobile. All mock/dummy datasets have been completely removed from production screens and components. When backend data is absent, components render informative, clean empty states rather than fictitious fallback records.

---

## 1. Components Cleaned

### [`components/placement/PlacementDetailModal.tsx`](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/components/placement/PlacementDetailModal.tsx)
- **Coding Sprints / Challenges**:
  - Removed `MOCK_CHALLENGES` fallback list and difficulty filter tabs.
  - When `liveChallenges` is empty (`hasLiveChallenges === false`), renders a clean "No Coding Challenges Available" empty state card with `code-slash-outline` icon.
- **Scorecards & Assessment Results**:
  - Removed `MOCK_TESTS.length` and hardcoded static score percentages (`92.4%`, `96.4%`).
  - Metrics compute dynamically from `liveResults` (average accuracy, highest score, total tests completed). When empty, displays `0` tests and `0%`.
  - When `liveResults` is empty (`hasLiveResults === false`), renders the "No Assessment Results Yet" card with a refresh action button.
- **Leaderboard Standings**:
  - Removed `MOCK_LEADERBOARD` student records fallback.
  - When `liveLeaderboard` is empty (`hasLiveLeaderboard === false`), renders a clean "No Leaderboard Standings Yet" card with `trophy-outline` icon.
- **Daily Top Solvers**:
  - Dynamically displays daily solve stats from `GET /api/challenges/:id/daily-max` (or `/daily-m`).
  - When `dailyMaxRecords` is empty (`hasDailyMaxRecords === false`), renders the "No Daily Solves Yet" state with `flame-outline` icon.
- **Placement Center Drives**:
  - Removed `MOCK_DRIVES` fallback list.
  - Connected to live `jobs` from `usePlacementCenterStore`. When empty, renders "No Placement Drives Posted".
- **Verified Certificates**:
  - Removed `MOCK_CERTIFICATES` fallback list.
  - Connected to live certificates from `useCertificates`. When empty, renders "No Certificates Earned Yet".

### [`features/profile/hooks.ts`](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/features/profile/hooks.ts) & [`features/profile/types.ts`](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/features/profile/types.ts)
- Removed `DUMMY_PROFILE_DATA` constant and `isUsingDummyFallback` property.
- Profile strictly represents authenticated user profile state from `/api/auth/me`.

### [`features/placement/mockData.ts`](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/features/placement/mockData.ts)
- Completely deprecated and cleared all mock arrays (`MOCK_CHALLENGES`, `MOCK_TESTS`, `MOCK_LEADERBOARD`, `MOCK_DRIVES`, `MOCK_CERTIFICATES`).

---

## 2. Empty State Visual Standard

Every empty state conforms to the unified UI style:
```tsx
<View className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 items-center my-2">
  <Ionicons name={iconName} size={32} color="#64748B" />
  <Text className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-2">
    {title}
  </Text>
  <Text className="text-xs text-slate-400 text-center mt-1 leading-5">
    {description}
  </Text>
</View>
```

---

## 3. Verification & Compliance
- `npx tsc --noEmit`: **0 errors**.
- Full test pass across all feature areas.
