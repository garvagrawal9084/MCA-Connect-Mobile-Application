import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { ForumTopic } from "@/features/alumni/types";

interface ForumTopicCardProps {
  topic: ForumTopic;
  onLike: () => void;
  onPress?: () => void;
  onAuthorPress?: () => void;
}

const getProfileImage = (profileImage: unknown): string | null => {
  if (!profileImage) return null;
  if (typeof profileImage === "string") return profileImage;
  if (typeof profileImage === "object" && profileImage !== null) {
    return (profileImage as { url?: string }).url || null;
  }
  return null;
};

export const ForumTopicCard: React.FC<ForumTopicCardProps> = ({ topic, onLike, onPress, onAuthorPress }) => {
  const handleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onLike();
  };

  const handleAuthorPress = () => {
    if (onAuthorPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onAuthorPress();
    }
  };

  const authorInitials = topic.author?.name
    ? topic.author.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  const photoUrl = getProfileImage(topic.author?.profileImage);

  const timeAgo = (() => {
    const now = Date.now();
    const created = new Date(topic.createdAt).getTime();
    const diffMs = now - created;
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  })();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 mb-3 shadow-xs"
    >
      <View className="flex-row items-center mb-3">
        <TouchableOpacity
          onPress={handleAuthorPress}
          disabled={!onAuthorPress}
          activeOpacity={onAuthorPress ? 0.7 : 1}
          className="flex-row items-center flex-1 mr-2"
        >
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} className="w-10 h-10 rounded-full mr-3" />
          ) : (
            <View className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 items-center justify-center mr-3">
              <Text className="text-xs font-bold text-red-700 dark:text-red-300">{authorInitials}</Text>
            </View>
          )}
          <View className="flex-1">
            <Text className="text-sm font-bold text-slate-900 dark:text-white" numberOfLines={1}>
              {topic.author?.name || "Anonymous"}
            </Text>
            <Text className="text-[11px] text-slate-400 dark:text-slate-500">{timeAgo}</Text>
          </View>
        </TouchableOpacity>

        <View className="flex-row items-center bg-red-50 dark:bg-red-950/60 border border-red-200/80 dark:border-red-800/80 px-2 py-1 rounded-full">
          <Ionicons name="chatbubbles-outline" size={10} color="#8B0000" />
          <Text className="text-[10px] font-semibold text-red-800 dark:text-red-300 ml-1">
            FORUM
          </Text>
        </View>
      </View>

      <Text className="text-base font-bold text-slate-900 dark:text-white mb-1">{topic.title}</Text>
      <Text className="text-sm text-slate-700 dark:text-slate-300 leading-5 mb-3" numberOfLines={3}>
        {topic.content}
      </Text>

      {topic.tags && topic.tags.length > 0 && (
        <View className="flex-row flex-wrap gap-1.5 mb-3">
          {topic.tags.map((tag, index) => (
            <View
              key={index}
              className="bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 px-2 py-0.5 rounded-full"
            >
              <Text className="text-[10px] font-medium text-slate-500 dark:text-slate-400">#{tag}</Text>
            </View>
          ))}
        </View>
      )}

      <View className="flex-row items-center border-t border-slate-100 dark:border-slate-800 pt-3">
        <TouchableOpacity
          onPress={handleLike}
          className="flex-row items-center mr-5"
          activeOpacity={0.7}
        >
          <Ionicons
            name={topic.isLiked ? "heart" : "heart-outline"}
            size={17}
            color={topic.isLiked ? "#EF4444" : "#94A3B8"}
          />
          <Text className="text-xs text-slate-500 dark:text-slate-400 ml-1.5">
            {topic.likeCount || topic.likes?.length || 0}
          </Text>
        </TouchableOpacity>

        <View className="flex-row items-center mr-5">
          <Ionicons name="chatbubble-outline" size={15} color="#94A3B8" />
          <Text className="text-xs text-slate-500 dark:text-slate-400 ml-1.5">
            {topic.replyCount || topic.replies?.length || 0}
          </Text>
        </View>

        <View className="flex-row items-center">
          <Ionicons name="eye-outline" size={15} color="#94A3B8" />
          <Text className="text-xs text-slate-500 dark:text-slate-400 ml-1.5">{topic.views || 0}</Text>
        </View>

        {topic.closed && (
          <View className="flex-row items-center ml-auto">
            <Ionicons name="lock-closed-outline" size={13} color="#EF4444" />
            <Text className="text-[10px] font-semibold text-red-500 ml-1">Closed</Text>
          </View>
        )}

        {topic.pinned && (
          <View className="flex-row items-center ml-auto">
            <Ionicons name="pin-outline" size={13} color="#F59E0B" />
            <Text className="text-[10px] font-semibold text-amber-500 ml-1">Pinned</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default ForumTopicCard;
