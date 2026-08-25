# SCIS Connect Mobile — Portal Theme Extraction & Redesign

> **Date:** Monday, August 24, 2026 (`2026-08-24T21:40:00+05:30`)  
> **Module:** Design System, Theme Tokens, NativeWind, UI Components, Screens  
> **Conformity:** Strict adherence to [app/AGENTS.md](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/app/AGENTS.md)

---

## 📌 Overview

Extracted the authentic font styling, color palette, and visual identity from the official **SCIS Connect** (School of Computer and Information Sciences, University of Hyderabad) web portal image and systematically applied it across the entire mobile application.

---

## 🎨 Extracted Visual Palette

### 1. Primary & Brand Identity
- **University Crimson / Maroon (`#8B0000` / `#990000`)**:
  - Primary button background (`Button.tsx` variant `"primary"`)
  - SCIS Connect crest and portal header badges
  - Input active focused border and glow tint (`#FEF2F2`)
  - Interactive links ("Forgot Password?", "Create Account →")
  - Tab navigation bar active tint (`_layout.tsx`)

### 2. Accent & Notice System
- **Banner Orange (`#EA580C` / `#F97316`)**:
  - Notification center icons and banner accents
  - Secondary button highlights

### 3. Pillar Modules (Showcase Badges)
- **Coding Challenges**: Cerulean Blue (`#2563EB`)
- **Placements & Internships**: Emerald Green (`#16A34A`)
- **Performance Analytics**: Warm Orange (`#EA580C`)
- **Alumni Connect**: Royal Purple (`#7C3AED`)
- **Community & Collaboration**: Teal Cyan (`#0D9488`)

### 4. Neutrals & Canvas
- **Screen Canvas**: Crisp, modern off-white background (`#F8FAFC` / `bg-[#F8FAFC]`) in light mode and deep slate (`#0F172A` / `dark:bg-slate-950`) in dark mode.
- **Card Surfaces**: Pure Elevated White (`#FFFFFF` / `bg-white dark:bg-slate-900`) with smooth rounded corners (`rounded-3xl`), soft slate borders (`border-slate-200/90`), and diffuse drop shadows (`shadow-xl shadow-slate-200/60`).
- **Input Surfaces**: Clean White (`bg-white dark:bg-slate-800/90`) with slate borders and crimson focus rings.
- **Typography**: Dark Slate (`#0F172A`) headings with high-contrast slate body (`#475569`).

---

## 📁 Modified Files Summary

1. **`constants/colors.ts`**: Replaced violet ramp with University Crimson (`primary`), Banner Orange (`accent`), Slate neutrals, and `modules` color map.
2. **`constants/theme.ts`**: Updated design system theme bindings and documentation.
3. **`tailwind.config.js`**: Extended `brand` (crimson 50–950), `accent` (orange 50–950), and `charcoal`.
4. **`components/ui/Button.tsx`**: Updated primary, secondary, outline, ghost variants and spinner color to `#8B0000`.
5. **`components/ui/Input.tsx`**: Updated focus border, focus background tint, and eye icon color.
6. **`app/index.tsx`**: Updated splash emblem, badge, and loader to University Crimson.
7. **`app/(auth)/login.tsx`**: Updated login branding, "Remember me" checkbox, "Forgot Password?", "Sign In" button, and added "Create Account →".
8. **`app/(auth)/forgot-password.tsx`**: Updated back button, emblem, recovery badge, link, and submit button.
9. **`app/(app)/(tabs)/_layout.tsx`**: Updated `tabBarActiveTintColor` to `#8B0000`.
10. **`app/(app)/(tabs)/index.tsx`**: Updated dashboard header emblem, student role badge, diagnostics icons.
11. **`app/(app)/(tabs)/placement.tsx`**: Updated placement center styling to emerald green module branding.
12. **`app/(app)/(tabs)/notifications.tsx`**: Updated notification center styling to banner orange branding.
13. **`app/(app)/(tabs)/profile.tsx`**: Updated profile avatar circle and role badge to crimson.
14. **`docs/design-theme.md`**: Updated documentation with the extracted design tokens and module maps.
