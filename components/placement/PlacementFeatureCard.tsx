import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { PlacementFeatureItem } from "@/features/placement/types";

interface PlacementFeatureCardProps {
  item: PlacementFeatureItem;
  delay?: number;
  onPress: () => void;
}

export const PlacementFeatureCard: React.FC<PlacementFeatureCardProps> = ({
  item,
  delay = 0,
  onPress,
}) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(280).springify().damping(20)}
      className="w-1/2 px-1.5 mb-3"
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.75}
        className={`bg-white dark:bg-slate-900 border ${item.borderColor} rounded-2xl p-4 shadow-xs relative min-h-[148px] justify-between`}
      >
        {/* Top row: Icon + Badge (if any) */}
        <View className="flex-row items-start justify-between mb-2.5">
          <View
            className={`w-11 h-11 rounded-xl ${item.bgColor} items-center justify-center`}
          >
            <Ionicons name={item.icon as any} size={22} color={item.color} />
          </View>

          {item.badge && (
            <View
              className={`px-2 py-0.5 rounded-full ${
                item.badgeColor || "bg-[#8B0000]"
              } shadow-xs`}
            >
              <Text className="text-[10px] font-black text-white tracking-wide">
                {item.badge}
              </Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View>
          <Text
            className="text-sm font-bold text-slate-900 dark:text-white mb-1 tracking-tight"
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text
            className="text-[11px] text-slate-500 dark:text-slate-400 leading-4"
            numberOfLines={2}
          >
            {item.description}
          </Text>
        </View>

        {/* Bottom Chevron / Action Indicator */}
        <View className="flex-row items-center justify-end mt-2 pt-1 border-t border-slate-100/80 dark:border-slate-800/80">
          <Ionicons name="chevron-forward" size={13} color="#94A3B8" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default PlacementFeatureCard;
