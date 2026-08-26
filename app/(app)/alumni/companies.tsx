import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useAlumniCompanies } from "@/features/alumni/hooks";
import { AlumniSearchBar } from "@/components/alumni/AlumniSearchBar";
import { CompanyCard } from "@/components/alumni/CompanyCard";
import { AlumniCard } from "@/components/alumni/AlumniCard";
import { AlumniUser } from "@/features/alumni/types";
import { logger } from "@/utils/logger";

export default function CompaniesScreen() {
  const router = useRouter();
  const { companies, isLoading, refetch } = useAlumniCompanies();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<{
    name: string;
    members: AlumniUser[];
  } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    logger.info("ALUMNI", "Company Hubs screen rendered");
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const filteredCompanies = companies.filter((c) =>
    c.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCompanyPress = (company: { company: string; members: { _id: string; name: string; roll_no?: string; currentPosition?: string; profileImage?: { url: string; publicId: string } }[] }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCompany({
      name: company.company,
      members: company.members.map((m) => ({ ...m, email: "" })) as AlumniUser[],
    });
  };

  const handleAlumniPress = (alumni: AlumniUser) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/(app)/alumni/profile",
      params: { data: JSON.stringify(alumni) },
    } as never);
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedCompany) {
      setSelectedCompany(null);
    } else {
      router.back();
    }
  };

  if (selectedCompany) {
    return (
      <SafeAreaView className="flex-1 bg-[#FAFAFA] dark:bg-slate-950">
        <StatusBar style="auto" />
        <ScrollView
          contentContainerStyle={{ paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            entering={FadeInDown.duration(260).springify().damping(20)}
            className="px-5 pt-3 pb-4"
          >
            <View className="flex-row items-center justify-between mb-4">
              <TouchableOpacity
                onPress={handleBack}
                className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 items-center justify-center shadow-xs"
              >
                <Ionicons name="arrow-back" size={18} color="#64748B" />
              </TouchableOpacity>
              <View className="flex-1 mx-3">
                <Text className="text-sm font-bold text-slate-900 dark:text-white text-center" numberOfLines={1}>
                  {selectedCompany.name}
                </Text>
                <Text className="text-[11px] text-slate-400 dark:text-slate-500 text-center">
                  {selectedCompany.members.length} alumni
                </Text>
              </View>
              <View className="w-10" />
            </View>

            <Text className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
              {selectedCompany.name}
            </Text>
            <Text className="text-sm text-slate-500 dark:text-slate-400 leading-5">
              Alumni working at this company
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(60).duration(300).springify().damping(20)} className="px-5">
            {selectedCompany.members.map((member) => (
              <AlumniCard
                key={member._id}
                alumni={member}
                onPress={() => handleAlumniPress(member)}
              />
            ))}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAFA] dark:bg-slate-950">
      <StatusBar style="auto" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#8B0000" />
        }
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(260).springify().damping(20)}
          className="px-5 pt-3 pb-4"
        >
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity
              onPress={handleBack}
              className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 items-center justify-center shadow-xs"
            >
              <Ionicons name="arrow-back" size={18} color="#64748B" />
            </TouchableOpacity>
            <View className="flex-row items-center bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/80 px-3 py-1.5 rounded-full">
              <Ionicons name="business" size={13} color="#2563EB" />
              <Text className="text-[11px] font-bold text-blue-700 dark:text-blue-300 ml-1.5">
                COMPANY HUBS
              </Text>
            </View>
            <View className="w-10" />
          </View>

          <Text className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
            Company Hubs
          </Text>
          <Text className="text-sm text-slate-500 dark:text-slate-400 leading-5">
            Find alumni at top companies worldwide
          </Text>
        </Animated.View>

        {/* Search */}
        <Animated.View entering={FadeInDown.delay(60).duration(280).springify().damping(20)} className="px-5">
          <AlumniSearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search companies..."
            showFilter={false}
          />
        </Animated.View>

        {/* Companies List */}
        <Animated.View entering={FadeInDown.delay(90).duration(300).springify().damping(20)} className="px-5">
          {isLoading ? (
            <View className="items-center py-12">
              <ActivityIndicator size="large" color="#8B0000" />
              <Text className="text-sm text-slate-400 dark:text-slate-500 mt-3">
                Loading companies...
              </Text>
            </View>
          ) : filteredCompanies.length === 0 ? (
            <View className="items-center py-12">
              <View className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/60 border border-red-200/80 dark:border-red-800/80 items-center justify-center mb-4">
                <Ionicons name="business-outline" size={28} color="#8B0000" />
              </View>
              <Text className="text-base font-bold text-slate-900 dark:text-white mb-1">
                No companies found
              </Text>
              <Text className="text-sm text-slate-500 dark:text-slate-400 text-center">
                {searchQuery ? "Try a different search term" : "No company data available yet"}
              </Text>
            </View>
          ) : (
            filteredCompanies.map((company) => (
              <CompanyCard
                key={company.company}
                company={company}
                onPress={() => handleCompanyPress(company)}
              />
            ))
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
