import React from "react";
import { ScrollView, TouchableOpacity, Text, View } from "react-native";
import * as Haptics from "expo-haptics";

interface FilterChip {
  label: string;
  value: string;
  icon?: string;
}

interface AlumniFilterChipsProps {
  filters: FilterChip[];
  selectedValues: string[];
  onToggle: (value: string) => void;
  multiSelect?: boolean;
}

export const AlumniFilterChips: React.FC<AlumniFilterChipsProps> = ({
  filters,
  selectedValues,
  onToggle,
  multiSelect = true,
}) => {
  const handleToggle = (value: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle(value);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 4 }}
      className="mb-4"
    >
      {filters.map((filter) => {
        const isSelected = selectedValues.includes(filter.value);
        return (
          <TouchableOpacity
            key={filter.value}
            onPress={() => handleToggle(filter.value)}
            activeOpacity={0.7}
            className={`mr-2 px-4 py-2 rounded-full border flex-row items-center ${
              isSelected
                ? "bg-red-800 border-red-800"
                : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800"
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                isSelected
                  ? "text-white"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

export default AlumniFilterChips;
