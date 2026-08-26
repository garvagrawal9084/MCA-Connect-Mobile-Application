import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { AlumniUser } from "@/features/alumni/types";

interface AlumniCardProps {
  alumni: AlumniUser;
  onPress: () => void;
}

export const AlumniCard: React.FC<AlumniCardProps> = ({ alumni, onPress }) => {
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

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 mb-3 shadow-xs"
    >
      <View className="flex-row items-center">
        {alumni.profileImage?.url ? (
          <View className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/40 items-center justify-center mr-3">
            <Text className="text-sm font-bold text-red-700 dark:text-red-300">
              {initials}
            </Text>
          </View>
        ) : (
          <View className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/40 items-center justify-center mr-3">
            <Text className="text-sm font-bold text-red-700 dark:text-red-300">
              {initials}
            </Text>
          </View>
        )}

        <View className="flex-1">
          <View className="flex-row items-center">
            <Text className="text-sm font-bold text-slate-900 dark:text-white" numberOfLines={1}>
              {alumni.name}
            </Text>
            {alumni.communityStatus && (
              <View className="bg-red-50 dark:bg-red-950/60 border border-red-200/80 dark:border-red-800/80 px-2 py-0.5 rounded-full ml-2">
                <Text className="text-[10px] font-semibold text-red-700 dark:text-red-300">
                  {alumni.communityStatus}
                </Text>
              </View>
            )}
          </View>

          {alumni.currentPosition && alumni.company ? (
            <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5" numberOfLines={1}>
              {alumni.currentPosition} at {alumni.company}
            </Text>
          ) : alumni.currentPosition ? (
            <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5" numberOfLines={1}>
              {alumni.currentPosition}
            </Text>
          ) : alumni.company ? (
            <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5" numberOfLines={1}>
              {alumni.company}
            </Text>
          ) : null}

          <View className="flex-row items-center mt-1">
            {alumni.location ? (
              <View className="flex-row items-center mr-3">
                <Ionicons name="location-outline" size={11} color="#94A3B8" />
                <Text className="text-[11px] text-slate-400 dark:text-slate-500 ml-0.5" numberOfLines={1}>
                  {alumni.location}
                </Text>
              </View>
            ) : null}
            {alumni.batchYear ? (
              <View className="flex-row items-center">
                <Ionicons name="school-outline" size={11} color="#94A3B8" />
                <Text className="text-[11px] text-slate-400 dark:text-slate-500 ml-0.5">
                  Batch {alumni.batchYear}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
      </View>

      {alumni.skills && alumni.skills.length > 0 && (
        <View className="flex-row flex-wrap gap-1.5 mt-3">
          {alumni.skills.slice(0, 4).map((skill, index) => (
            <View
              key={index}
              className="bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 px-2 py-0.5 rounded-full"
            >
              <Text className="text-[10px] font-medium text-slate-600 dark:text-slate-400">
                {skill}
              </Text>
            </View>
          ))}
          {alumni.skills.length > 4 && (
            <View className="bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 px-2 py-0.5 rounded-full">
              <Text className="text-[10px] font-medium text-slate-500 dark:text-slate-500">
                +{alumni.skills.length - 4}
              </Text>
            </View>
          )}
        </View>
      )}

      <View className="flex-row items-center gap-2 mt-3">
        {alumni.openToWork && (
          <View className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80 px-2 py-1 rounded-full flex-row items-center">
            <Ionicons name="briefcase-outline" size={10} color="#059669" />
            <Text className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 ml-1">
              Open to Work
            </Text>
          </View>
        )}
        {alumni.availableForReferral && (
          <View className="bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/80 px-2 py-1 rounded-full flex-row items-center">
            <Ionicons name="git-pull-request-outline" size={10} color="#2563EB" />
            <Text className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 ml-1">
              Referrals
            </Text>
          </View>
        )}
        {alumni.availableForMentorship && (
          <View className="bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/80 px-2 py-1 rounded-full flex-row items-center">
            <Ionicons name="people-outline" size={10} color="#D97706" />
            <Text className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 ml-1">
              Mentor
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default AlumniCard;
