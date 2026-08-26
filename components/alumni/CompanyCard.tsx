import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { CompanyGroup } from "@/features/alumni/types";

interface CompanyCardProps {
  company: CompanyGroup;
  onPress: () => void;
}

export const CompanyCard: React.FC<CompanyCardProps> = ({ company, onPress }) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 mb-3 shadow-xs"
    >
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center flex-1">
          <View className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200/80 dark:border-red-800/80 items-center justify-center mr-3">
            <Ionicons name="business-outline" size={18} color="#8B0000" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-slate-900 dark:text-white" numberOfLines={1}>
              {company.company}
            </Text>
            <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {company.count} alumni
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
      </View>

      <View className="flex-row items-center">
        {company.members.slice(0, 5).map((member, index) => (
          <View
            key={member._id}
            className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/40 border-2 border-white dark:border-slate-900 items-center justify-center"
            style={{ marginLeft: index > 0 ? -8 : 0, zIndex: 5 - index }}
          >
            <Text className="text-[9px] font-bold text-red-700 dark:text-red-300">
              {member.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </Text>
          </View>
        ))}
        {company.count > 5 && (
          <View
            className="w-8 h-8 rounded-full bg-red-200 dark:bg-red-800/60 border-2 border-white dark:border-slate-900 items-center justify-center"
            style={{ marginLeft: -8 }}
          >
            <Text className="text-[9px] font-bold text-red-800 dark:text-red-200">
              +{company.count - 5}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default CompanyCard;
