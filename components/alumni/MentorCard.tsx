import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { Mentor } from "@/features/alumni/types";

interface MentorCardProps {
  mentor: Mentor;
  onRequestMentorship: () => void;
  onPress?: () => void;
}

export const MentorCard: React.FC<MentorCardProps> = ({ mentor, onRequestMentorship, onPress }) => {
  const handleRequest = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRequestMentorship();
  };

  const handleCardPress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const initials = mentor.name
    ? mentor.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  const getPhotoUrl = (): string | null => {
    const img = mentor.profileImage as unknown;
    if (!img) return null;
    if (typeof img === "string") return img;
    if (typeof img === "object" && img !== null && "url" in img) {
      return (img as { url?: string }).url || null;
    }
    return null;
  };
  const photoUrl = getPhotoUrl();

  return (
    <View className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 mb-3 shadow-xs">
      <TouchableOpacity
        onPress={handleCardPress}
        disabled={!onPress}
        activeOpacity={onPress ? 0.7 : 1}
        className="flex-row items-center mb-3"
      >
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} className="w-12 h-12 rounded-full mr-3" />
        ) : (
          <View className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/40 items-center justify-center mr-3">
            <Text className="text-sm font-bold text-red-700 dark:text-red-300">{initials}</Text>
          </View>
        )}
        <View className="flex-1">
          <Text className="text-sm font-bold text-slate-900 dark:text-white">{mentor.name}</Text>
          {mentor.currentPosition && mentor.company ? (
            <Text className="text-xs text-slate-500 dark:text-slate-400" numberOfLines={1}>
              {mentor.currentPosition} at {mentor.company}
            </Text>
          ) : mentor.currentPosition ? (
            <Text className="text-xs text-slate-500 dark:text-slate-400">{mentor.currentPosition}</Text>
          ) : null}
          {mentor.batchYear ? (
            <Text className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Batch {mentor.batchYear}
            </Text>
          ) : null}
        </View>
        {onPress ? (
          <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
        ) : null}
      </TouchableOpacity>

      {mentor.bio ? (
        <Text className="text-xs text-slate-600 dark:text-slate-400 mb-3 leading-4" numberOfLines={3}>
          {mentor.bio}
        </Text>
      ) : null}

      {mentor.skills && mentor.skills.length > 0 ? (
        <View className="flex-row flex-wrap gap-1.5 mb-3">
          {mentor.skills.slice(0, 5).map((skill, index) => (
            <View
              key={index}
              className="bg-red-50 dark:bg-red-950/60 border border-red-200/80 dark:border-red-800/80 px-2.5 py-1 rounded-full"
            >
              <Text className="text-[10px] font-semibold text-red-700 dark:text-red-300">
                {skill}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <TouchableOpacity
        onPress={handleRequest}
        activeOpacity={0.85}
        className="bg-red-800 active:bg-red-900 py-3 px-4 rounded-2xl flex-row items-center justify-center shadow-xs"
      >
        <Ionicons name="chatbubble-outline" size={15} color="white" />
        <Text className="text-white font-bold text-sm ml-2">Request Mentorship</Text>
      </TouchableOpacity>
    </View>
  );
};

export default MentorCard;
