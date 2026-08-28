import React from "react";
import { View, Text, useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface TilePalette {
  color: string;
  bgColor: string;
  borderColor: string;
}

interface TileConfig {
  label: string;
  icon: string;
  light: TilePalette;
  dark: TilePalette;
}

const TILE_CONFIGS: TileConfig[] = [
  {
    label: "Alumni",
    icon: "school-outline",
    light: { color: "#8B0000", bgColor: "#FEF2F2", borderColor: "#FECACA" },
    dark: { color: "#FCA5A5", bgColor: "#450A0A", borderColor: "#7F1D1D" },
  },
  {
    label: "Community",
    icon: "people-outline",
    light: { color: "#0D9488", bgColor: "#F0FDFA", borderColor: "#99F6E4" },
    dark: { color: "#5EEAD4", bgColor: "#134E4A", borderColor: "#0F766E" },
  },
  {
    label: "Connections",
    icon: "git-network-outline",
    light: { color: "#2563EB", bgColor: "#EFF6FF", borderColor: "#BFDBFE" },
    dark: { color: "#93C5FD", bgColor: "#1E3A5F", borderColor: "#1D4ED8" },
  },
];

interface StatsCardProps {
  label: string;
  value: number;
  icon: string;
  palette: TilePalette;
  scheme: "light" | "dark" | null | undefined;
}

const StatsCard: React.FC<StatsCardProps> = ({ label, value, icon, palette, scheme }) => {
  const isDark = scheme === "dark";

  return (
    <View
      className="flex-1 p-3 rounded-2xl items-center"
      style={{ backgroundColor: palette.bgColor, borderColor: palette.borderColor, borderWidth: 1 }}
    >
      <View
        className="w-9 h-9 rounded-xl items-center justify-center mb-2"
        style={{ backgroundColor: `${palette.color}${isDark ? "33" : "15"}` }}
      >
        <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={17} color={palette.color} />
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
  const scheme = useColorScheme();

  const values = [alumniRegistered, totalRegistered, followersConnections];

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
      {TILE_CONFIGS.map((config, index) => (
        <StatsCard
          key={config.label}
          label={config.label}
          value={values[index]}
          icon={config.icon}
          palette={scheme === "dark" ? config.dark : config.light}
          scheme={scheme}
        />
      ))}
    </View>
  );
};

export default AlumniStatsRow;