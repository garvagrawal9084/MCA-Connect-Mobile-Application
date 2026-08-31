# Modal Header Notch & Safe Area Inset Resolution

## Overview
Resolved UI overlap where modal sheet headers ("Coding Challenges", "Leaderboard", "My Certificates", "Placement Center", "Tests & Results", and drill-down review sheets) clashed directly with the device status bar, clock, and top notch/cutout on Android and edge-to-edge iOS devices. Also resolved date fallback formatting for verified certificate badges.

## Identified Root Causes
1. **Modal Native Container Insets**: In React Native, `<Modal>` creates a separate root window that overrides the parent `<SafeAreaView>`. On Android and translucent status bar setups, modal contents start at `y=0`.
2. **Fixed Top Padding (`pt-5` / `20px`)**: With modern device cutouts and status bars measuring 28px - 48px, the static top padding placed the "PLACEMENT STUDIO" label, feature title, and close button directly under the camera notch and system status icons.
3. **Invalid Date Display in Certificates**: When certificate dates were missing or in unsupported string formats, `new Date(cert.issueDate).toLocaleDateString()` evaluated to `"Invalid Date"`.

## Changes Implemented

### 1. Dynamic Safe Area Calculation
In modal components:
```tsx
const insets = useSafeAreaInsets();
const topInset = Math.max(
  insets.top,
  Platform.OS === "android" ? (RNStatusBar.currentHeight ?? 24) : 0
);
```

### 2. Header Style Injection
Updated header containers across all modal sheets to dynamically compute clearance:
```tsx
<View
  style={{ paddingTop: Math.max(topInset + 8, 16) }}
  className="px-5 pb-3 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex-row items-center justify-between"
>
```

### 3. Graceful Certificate Date Formatter
Added safe parsing utility for certificates:
```tsx
const formatCertificateDate = (dateStr?: string | Date) => {
  if (!dateStr) return "Recently";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return typeof dateStr === "string" ? dateStr : "Recently";
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return typeof dateStr === "string" ? dateStr : "Recently";
  }
};
```

## Files Modified
- `components/placement/PlacementDetailModal.tsx`: Fixed main header for Coding Challenges, Leaderboard, My Certificates, and drilldown modals (Scorecard analysis, Question review), added safe certificate date formatting.
- `components/placement/PlacementJobDetailModal.tsx`: Fixed Drive Details header top inset clearance.
- `app/(app)/placement/tests.tsx`: Fixed Scorecard breakdown and Question review modal headers.
