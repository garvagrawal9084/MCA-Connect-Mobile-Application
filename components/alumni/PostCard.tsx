import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { CommunityPost } from "@/features/alumni/types";

interface PostCardProps {
  post: CommunityPost;
  onLike: () => void;
  onPress?: () => void;
  onAuthorPress?: () => void;
}

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: string }> = {
  post: { label: "Post", color: "#64748B", bg: "#F8FAFC", border: "#E2E8F0", icon: "chatbubble-outline" },
  job: { label: "Job", color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0", icon: "briefcase-outline" },
  story: { label: "Story", color: "#7C3AED", bg: "#FAF5FF", border: "#E9D5FF", icon: "book-outline" },
  question: { label: "Question", color: "#EA580C", bg: "#FFF7ED", border: "#FED7AA", icon: "help-circle-outline" },
  referral: { label: "Referral", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", icon: "git-pull-request-outline" },
};

export const PostCard: React.FC<PostCardProps> = ({ post, onLike, onPress, onAuthorPress }) => {
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

  const typeConfig = TYPE_CONFIG[post.type] || TYPE_CONFIG.post;

  const authorInitials = post.author?.name
    ? post.author.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  const getPhotoUrl = (): string | null => {
    const img = post.author?.profileImage as unknown;
    if (!img) return null;
    if (typeof img === "string") return img;
    if (typeof img === "object" && img !== null && "url" in img) {
      return (img as { url?: string }).url || null;
    }
    return null;
  };
  const photoUrl = getPhotoUrl();

  const timeAgo = (() => {
    const now = Date.now();
    const created = new Date(post.createdAt).getTime();
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
            <View className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center mr-3">
              <Text className="text-xs font-bold text-slate-600 dark:text-slate-400">{authorInitials}</Text>
            </View>
          )}
          <View className="flex-1">
            <Text className="text-sm font-bold text-slate-900 dark:text-white" numberOfLines={1}>
              {post.author?.name || "Anonymous"}
            </Text>
            <View className="flex-row items-center">
              {post.author?.currentPosition ? (
                <Text className="text-[11px] text-slate-400 dark:text-slate-500" numberOfLines={1}>
                  {post.author.currentPosition}
                </Text>
              ) : null}
              <Text className="text-[11px] text-slate-400 dark:text-slate-500"> · {timeAgo}</Text>
            </View>
          </View>
        </TouchableOpacity>

        <View
          className="px-2 py-1 rounded-full flex-row items-center"
          style={{ backgroundColor: typeConfig.bg, borderColor: typeConfig.border, borderWidth: 1 }}
        >
          <Ionicons
            name={typeConfig.icon as keyof typeof Ionicons.glyphMap}
            size={10}
            color={typeConfig.color}
          />
          <Text className="text-[10px] font-semibold ml-1" style={{ color: typeConfig.color }}>
            {typeConfig.label}
          </Text>
        </View>
      </View>

      <Text className="text-sm text-slate-700 dark:text-slate-300 leading-5 mb-3">{post.content}</Text>

      {post.tags && post.tags.length > 0 && (
        <View className="flex-row flex-wrap gap-1.5 mb-3">
          {post.tags.map((tag, index) => (
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
            name={post.isLiked ? "heart" : "heart-outline"}
            size={17}
            color={post.isLiked ? "#EF4444" : "#94A3B8"}
          />
          <Text className="text-xs text-slate-500 dark:text-slate-400 ml-1.5">
            {post.likeCount || post.likes?.length || 0}
          </Text>
        </TouchableOpacity>

        <View className="flex-row items-center mr-5">
          <Ionicons name="chatbubble-outline" size={15} color="#94A3B8" />
          <Text className="text-xs text-slate-500 dark:text-slate-400 ml-1.5">
            {post.commentCount || post.comments?.length || 0}
          </Text>
        </View>

        <View className="flex-row items-center">
          <Ionicons name="eye-outline" size={15} color="#94A3B8" />
          <Text className="text-xs text-slate-500 dark:text-slate-400 ml-1.5">{post.views || 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default PostCard;
