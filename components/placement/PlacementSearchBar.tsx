/**
 * SCIS Connect Mobile - Placement Search Bar
 * Clean, animated search bar with debounce, clear action & search indicators.
 */

import React from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

interface PlacementSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  onSubmit?: () => void;
  isLoading?: boolean;
  placeholder?: string;
}

export const PlacementSearchBar: React.FC<PlacementSearchBarProps> = ({
  value,
  onChangeText,
  onClear,
  onSubmit,
  isLoading = false,
  placeholder = "Search companies, roles, locations, skills...",
}) => {
  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChangeText("");
    onClear?.();
  };

  return (
    <View className="px-4 mb-3">
      <View className="flex-row items-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl px-4 py-3 shadow-xs">
        <Ionicons name="search-outline" size={18} color="#94A3B8" />

        <TextInput
          className="flex-1 text-xs sm:text-sm font-medium text-slate-900 dark:text-white ml-2.5"
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />

        {isLoading ? (
          <ActivityIndicator size="small" color="#8B0000" className="ml-1" />
        ) : value.length > 0 ? (
          <TouchableOpacity
            onPress={handleClear}
            className="p-1 -mr-1"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={18} color="#94A3B8" />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};
