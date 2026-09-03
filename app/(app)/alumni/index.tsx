import React, { useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useAlumniStats } from "@/features/alumni/hooks";
import { AlumniStatsRow } from "@/components/alumni/AlumniStatsRow";

interface CategoryCardProps {
  title: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  delay?: number;
  onPress: () => void;
}

function CategoryCard({ title, description, icon, color, bgColor, borderColor, delay = 0, onPress }: CategoryCardProps) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(280).springify().damping(20)} className="w-1/2 px-1.5 mb-3">
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} className={`${bgColor} ${borderColor} rounded-2xl p-4 shadow-xs`}>
        <View className={`w-11 h-11 rounded-xl ${bgColor} items-center justify-center mb-3`}>
          <Ionicons name={icon as any} size={22} color={color} />
        </View>
        <Text className="text-sm font-bold text-slate-900 dark:text-white mb-1">{title}</Text>
        <Text className="text-[11px] text-slate-500 dark:text-slate-400 leading-4">{description}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function AlumniDirectoryScreen() {
  const router = useRouter();
  const { stats, isLoading: statsLoading } = useAlumniStats();
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const navigate = (path: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(path as never);
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAFA] dark:bg-slate-950">
      <StatusBar style="auto" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#8B0000" />}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(260).springify().damping(20)} className="px-5 pt-3 pb-4">
          <View className="flex-row items-center justify-between mb-1">
            <TouchableOpacity onPress={handleBack} className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 items-center justify-center shadow-xs">
              <Ionicons name="arrow-back" size={18} color="#64748B" />
            </TouchableOpacity>
            <Text className="text-sm font-bold text-slate-900 dark:text-white">Alumni Network</Text>
            <View className="w-10" />
          </View>
        </Animated.View>

        {/* Stats */}
        {statsLoading ? (
          <Animated.View entering={FadeInDown.delay(60).duration(280).springify().damping(20)} className="px-4 mb-4">
            <View className="flex-row gap-2">
              {[1, 2, 3].map((i) => (
                <View key={i} className="flex-1 h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
              ))}
            </View>
          </Animated.View>
        ) : stats ? (
          <Animated.View entering={FadeInDown.delay(60).duration(280).springify().damping(20)} className="px-4 mb-4">
            <AlumniStatsRow
              alumniRegistered={stats.alumniRegistered || 0}
              totalRegistered={stats.totalRegistered || 0}
              followersConnections={stats.followersConnections || 0}
            />
          </Animated.View>
        ) : null}

        {/* Category Cards */}
        <View className="px-3 mt-1 flex-row flex-wrap">
          <CategoryCard
            title="Alumni Directory"
            description="Search & connect with alumni by name, batch, skills"
            icon="people-circle-outline"
            color="#8B0000"
            bgColor="bg-red-50 dark:bg-red-950/60"
            borderColor="border border-red-200/80 dark:border-red-800/80"
            delay={80}
            onPress={() => navigate("/(app)/alumni/directory")}
          />
          <CategoryCard
            title="Upcoming Events"
            description="College events, reunions, webinars & meetups"
            icon="calendar-outline"
            color="#7C3AED"
            bgColor="bg-purple-50 dark:bg-purple-950/60"
            borderColor="border border-purple-200/80 dark:border-purple-800/80"
            delay={120}
            onPress={() => navigate("/(app)/alumni/events")}
          />
          <CategoryCard
            title="Batches"
            description="Find people by batch year, reconnect with classmates"
            icon="people-outline"
            color="#0369A1"
            bgColor="bg-blue-50 dark:bg-blue-950/60"
            borderColor="border border-blue-200/80 dark:border-blue-800/80"
            delay={160}
            onPress={() => navigate("/(app)/alumni/batches")}
          />
          <CategoryCard
            title="SCIS Family"
            description="Explore all programs — MCA, M.Tech, IM.Tech & more"
            icon="heart-outline"
            color="#DC2626"
            bgColor="bg-rose-50 dark:bg-rose-950/60"
            borderColor="border border-rose-200/80 dark:border-rose-800/80"
            delay={200}
            onPress={() => navigate("/(app)/alumni/scis-family")}
          />
          <CategoryCard
            title="Companies"
            description="See where alumni work, find people at your target company"
            icon="business-outline"
            color="#059669"
            bgColor="bg-emerald-50 dark:bg-emerald-950/60"
            borderColor="border border-emerald-200/80 dark:border-emerald-800/80"
            delay={240}
            onPress={() => navigate("/(app)/alumni/companies")}
          />
          <CategoryCard
            title="Referral Hub"
            description="Ask for referrals, help others get referred"
            icon="git-pull-request-outline"
            color="#D97706"
            bgColor="bg-amber-50 dark:bg-amber-950/60"
            borderColor="border border-amber-200/80 dark:border-amber-800/80"
            delay={280}
            onPress={() => navigate("/(app)/alumni/referral")}
          />
          <CategoryCard
            title="Mentorship"
            description="Find mentors, request guidance from experienced alumni"
            icon="school-outline"
            color="#DC2626"
            bgColor="bg-rose-50 dark:bg-rose-950/60"
            borderColor="border border-rose-200/80 dark:border-rose-800/80"
            delay={320}
            onPress={() => navigate("/(app)/alumni/mentors")}
          />
          <CategoryCard
            title="Community"
            description="Posts, discussions, stories & questions from alumni"
            icon="chatbubbles-outline"
            color="#2563EB"
            bgColor="bg-blue-50 dark:bg-blue-950/60"
            borderColor="border border-blue-200/80 dark:border-blue-800/80"
            delay={360}
            onPress={() => navigate("/(app)/alumni/community")}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
