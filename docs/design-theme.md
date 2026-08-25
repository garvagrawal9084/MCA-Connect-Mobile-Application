# SCIS Connect Mobile — Design System & Color Palette

> **Document Updated:** Monday, August 24, 2026 at 09:40 PM IST (`2026-08-24T21:40:00+05:30`)  
> **Module:** Core Design System & Theme Tokens (`constants/colors.ts`, `tailwind.config.js`)  
> **Status:** Active — Official University of Hyderabad Crimson & SCIS Portal Palette Applied  
> **Conformity:** Strict adherence to [app/AGENTS.md](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/app/AGENTS.md)  

---

## 🎨 Extracted Portal Color Palette

The application design is built on the authentic visual identity extracted directly from the official **SCIS Connect** portal:

| Swatch | Color Name | Hex Code | Role in Application |
| :--- | :--- | :--- | :--- |
| ![#8B0000](https://dummyimage.com/16x16/8B0000/000000.png&text=+) | **University Crimson** | `#8B0000` | **Primary Brand**: Main action buttons ("Sign In", "Register"), school emblems, focused borders, link states ("Forgot Password?", "Create Account →"), spinners, active tab tint |
| ![#800000](https://dummyimage.com/16x16/800000/000000.png&text=+) | **Deep Maroon** | `#800000` | **Primary Active**: Button pressed states, darkest header accents |
| ![#EA580C](https://dummyimage.com/16x16/EA580C/000000.png&text=+) | **Banner Orange** | `#EA580C` | **Brand Accent**: Announcement badges, notification accents, bug reporting highlights |
| ![#FEF2F2](https://dummyimage.com/16x16/FEF2F2/000000.png&text=+) | **Crimson Tint** | `#FEF2F2` | **Tints & Surfaces**: Input focus background tint, pill badge fill |
| ![#E2E8F0](https://dummyimage.com/16x16/E2E8F0/000000.png&text=+) | **Soft Slate Border** | `#E2E8F0` | **Card & Input Borders**: Clean form input borders, card outlines |
| ![#0F172A](https://dummyimage.com/16x16/0F172A/000000.png&text=+) | **Dark Slate Canvas** | `#0F172A` | **Dark Mode Canvas & Dark Neutral**: High contrast dark surfaces |

---

## 🧩 Portal Feature Module Accents

Extracted from the 5 pillar cards in the SCIS Connect showcase banner:

| Module | Icon / Role | Primary Hex | Background Hex | Border Hex |
| :--- | :--- | :--- | :--- | :--- |
| **Coding Challenges** | `[</>]` Coding & Practice | `#2563EB` | `#EFF6FF` | `#BFDBFE` |
| **Placements & Internships** | `[💼]` Opportunities & Drives | `#16A34A` | `#F0FDF4` | `#BBF7D0` |
| **Performance Analytics** | `[📊]` Track Progress & Skills | `#EA580C` | `#FFF7ED` | `#FED7AA` |
| **Alumni Connect** | `[👥]` Network & Mentorship | `#7C3AED` | `#FAF5FF` | `#E9D5FF` |
| **Community & Collaboration**| `[💬]` Discussions & Chat | `#0D9488` | `#F0FDFA` | `#99F6E4` |

---

## 📁 Source Tokens & Usage

- **[constants/colors.ts](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/constants/colors.ts)** — The single source of truth for color tokens across the application, exporting full ramps for `primary` (Crimson), `accent` (Orange), `neutral` (Slate), `modules`, `card`, `text`, and `palette`.
- **[constants/theme.ts](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/constants/theme.ts)** — Unified typography scale, 4-point spacing grid, and border radius ramp.
- **[tailwind.config.js](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/tailwind.config.js)** — NativeWind Tailwind configuration extending `brand` (crimson), `accent` (orange), and `charcoal` utilities.
- **[components/ui/Button.tsx](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/components/ui/Button.tsx)** — Primary styled with `bg-red-800` (`#8B0000`), secondary with `bg-orange-600` (`#EA580C`), and outline with `border-red-800`.
- **[components/ui/Input.tsx](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/components/ui/Input.tsx)** — Focus ring styled with `border-red-800` and background `bg-red-50/20`.
- **[app/(auth)/login.tsx](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/app/(auth)/login.tsx)** — Authentic SCIS portal branding, emblem, badges, links, "Remember me", and "Create Account →".
- **[app/(auth)/forgot-password.tsx](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/app/(auth)/forgot-password.tsx)** — Crimson recovery branding, navigation icons, and submit buttons.
- **[app/(app)/(tabs)/_layout.tsx](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/app/(app)/(tabs)/_layout.tsx)** — Tab bar active tint set to University Crimson `#8B0000`.


