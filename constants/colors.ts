/**
 * SCIS Connect Mobile - Color Palette & Theme Tokens
 */

export const colors = {
  primary: {
    50: "#EEF2FF",
    100: "#E0E7FF",
    200: "#C7D2FE",
    300: "#A5B4FC",
    400: "#818CF8",
    500: "#6366F1", // Primary Indigo
    600: "#4F46E5",
    700: "#4338CA",
    800: "#3730A3",
    900: "#312E81",
    950: "#1E1B4B",
  },
  secondary: {
    50: "#F0F9FF",
    100: "#E0F2FE",
    200: "#BAE6FD",
    300: "#7DD3FC",
    400: "#38BDF8",
    500: "#0EA5E9", // Sky Blue Accent
    600: "#0284C7",
    700: "#0369A1",
    800: "#075985",
    900: "#0C4A6E",
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
    800: "#1E293B",
    900: "#0F172A",
    950: "#020617",
  },
  status: {
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",
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
    secondaryLight: "#64748B",
    secondaryDark: "#94A3B8",
    mutedLight: "#94A3B8",
    mutedDark: "#64748B",
  },
} as const;

export default colors;
