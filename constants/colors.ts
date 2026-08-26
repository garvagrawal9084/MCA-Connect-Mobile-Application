/**
 * SCIS Connect Mobile - Color Palette & Theme Tokens
 *
 * Official University of Hyderabad & SCIS Connect Portal Identity:
 * - Brand Primary:   #8B0000 (University Crimson / Maroon 800)
 * - Brand Dark:      #800000 (Deep Maroon 900)
 * - Brand Accent:    #EA580C (Banner Orange / Warm Amber 600)
 * - Tint / Surface:  #FEF2F2 (Rose / Crimson Tint 50)
 * - Soft Border:     #E2E8F0 (Slate 200) / #FECACA (Crimson Tint 200)
 * - Dark Canvas:     #0F172A (Deep Slate 950) / #1E293B (Slate 800)
 */

export const colors = {
  primary: {
    50: "#FEF2F2", // Crimson Tint
    100: "#FEE2E2", // Soft Badge Tint
    200: "#FECACA", // Light Crimson Border
    300: "#FCA5A5",
    400: "#F87171",
    500: "#EF4444", // Bright Red
    600: "#DC2626", // Crimson Red
    700: "#B91C1C", // Deep Crimson Accent
    800: "#8B0000", // Signature University Maroon / Primary Action
    900: "#800000", // Deep Maroon
    950: "#450A0A", // Darkest Maroon
  },
  accent: {
    50: "#FFF7ED",
    100: "#FFEDD5",
    200: "#FED7AA",
    300: "#FDBA74",
    400: "#FB923C",
    500: "#F97316", // Warm Orange
    600: "#EA580C", // Banner Orange Accent
    700: "#C2410C",
    800: "#9A3412",
    900: "#7C2D12",
    950: "#431407",
  },
  secondary: {
    50: "#FFF7ED",
    100: "#FFEDD5",
    200: "#FED7AA",
    300: "#FDBA74",
    400: "#FB923C",
    500: "#F97316",
    600: "#EA580C",
    700: "#C2410C",
    800: "#9A3412",
    900: "#7C2D12",
  },
  neutral: {
    50: "#F8FAFC",
    100: "#F1F5F9",
    200: "#E2E8F0",
    300: "#CBD5E1",
    400: "#94A3B8",
    500: "#64748B",
    600: "#475569",
    700: "#334155",
    800: "#1E293B", // Card Dark
    900: "#0F172A", // Dark Canvas
    950: "#020617",
  },
  status: {
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#2563EB",
  },
  // Feature module colors extracted from portal showcase pillars
  modules: {
    coding: {
      primary: "#2563EB",
      bg: "#EFF6FF",
      border: "#BFDBFE",
    },
    placements: {
      primary: "#16A34A",
      bg: "#F0FDF4",
      border: "#BBF7D0",
    },
    analytics: {
      primary: "#EA580C",
      bg: "#FFF7ED",
      border: "#FED7AA",
    },
    alumni: {
      primary: "#8B0000",
      bg: "#FEF2F2",
      border: "#FECACA",
    },
    community: {
      primary: "#0D9488",
      bg: "#F0FDFA",
      border: "#99F6E4",
    },
  },
  card: {
    light: "#FFFFFF",
    dark: "#1E293B",
    borderLight: "#E2E8F0",
    borderDark: "#334155",
  },
  text: {
    primaryLight: "#0F172A",
    primaryDark: "#F8FAFC",
    secondaryLight: "#475569",
    secondaryDark: "#94A3B8",
    mutedLight: "#94A3B8",
    mutedDark: "#64748B",
    linkLight: "#8B0000",
    linkDark: "#F87171",
  },
  palette: {
    crimson: "#8B0000",
    maroon: "#800000",
    deepCrimson: "#990000",
    accentOrange: "#EA580C",
    softRose: "#FEF2F2",
    charcoal: "#1F2937",
    darkSlate: "#0F172A",
    borderSlate: "#E2E8F0",
  },
} as const;

export default colors;

