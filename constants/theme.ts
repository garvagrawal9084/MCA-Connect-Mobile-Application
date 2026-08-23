/**
 * SCIS Connect Mobile - Design System & Unified Theme Tokens
 *
 * Single source of truth for:
 * - Colors (Light Multi-Color Palette: Ocean Cerulean, Mint Emerald, Iris, Honey Amber, Rose)
 * - Spacing (4-point grid)
 * - Border Radius
 * - Typography
 */

import { TextStyle } from "react-native";
import { colors } from "./colors";

// 4-point spacing scale
export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  "6xl": 64,
} as const;

// Border radius scale
export const radius = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  full: 9999,
} as const;

// Typography ramp
export const typography = {
  largeTitle: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "800",
  } as TextStyle,
  title1: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "700",
  } as TextStyle,
  title2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
  } as TextStyle,
  title3: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "600",
  } as TextStyle,
  headline: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
  } as TextStyle,
  body: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "400",
  } as TextStyle,
  bodyMedium: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "500",
  } as TextStyle,
  subhead: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "500",
  } as TextStyle,
  footnote: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "400",
  } as TextStyle,
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
  } as TextStyle,
  badge: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  } as TextStyle,
} as const;

// Unified Theme Object
export const theme = {
  colors,
  spacing,
  radius,
  typography,
} as const;

export default theme;
