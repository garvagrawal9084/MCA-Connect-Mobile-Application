# Unified Notification Banner Design

## Overview
All in-app notification banners across the application have been harmonized to match the signature, high-fidelity Placement Job notification design system.

---

## 🎨 Unified Design System Tokens

1. **Card Container & Elevation**:
   - Background: `bg-white dark:bg-slate-900`
   - Border: `border-2 border-[#8B0000]/30 dark:border-rose-900/60 rounded-3xl p-3.5`
   - Shadow & Elevation: Crimson brand glow (`shadowColor: "#8B0000"`, `shadowOffset: { width: 0, height: 8 }`, `shadowOpacity: 0.18`, `shadowRadius: 16`, `elevation: 12`)
   - Animation: Spring downward slide with damping `18`, stiffness `160`, mass `0.9` and haptic feedback on arrival.

2. **Top Header Row**:
   - Circular Icon Badge: `w-6 h-6 rounded-full bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800` with category Ionicons glyph (`#8B0000`).
   - Category Label: Uppercase font-black tracking-wider text (`text-[#8B0000] dark:text-red-400`).
   - Status Indicator: Glowing emerald live dot (`w-1.5 h-1.5 rounded-full bg-emerald-500`) + `"Just now"`.
   - Circular Dismiss Button: Smooth tap action with `hitSlop` and close icon.

3. **Content & Metadata Chips**:
   - Bold title: `text-sm font-extrabold text-slate-900 dark:text-white`
   - 2-line preview message: `text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5`
   - Dynamic Metadata Chips:
     - Package: `₹X.X LPA` (Emerald pill)
     - Deadline: `Deadline: ...` (Rose pill)
     - Location: `City / Remote` (Slate pill)

4. **Action CTA Pill**:
   - Crimson primary button (`bg-[#8B0000] px-3.5 py-2 rounded-xl flex-row items-center shadow-xs`)
   - Contextual action text:
     - Jobs & Reminders: `"View Job"`
     - Results & Tests: `"Check Result"`
     - Challenges: `"Join Challenge"`
     - Announcements & Alerts: `"View Notice"`
     - Applications: `"View Update"`
   - White forward arrow icon: `<Ionicons name="arrow-forward" size={12} color="#ffffff" />`
