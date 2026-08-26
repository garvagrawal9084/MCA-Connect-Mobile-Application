# Documentation: Remove Top Banners from Home Hub Cards

**Date:** 2026-08-26  
**Scope:** `components/home/PlacementStudioCard.tsx` & `components/home/AlumniNetworkCard.tsx`

---

## 1. Objective
Remove the top crimson preview banners from both the **Placement Studio Card** (which previously showed the "SCIS PLACEMENTS Batch 2024–25" & "Highest Package ₹46 LPA" metric banner) and the **Alumni Network Card** (which previously showed "THE SCIS COMMUNITY Six computing programmes" & "From SCIS to the world" highlight banner) on the Home Hub screen (`app/(app)/(tabs)/index.tsx`).

---

## 2. Changes Made

### A. Modified `components/home/PlacementStudioCard.tsx`
- **Removed Crimson Top Banner:** Eliminated the nested header banner featuring batch placement count (`69 placed`) and package stats (`₹46 LPA`).
- **Streamlined Card Layout:**
  - Added a clean top header row containing the uppercase eyebrow text (`BUILD YOUR NEXT MOVE`) alongside an icon badge (`briefcase-outline`).
  - Retained title (`Placement studio`), description, tag pills (`Assignments & tests`, `Coding challenges`), and full-width primary CTA button (`Start preparing`).
  - Added balanced internal padding (`p-6`) and rounded borders for a clean card aesthetic.

### B. Modified `components/home/AlumniNetworkCard.tsx`
- **Removed Crimson Top Banner:** Eliminated the top banner with the community highlights ("Six computing programmes / From SCIS to the world").
- **Streamlined Card Layout:**
  - Added a clean top header row containing the uppercase eyebrow text (`MEET YOUR COMMUNITY`) alongside an icon badge (`school-outline`).
  - Retained title (`Alumni network`), description, tag pills (`Alumni directory`, `Events & community`), and secondary action button (`Explore the network`).
  - Added balanced internal padding (`p-6`) and clean card border matching the design system.

---

## 3. Verification
- `npx tsc --noEmit` executed with 0 errors.
- UI elements, dark mode compatibility, and interaction handlers (`Haptics`, navigation, and modal triggers) preserved.
