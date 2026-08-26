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
}

const StatsCard: React.FC<StatsCardProps> = ({
  label,
  value,
  icon,
  color,
  bgColor,
  borderColor,
}) => {
  return (
    <View
      className="flex-1 p-3 rounded-2xl items-center"
      style={{ backgroundColor: bgColor, borderColor, borderWidth: 1 }}
    >
      <View
        className="w-9 h-9 rounded-xl items-center justify-center mb-2"
        style={{ backgroundColor: `${color}15` }}
      >
        <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={17} color={color} />
      </View>
      <Text className="text-lg font-black text-slate-900 dark:text-white">{value.toLocaleString()}</Text>
      <Text className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5 text-center">
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
        bgColor="#FEF2F2"
        borderColor="#FECACA"
      />
      <StatsCard
        label="Community"
        value={totalRegistered}
        icon="people-outline"
        color="#0D9488"
        bgColor="#F0FDFA"
        borderColor="#99F6E4"
      />
      <StatsCard
        label="Connections"
        value={followersConnections}
        icon="git-network-outline"
        color="#2563EB"
        bgColor="#EFF6FF"
        borderColor="#BFDBFE"
      />
    </View>
  );
};

export default AlumniStatsRow;
