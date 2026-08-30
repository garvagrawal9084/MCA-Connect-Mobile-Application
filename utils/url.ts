/**
 * SCIS Connect Mobile - URL & External Navigation Utilities
 * Provides safe URL formatting, protocol validation, and browser opening.
 */

import { Linking } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { logger } from "./logger";

/**
 * Normalizes external URLs by trimming whitespace and ensuring http/https protocol prefix.
 */
export const formatExternalUrl = (url?: string | null): string | null => {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed || trimmed === "#") return null;

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // Prepend https:// for domain-only URLs (e.g. amura.keka.com/careers)
  return `https://${trimmed}`;
};

/**
 * Validates whether a given string is a valid web URL.
 */
export const isValidUrl = (url?: string | null): boolean => {
  const formatted = formatExternalUrl(url);
  if (!formatted) return false;
  try {
    const parsed = new URL(formatted);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

/**
 * Opens a web URL in the native device browser or in-app Safari/Chrome tab.
 * Automatically tries Linking.openURL first with fallback to WebBrowser.
 */
export const openExternalUrl = async (
  rawUrl?: string | null,
  options?: { preferInApp?: boolean }
): Promise<boolean> => {
  const formattedUrl = formatExternalUrl(rawUrl);
  if (!formattedUrl) {
    logger.warn("EXTERNAL_URL", `Cannot open empty or invalid URL: "${rawUrl}"`);
    return false;
  }

  logger.info("EXTERNAL_URL", `Navigating to external site: ${formattedUrl}`);

  try {
    if (options?.preferInApp) {
      await WebBrowser.openBrowserAsync(formattedUrl, {
        toolbarColor: "#8B0000",
        controlsColor: "#FFFFFF",
      });
      return true;
    }

    const canOpen = await Linking.canOpenURL(formattedUrl);
    if (canOpen) {
      await Linking.openURL(formattedUrl);
      return true;
    } else {
      await WebBrowser.openBrowserAsync(formattedUrl);
      return true;
    }
  } catch (error) {
    logger.error("EXTERNAL_URL", `Error opening URL: ${formattedUrl}`, error);
    try {
      await Linking.openURL(formattedUrl);
      return true;
    } catch {
      return false;
    }
  }
};
