# Documentation: Alumni Network Under Construction Modal State

**Date:** 2026-08-26  
**Scope:** `components/home/AlumniCommunityModal.tsx`, `components/home/AlumniNetworkCard.tsx`, & `app/(app)/(tabs)/index.tsx`

---

## 1. Objective
Update the **Explore the network** interaction on the Home landing screen so that it clearly informs the student that the Alumni Network feature is **Under Construction / In Development** (replacing previous mock mentor placeholders in compliance with project rules in `app/AGENTS.md` which prohibit unverified mock data).

---

## 2. Changes Implemented

### A. Updated `components/home/AlumniCommunityModal.tsx`
- **Under Construction Status Banner:**
  - Added an Amber/Golden status alert box with a `Under Construction` badge and a clear message: `"The SCIS Alumni Network platform is actively being developed. Soon, you will be able to search the verified alumni directory, request mentorship, and discover career opportunities across 2,500+ SCIS graduates."`
- **Header & Iconography:**
  - Displayed an in-development badge with `<Ionicons name="construct" size={20} color="#D97706" />`.
  - Sub-header: `FEATURE IN DEVELOPMENT` · `Alumni Network`.
- **Upcoming Feature Preview / Roadmap:**
  - **Verified Alumni Directory:** Search and connect with alumni across MCA, MCS, IMT, MAI, and PhD cohorts.
  - **1-on-1 Mentorship & Referrals:** Request resume reviews, mock interviews, and internal referrals from senior alumni.
  - **Tech Talks & Community AMAs:** Participate in interactive industry sessions, webinars, and workshops.
  - **City & Global Hubs:** Join regional alumni networks across major tech hubs worldwide.
- **Collaborative Note & Action CTA:**
  - Added a footnote acknowledging collaboration with the SCIS Alumni Association.
  - Primary CTA button `"Got it, thanks!"` with smooth light haptics and dismiss behavior.

### B. Updated `components/home/AlumniNetworkCard.tsx`
- Added an amber tag pill: `Coming soon` alongside existing tags (`Alumni directory`, `Events & community`) to visually communicate feature status at a glance.

### C. Updated `app/(app)/(tabs)/index.tsx`
- Updated logger event to explicitly trace: `"Student opened Alumni Network Under Construction preview modal"`.

---

## 3. Verification & Compliance
- **TypeScript Check:** `npx tsc --noEmit` passed with 0 errors.
- **AGENTS.md Compliance:** Adheres to no-mock backend rule, utilizes NativeWind styling, supports dark mode, and logs actions systematically.
