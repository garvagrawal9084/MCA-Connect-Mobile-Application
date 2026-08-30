# Navigation Color & Persistent Bottom Tab Bar Refinement

> **Module:** Core App Navigation (`app/(app)/(tabs)/_layout.tsx`, `components/placement/`, `notifications.tsx`)  
> **Status:** Completed & Verified  
> **Conformity:** Strict adherence to [app/AGENTS.md](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/app/AGENTS.md)  

---

## 1. Problem & Context

Previously, the navigation experience exhibited visual inconsistencies:
1. **Muddy Active Tab Color:** The tab bar active tint was configured as `#8B0000` (Dark Maroon). On small 22px stroke icons, `#8B0000` rendered with low saturation, appearing off-black or brownish-gray rather than conveying an active tab selection.
2. **Low-Contrast Inactive Tab Color:** Inactive tabs used `#94A3B8` (slate-400), which lacked contrast and crispness against white container backgrounds.
3. **Muddy Notification Badge:** The unread notification badge used `#8B0000` as background, which degraded badge visibility.
4. **Disappearing Tab Bar on Home:** The Home tab had `tabBarStyle: { display: "none" }`, which hid the bottom tab bar on `index.tsx` and caused it to abruptly appear when switching to `placement`, `notifications`, or `profile`. This violated the 4-tab architecture specified in `app/AGENTS.md`.

---

## 2. Technical Changes

### 2.1 Tab Bar Configuration (`app/(app)/(tabs)/_layout.tsx`)
- **Dark Mode Adaptive Colors:** Integrated `useColorScheme()` from React Native. When in dark mode:
  - `backgroundColor` transitions to `#0F172A` (Slate 900 canvas matching the app screens).
  - `borderTopColor` transitions to `#1E293B` (Slate 800 subtle top border).
  - `tabBarActiveTintColor` uses `#F87171` (Light Crimson) for brilliant visibility on dark slate backgrounds, and `#B91C1C` on light backgrounds.
  - `tabBarInactiveTintColor` uses `#94A3B8` (Slate 400) on dark and `#64748B` (Slate 500) on light.
- **`tabBarBadgeStyle`:** Updated badge background to `#DC2626` (Bright Crimson Red) for high-contrast notification badges.
- **Dynamic Safe Area & Gesture Bar Clearance:**
  - Integrated `useSafeAreaInsets()` from `react-native-safe-area-context` to automatically compute bottom clearance across all Android gesture navigations and iOS Home indicators:
    `const bottomInset = insets.bottom > 0 ? insets.bottom : (Platform.OS === "android" ? 18 : 12);`
    `const tabHeight = 60 + bottomInset;`
    `const paddingBottom = bottomInset + 4;`
  - Completely prevents the Android navigation pill/bar from overlapping or touching tab labels.
- **Scroll Content Clearance:**
  - Increased `contentContainerStyle={{ paddingBottom: 120 }}` across `placement.tsx`, `index.tsx`, `notifications.tsx`, and `profile.tsx` (`130px`) so bottom cards and action options have generous clearance above the navbar when scrolling.

### 2.2 Screen Header & Icon Tint Alignments
- **`app/(app)/(tabs)/notifications.tsx`:** Updated "SCIS Connect" header eyebrow, notification badge pill, filter pill active tint, refresh spinner tint, and empty state icon to `#B91C1C` / `#DC2626`.
- **`app/(app)/(tabs)/placement.tsx`:** Updated pull-to-refresh spinner tint and footer shield icon to `#B91C1C`.
- **`components/placement/PlacementStatsHeader.tsx`:** Updated "Ready" metric card icon color to `#B91C1C`.
- **`components/placement/PlacementCenterHeader.tsx`:** Updated briefcase icon badge color to `#B91C1C`.

---

## 3. Verification

- `npx tsc --noEmit` passed with 0 TypeScript compilation errors.
- Verified persistent bottom navigation bar behavior across all authenticated screens.
