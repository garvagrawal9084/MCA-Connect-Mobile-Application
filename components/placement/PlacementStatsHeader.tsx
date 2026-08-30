import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  iconBgColor: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  label,
  value,
  icon,
  color,
  bgColor,
  borderColor,
  iconBgColor,
}) => {
  return (
    <View
      className={`flex-1 p-2.5 sm:p-3 rounded-2xl items-center border ${bgColor} ${borderColor} shadow-xs`}
    >
      <View
        className={`w-9 h-9 rounded-xl items-center justify-center mb-1.5 ${iconBgColor}`}
      >
        <Ionicons
          name={icon as keyof typeof Ionicons.glyphMap}
          size={17}
          color={color}
        />
      </View>
      <Text
        className="text-base sm:text-lg font-black text-slate-900 dark:text-white"
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {typeof value === "number" ? value.toLocaleString() : value}
      </Text>
      <Text
        className="text-[9.5px] sm:text-[10px] font-semibold text-slate-600 dark:text-slate-400 mt-0.5 text-center"
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
};

interface PlacementStatsHeaderProps {
  solvedCount?: number;
  activeDrivesCount?: number;
  readinessScore?: number;
  streakDays?: number;
}

export const PlacementStatsHeader: React.FC<PlacementStatsHeaderProps> = ({
  solvedCount = 148,
  activeDrivesCount = 3,
  readinessScore = 92,
  streakDays = 14,
}) => {
  return (
    <View className="flex-row gap-2 mb-4">
      <StatsCard
        label="Drives"
        value={activeDrivesCount}
        icon="briefcase-outline"
        color="#16A34A"
        bgColor="bg-emerald-50/90 dark:bg-slate-900"
        borderColor="border-emerald-200/80 dark:border-emerald-800/60"
        iconBgColor="bg-emerald-100/80 dark:bg-emerald-950/70"
      />
      <StatsCard
        label="Solved"
        value={solvedCount}
        icon="code-slash-outline"
        color="#2563EB"
        bgColor="bg-blue-50/90 dark:bg-slate-900"
        borderColor="border-blue-200/80 dark:border-blue-800/60"
        iconBgColor="bg-blue-100/80 dark:bg-blue-950/70"
      />
      <StatsCard
        label="Ready"
        value={`${readinessScore}%`}
        icon="sparkles-outline"
        color="#B91C1C"
        bgColor="bg-red-50/90 dark:bg-slate-900"
        borderColor="border-red-200/80 dark:border-red-800/60"
        iconBgColor="bg-red-100/80 dark:bg-red-950/70"
      />
      <StatsCard
        label="Streak"
        value={`${streakDays}d`}
        icon="flame-outline"
        color="#EA580C"
        bgColor="bg-amber-50/90 dark:bg-slate-900"
        borderColor="border-amber-200/80 dark:border-amber-800/60"
        iconBgColor="bg-amber-100/80 dark:bg-amber-950/70"
      />
    </View>
  );
};

export default PlacementStatsHeader;
