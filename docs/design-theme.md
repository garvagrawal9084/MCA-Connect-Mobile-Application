# SCIS Connect Mobile — Design System & Color Palette

> **Document Updated:** Sunday, August 23, 2026 at 10:40 PM IST (`2026-08-23T22:40:00+05:30`)  
> **Module:** Core Design System & Theme Tokens (`constants/colors.ts`, `tailwind.config.js`)  
> **Status:** Active — Violet, Lavender, and Charcoal Palette Applied  
> **Conformity:** Strict adherence to [app/AGENTS.md](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/app/AGENTS.md)  

---

## 🎨 Active Color Palette

The application design is built on the 5-color palette:

| Swatch | Color Name | Hex Code | Role in Application |
| :--- | :--- | :--- | :--- |
| ![#6D28D9](https://dummyimage.com/16x16/6D28D9/000000.png&text=+) | **Deep Violet** | `#6D28D9` | **Primary Brand**: Main action buttons, emblems, link states, focus rings, and spinners |
| ![#8B5CF6](https://dummyimage.com/16x16/8B5CF6/000000.png&text=+) | **Vibrant Violet** | `#8B5CF6` | **Brand Accent**: Secondary buttons, highlighted accents, and info icons |
| ![#C4B5FD](https://dummyimage.com/16x16/C4B5FD/000000.png&text=+) | **Soft Lavender** | `#C4B5FD` | **Badge & Highlight**: Pill badge borders, light subtle container outlines |
| ![#F5F3FF](https://dummyimage.com/16x16/F5F3FF/000000.png&text=+) | **Light Lilac** | `#F5F3FF` | **Tints & Surfaces**: Input focus background tint, badge fill, light surfaces |
| ![#1F2937](https://dummyimage.com/16x16/1F2937/000000.png&text=+) | **Dark Charcoal** | `#1F2937` | **Dark Neutral & Canvas**: Dark mode cards/surfaces, high-contrast dark text |

---

## 📁 Source Tokens & Usage

- **[constants/colors.ts](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/constants/colors.ts)** — The single source of truth for color tokens across the application, exporting full ramp for `primary`, `secondary`, `neutral`, `card`, `text`, and `palette`.
- **[tailwind.config.js](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/tailwind.config.js)** — NativeWind Tailwind configuration extending `brand` and `charcoal` utilities.
- **[components/ui/Button.tsx](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/components/ui/Button.tsx)** — Primary styled with `bg-violet-700` (`#6D28D9`), secondary with `bg-violet-500` (`#8B5CF6`), and outline with `border-violet-700`.
- **[components/ui/Input.tsx](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/components/ui/Input.tsx)** — Focus ring styled with `border-violet-700` and background `bg-violet-50/30`.
- **[app/(auth)/login.tsx](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/app/(auth)/login.tsx)** — Violet portal branding, emblem, badges, links, and action buttons.
- **[app/(auth)/forgot-password.tsx](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/app/(auth)/forgot-password.tsx)** — Violet recovery branding, navigation icons, and submit buttons.

