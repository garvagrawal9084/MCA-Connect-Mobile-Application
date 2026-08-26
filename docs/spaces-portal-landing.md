# Spaces Portal Landing Page Documentation

> **Status:** Implemented  
> **Conformity:** Strict adherence to [app/AGENTS.md](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/app/AGENTS.md)  
> **Target Screen:** `app/(app)/(tabs)/index.tsx` (Home / Post-Login Space Gateway)

---

## 1. Overview & Purpose

Following student authentication, users land on the **SCIS Spaces Hub** (`app/(app)/(tabs)/index.tsx`). This screen serves as the primary gateway connecting students to the two core pillars of the SCIS Connect ecosystem:

1. **Placement Studio:** Career acceleration, coding challenges, assignment tests, and placement metrics.
2. **Alumni Network:** Cross-cohort alumni directory, mentorship, events, and networking beyond the campus.

---

## 2. UI/UX Specifications & Visual Hierarchy

The interface strictly replicates the provided design specifications with mobile-first responsiveness and dark-mode adaptation:

### 2.1 Header Section
- **Personalized Greeting:** `Welcome, {FIRST_NAME}.` (e.g. `Welcome, GARV.`) styled with heavy font weight (`font-black`) in dark slate.
- **Hero Hook:** `Your next chapter starts here.` in signature University Crimson (`#B91C1C` / `#8B0000`).
- **Tagline:** *"Two spaces, one community. Move between career preparation and your SCIS network whenever you like."*

### 2.2 Placement Studio Card (`components/home/PlacementStudioCard.tsx`)
- **Outer Frame:** High-radius container (`rounded-[28px]`) with soft crimson border and subtle shadow.
- **Top Crimson Banner:**
  - Header: `SCIS PLACEMENTS · 2024–25` with `69 placed ✓` pill badge.
  - Interactive mini bar chart visualization displaying placement metrics across programmes:
    - **IMT:** 20
    - **MCS:** 14
    - **MAI:** 8
    - **MCA:** 27 (Peak)
  - Footer: `Highest reported package` paired with `₹46 LPA`.
- **Card Body:**
  - Eyebrow: `BUILD YOUR NEXT MOVE` in uppercase bold crimson.
  - Title: `Placement studio`.
  - Body copy: *"Solve challenges, measure your progress, and arrive interview-ready."*
  - Pills: `Assignments & tests`, `Coding challenges`.
  - Action: Primary filled crimson button `Start preparing ↗` navigating directly to `/(app)/(tabs)/placement`.

### 2.3 Alumni Network Card (`components/home/AlumniNetworkCard.tsx`)
- **Top Crimson Banner:**
  - Header: Graduation emblem with `THE SCIS COMMUNITY · Six computing programmes`.
  - Translucent quote box: *"From SCIS to the world — Alumni across leading universities, industry and entrepreneurship."*
- **Card Body:**
  - Eyebrow: `MEET YOUR COMMUNITY` in uppercase bold crimson.
  - Title: `Alumni network`.
  - Body copy: *"Find people, conversations, and opportunities beyond campus."*
  - Pills: `Alumni directory`, `Events & community`.
  - Action: Outlined button `Explore the network ↗` triggering the `AlumniCommunityModal`.

---

## 3. Component Architecture

```text
components/home/
├── PlacementStudioCard.tsx      # Card 1 with animated bar chart & CTA
├── AlumniNetworkCard.tsx        # Card 2 with community highlights & CTA
└── AlumniCommunityModal.tsx     # Sheet showcasing featured mentors & channels
```

---

## 4. Animation & Haptics

- **Entrance Transitions:** Fluid staggered `FadeInDown.springify()` from `react-native-reanimated`.
- **Bar Chart Growth:** Staggered `withDelay` + `withTiming` easing for each programme bar.
- **Haptic Feedback:**
  - Medium impact on `Start preparing`.
  - Light impact on `Explore the network`.
  - Success notification on joining alumni channels.

---

## 5. Session & State Integration

- Reads authenticated student info from Zustand `useAuthStore`.
- Supports instant Sign Out with confirmation dialog and cache evacuation.
- Full error/activity logging using `utils/logger.ts`.
