import React from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface AlumniSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFilterPress?: () => void;
  showFilter?: boolean;
}

export const AlumniSearchBar: React.FC<AlumniSearchBarProps> = ({
  value,
  onChangeText,
  placeholder = "Search alumni by name, skill, company...",
  onFilterPress,
  showFilter = true,
}) => {
  return (
    <View className="flex-row items-center mb-3">
      <View className="flex-1 flex-row items-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl px-4 py-3 shadow-xs">
        <Ionicons name="search-outline" size={18} color="#94A3B8" />
        <TextInput
          className="flex-1 text-sm text-slate-900 dark:text-white ml-2.5"
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          value={value}
          onChangeText={onChangeText}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {value.length > 0 && (
          <TouchableOpacity onPress={() => onChangeText("")} className="ml-1">
            <Ionicons name="close-circle" size={18} color="#CBD5E1" />
          </TouchableOpacity>
        )}
      </View>

      {showFilter && onFilterPress && (
        <TouchableOpacity
          onPress={onFilterPress}
          className="w-11 h-11 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl items-center justify-center ml-2 shadow-xs"
          activeOpacity={0.7}
        >
          <Ionicons name="options-outline" size={18} color="#64748B" />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default AlumniSearchBar;
