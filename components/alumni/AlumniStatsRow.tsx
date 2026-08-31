import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface StatsCardProps {
  label: string;
  value: number;
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
      className={`flex-1 p-3 rounded-2xl items-center border ${bgColor} ${borderColor} shadow-xs`}
    >
      <View
        className={`w-9 h-9 rounded-xl items-center justify-center mb-2 ${iconBgColor}`}
      >
        <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={17} color={color} />
      </View>
      <Text className="text-lg font-black text-slate-900 dark:text-white">
        {value.toLocaleString()}
      </Text>
      <Text className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 mt-0.5 text-center">
        {label}
      </Text>
    </View>
  );
};

interface AlumniStatsRowProps {
  alumniRegistered: number;
  totalRegistered: number;
  followersConnections: number;
  isLoading?: boolean;
}

export const AlumniStatsRow: React.FC<AlumniStatsRowProps> = ({
  alumniRegistered,
  totalRegistered,
  followersConnections,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <View className="flex-row gap-2 mb-5">
        {[1, 2, 3].map((i) => (
          <View key={i} className="flex-1 h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
        ))}
      </View>
    );
  }

  return (
    <View className="flex-row gap-2 mb-5">
      <StatsCard
        label="Alumni"
        value={alumniRegistered}
        icon="school-outline"
        color="#8B0000"
        bgColor="bg-red-50/90 dark:bg-slate-900"
        borderColor="border-red-200/80 dark:border-red-800/60"
        iconBgColor="bg-red-100/80 dark:bg-red-950/70"
      />
      <StatsCard
        label="Community"
        value={totalRegistered}
        icon="people-outline"
        color="#0D9488"
        bgColor="bg-teal-50/90 dark:bg-slate-900"
        borderColor="border-teal-200/80 dark:border-teal-800/60"
        iconBgColor="bg-teal-100/80 dark:bg-teal-950/70"
      />
      <StatsCard
        label="Connections"
        value={followersConnections}
        icon="git-network-outline"
        color="#2563EB"
        bgColor="bg-blue-50/90 dark:bg-slate-900"
        borderColor="border-blue-200/80 dark:border-blue-800/60"
        iconBgColor="bg-blue-100/80 dark:bg-blue-950/70"
      />
    </View>
  );
};

export default AlumniStatsRow;
