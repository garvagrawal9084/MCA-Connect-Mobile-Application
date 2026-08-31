# 🏆 Challenge Leaderboard & Daily Max Solvers API Integration

> **Document Created:** Monday, August 31, 2026 (`2026-08-31T01:34:00+05:30`)  
> **Module:** Challenges & Leaderboard (`features/challenges/*`), Placement Studio (`components/placement/PlacementDetailModal.tsx`)  
> **Backend Service:** SCIS Railway Backend (`/api/challenges/*`)  
> **Status:** Integrated & Type-Safe  
> **Conformity:** Strict adherence to [app/AGENTS.md](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/app/AGENTS.md)  

---

## 📌 Overview

This feature integrates live challenge leaderboard standings and top daily solver records from the SCIS backend into the **Placement Studio Leaderboard** modal.

Students can view overall batch standings or select a specific coding sprint to inspect live problem solves, points, and daily maximum performance metrics synced with LeetCode.

---

## 🌐 Backend API Contracts

| Route | HTTP Verb | Purpose | Response Format |
| :--- | :--- | :--- | :--- |
| `/api/challenges/:challengeId/leaderboard` | `GET` | Challenge-specific student standings | `{"success": true, "data": {"leaderboard": [{"rank": 1, "name": "...", "score": 100, "current": 10, "increase": 4, "roll_no": "25MCMC35"}]}}` |
| `/api/challenges/:challengeId/daily-max` (fallback `/daily-m`) | `GET` | Top daily problem solvers | `{"success": true, "data": {"dailyMax": [{"user": {...}, "leetcodeUsername": "...", "date": "...", "dailySolveCount": 5, "questions": [...]}]}}` |
| `/api/challenges/leaderboard` | `GET` | Global platform leaderboard | `{"success": true, "data": {"leaderboard": [...]}}` |

---

## 🏗️ Architecture & Component Layout

```text
features/challenges/
├── api.ts              # challengesApi.getChallengeLeaderboard & getChallengeDailyMax
├── store.ts            # useChallengeStore with normalized leaderboard & dailyMax state
├── hooks.ts            # useLeaderboard & useChallengeDailyMax hooks
├── types.ts            # LeaderboardEntry & DailyMaxRecord interfaces
└── index.ts            # Public barrel exports

components/placement/
└── PlacementDetailModal.tsx   # Sprint selector carousel + Standings & Daily Top Solvers tabs
```

---

## 💡 Key Features Implemented

1. **Sprint Selector Carousel**:
   - Allows instant toggling between `Global Standings` and specific active challenges (e.g. 30 Days DSA Sprint).
   - Reactive cache updates via Zustand.

2. **Dual-Tab Leaderboard View**:
   - **🏆 Leaderboard**: Ranked table with gold/silver/bronze podium badges, student roll number, current solved problems, score points, and `YOU` badge for the logged-in student.
   - **🔥 Daily Top Solvers**: Feed of highest problem solvers for each date with LeetCode handle, verified daily solve counts, and verified problem badges.

3. **Fallback & Resilience**:
   - Supports endpoint fallback from `/daily-max` to `/daily-m`.
   - Handles wrapped response envelopes (`{ leaderboard: [...] }`, `{ data: [...] }`, or direct arrays).
   - Graceful empty states when no daily solves exist yet.

---

## 🧪 Verification & Diagnostics

- **TypeScript Typecheck:** `npx tsc --noEmit` passed with 0 errors.
- **Logging Domains:** `CHALLENGES_API`, `CHALLENGE_STORE`, `CHALLENGES_UI` in `utils/logger.ts`.
