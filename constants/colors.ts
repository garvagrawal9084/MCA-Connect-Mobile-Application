/**
 * SCIS Connect Mobile - Color Palette & Theme Tokens
 *
 * Active Palette:
 * - Brand Primary:   #6D28D9 (Deep Violet / Violet 700)
 * - Brand Accent:    #8B5CF6 (Vibrant Violet / Violet 500)
 * - Soft Lavender:   #C4B5FD (Lavender / Violet 300)
 * - Light Lilac:     #F5F3FF (Lilac Tint / Violet 50)
 * - Dark Charcoal:   #1F2937 (Charcoal / Gray 800)
 */

export const colors = {
  primary: {
    50: "#F5F3FF", // Light Lilac Tint
    100: "#EDE9FE",
    200: "#DDD6FE",
    300: "#C4B5FD", // Soft Lavender
    400: "#A78BFA",
    500: "#8B5CF6", // Vibrant Violet Accent
    600: "#7C3AED",
    700: "#6D28D9", // Deep Violet Primary Brand
    800: "#5B21B6",
    900: "#4C1D95",
    950: "#2E1065",
  },
  secondary: {
    50: "#F5F3FF",
    100: "#EDE9FE",
    200: "#DDD6FE",
    300: "#C4B5FD",
    400: "#A78BFA",
    500: "#8B5CF6",
    600: "#7C3AED",
    700: "#6D28D9",
    800: "#5B21B6",
    900: "#4C1D95",
  },
  neutral: {
    50: "#F9FAFB",
    100: "#F3F4F6",
    200: "#E5E7EB",
    300: "#D1D5DB",
    400: "#9CA3AF",
    500: "#6B7280",
    600: "#4B5563",
    700: "#374151",
    800: "#1F2937", // Dark Charcoal
    900: "#111827",
    950: "#030712",
  },
  status: {
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#8B5CF6",
  },
  card: {
    light: "#FFFFFF",
    dark: "#1F2937",
    borderLight: "#E5E7EB",
    borderDark: "#374151",
  },
  text: {
    primaryLight: "#1F2937",
    primaryDark: "#F9FAFB",
    secondaryLight: "#6B7280",
    secondaryDark: "#9CA3AF",
    mutedLight: "#9CA3AF",
    mutedDark: "#6B7280",
  },
  palette: {
    deepViolet: "#6D28D9",
    vibrantViolet: "#8B5CF6",
    softLavender: "#C4B5FD",
    lightLilac: "#F5F3FF",
    darkCharcoal: "#1F2937",
  },
} as const;

export default colors;

