import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { AlumniUser } from "@/features/alumni/types";

interface AlumniGridCardProps {
  alumni: AlumniUser;
  onPress: () => void;
}

export const AlumniGridCard: React.FC<AlumniGridCardProps> = ({ alumni, onPress }) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const initials = alumni.name
    ? alumni.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  const typeLabel = alumni.communityStatus || alumni.accountType || "Student";

  const getPhotoUrl = (): string | null => {
    const img = (alumni as any).profileImage;
    if (!img) return null;
    if (typeof img === "string") return img;
    return img.url || null;
  };
  const photoUrl = getPhotoUrl();

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 mb-2 shadow-xs mx-1"
    >
      <View className="items-center">
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} className="w-16 h-16 rounded-full mb-2.5" />
        ) : (
          <View className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/40 items-center justify-center mb-2.5">
            <Text className="text-lg font-bold text-red-700 dark:text-red-300">
              {initials}
            </Text>
          </View>
        )}

        <Text
          className="text-sm font-bold text-slate-900 dark:text-white text-center"
          numberOfLines={1}
        >
          {alumni.name}
        </Text>

        {alumni.currentPosition ? (
          <Text className="text-[11px] text-slate-500 dark:text-slate-400 text-center mt-0.5" numberOfLines={1}>
            {alumni.currentPosition}
          </Text>
        ) : null}

        {alumni.company ? (
          <Text className="text-[11px] text-slate-400 dark:text-slate-500 text-center" numberOfLines={1}>
            {alumni.company}
          </Text>
        ) : null}

        <View className="bg-red-50 dark:bg-red-950/60 border border-red-200/80 dark:border-red-800/80 px-2.5 py-1 rounded-full mt-2">
          <Text className="text-[10px] font-semibold text-red-800 dark:text-red-300" numberOfLines={1}>
            {typeLabel}
          </Text>
        </View>

        <View className="flex-row items-center gap-1.5 mt-2">
          {alumni.openToWork && (
            <View className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 items-center justify-center">
              <Ionicons name="briefcase-outline" size={10} color="#059669" />
            </View>
          )}
          {alumni.availableForReferral && (
            <View className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 items-center justify-center">
              <Ionicons name="git-pull-request-outline" size={10} color="#2563EB" />
            </View>
          )}
          {alumni.availableForMentorship && (
            <View className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/40 items-center justify-center">
              <Ionicons name="people-outline" size={10} color="#D97706" />
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default AlumniGridCard;
