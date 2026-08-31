/**
 * SCIS Connect Mobile - Reusable Avatar Component
 * Handles remote image loading (Cloudinary, external URLs), loading states, and fallback initial rendering.
 */

import React, { useState } from "react";
import { View, Text, Image, StyleSheet, StyleProp, ViewStyle } from "react-native";

export interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
  showStatus?: boolean;
  statusColor?: string;
  style?: StyleProp<ViewStyle>;
  containerClassName?: string;
  textClassName?: string;
  fallbackBgColor?: string;
}

export function Avatar({
  uri,
  name = "Student",
  size = 64,
  showStatus = false,
  statusColor = "#10B981", // emerald-500
  style,
  containerClassName = "",
  textClassName = "",
  fallbackBgColor = "#8B0000", // SCIS crimson
}: AvatarProps) {
  const [hasError, setHasError] = useState(false);

  React.useEffect(() => {
    setHasError(false);
  }, [uri]);

  const initial = name?.trim() ? name.trim().charAt(0).toUpperCase() : "S";
  const fontSize = Math.round(size * 0.4);
  const statusSize = Math.max(10, Math.round(size * 0.22));

  const showImage = Boolean(uri && !hasError);

  return (
    <View
      style={[{ width: size, height: size }, style]}
      className={`relative items-center justify-center ${containerClassName}`}
    >
      {showImage ? (
        <Image
          source={{ uri: uri! }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
          }}
          onError={() => setHasError(true)}
          resizeMode="cover"
        />
      ) : (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: fallbackBgColor,
          }}
          className="items-center justify-center shadow-md shadow-red-900/30"
        >
          <Text
            style={{ fontSize }}
            className={`font-black text-white ${textClassName}`}
          >
            {initial}
          </Text>
        </View>
      )}

      {showStatus && (
        <View
          style={{
            width: statusSize,
            height: statusSize,
            borderRadius: statusSize / 2,
            backgroundColor: statusColor,
            borderWidth: 2,
            borderColor: "#FFFFFF",
            bottom: 0,
            right: 0,
          }}
          className="absolute shadow-xs"
        />
      )}
    </View>
  );
}

export default Avatar;
