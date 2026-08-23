# SCIS Connect Mobile — Design System & Color Palette

> **Document Updated:** Sunday, August 23, 2026 at 7:29 PM IST (`2026-08-23T19:29:00+05:30`)  
> **Module:** Core Design System & Theme Tokens (`constants/colors.ts`)  
> **Status:** Active & Restored to Standard Indigo & Sky Palette  
> **Conformity:** Strict adherence to [app/AGENTS.md](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/app/AGENTS.md)  

---

## 🎨 Active Theme: "Indigo & Sky Blue"

The original, clean, and modern color palette for **SCIS Connect Mobile**:

| Role | Color Family | Hex Code | Usage in App |
| :--- | :--- | :--- | :--- |
| **Primary Brand** | **Indigo** | `#6366F1` / `#4F46E5` | Main action buttons, active navigation, emblems, links |
| **Secondary Accent** | **Sky Blue** | `#0EA5E9` / `#0284C7` | Secondary CTAs, accent badges |
| **Success Status** | **Emerald** | `#10B981` | Success alerts, verification confirmation |
| **Warning / Alerts** | **Amber** | `#F59E0B` | System warnings, notice badges |
| **Error Status** | **Red** | `#EF4444` | Form errors, validation failure alerts |
| **Canvas & Surfaces**| **Slate** | `#F8FAFC` (Light) / `#0F172A` (Dark) | Backgrounds and card surfaces |

---

## 📁 Source Tokens
- **[constants/colors.ts](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/constants/colors.ts)** — The single source of truth for color tokens across the application.
- **[components/ui/Button.tsx](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/components/ui/Button.tsx)** — Primary styled with `bg-indigo-600` and secondary with `bg-sky-500`.
- **[components/ui/Input.tsx](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/components/ui/Input.tsx)** — Focus ring styled with `border-indigo-600`.
- **[app/(auth)/login.tsx](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/app/(auth)/login.tsx)** — Indigo portal branding.
- **[app/(auth)/forgot-password.tsx](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/app/(auth)/forgot-password.tsx)** — Indigo recovery branding.
