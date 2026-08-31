import React, { useState } from "react";
import {
  View,
  Text,
  Alert,
  ScrollView,
  TouchableOpacity,
  Linking,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { useAuthStore } from "@/features/auth/authStore";
import { useProfile } from "@/features/profile/hooks";
import { logger } from "@/utils/logger";

export default function ProfileScreen() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const { profile, isRefreshing, refreshProfile } = useProfile();
  const [bioExpanded, setBioExpanded] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out of SCIS Connect?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            logger.info("AUTH", "User signed out from profile screen", {
              email: profile?.email,
            });
            logout();
            router.replace("/(auth)/login");
          },
        },
      ]
    );
  };

  const openLink = async (url?: string) => {
    if (!url) return;
    let formatted = url.trim();
    if (!formatted.startsWith("http://") && !formatted.startsWith("https://")) {
      formatted = `https://${formatted}`;
    }
    try {
      Haptics.selectionAsync();
      const supported = await Linking.canOpenURL(formatted);
      if (supported) {
        await Linking.openURL(formatted);
      } else {
        Alert.alert("Notice", `Cannot open link: ${formatted}`);
      }
    } catch {
      Alert.alert("Error", "Unable to open the selected link.");
    }
  };

  // Safe data access
  const profileImage =
    profile?.profileImage || profile?.avatar || profile?.avatarUrl;
  const name = profile?.name || "Student";
  const rollNo = profile?.roll_no || profile?.studentId;
  const programTitle =
    profile?.program?.name ||
    profile?.program?.code ||
    profile?.course ||
    (profile?.education?.postGraduation?.degree
      ? `${profile.education.postGraduation.degree} · ${profile.education.postGraduation.collegeName || "SCIS"}`
      : "SCIS Department");
  const currentSemester =
    profile?.semester || profile?.education?.postGraduation?.currentSemester;
  const cgpa =
    profile?.education?.postGraduation?.cgpa ||
    profile?.education?.graduation?.cgpa;
  const leetcode = profile?.leetcode_profiles?.[0];
  const projects = profile?.projects || [];
  const skills = profile?.skills || [];
  const resumes = profile?.resumes || [];
  const education = profile?.education;
  const sgpaList = profile?.sgpa || [];

  const hasHighlights = Boolean(
    (cgpa !== undefined && cgpa !== null) ||
    leetcode?.totalSolved !== undefined ||
    projects.length > 0 ||
    skills.length > 0
  );

  const hasCodingProfiles = Boolean(
    profile?.github ||
    profile?.linkedin ||
    leetcode ||
    profile?.gfg ||
    profile?.codeforces
  );

  const hasEducation = Boolean(
    education?.postGraduation?.degree ||
    education?.graduation?.degree ||
    education?.twelfth?.schoolName ||
    education?.tenth?.schoolName
  );

  const hasResumes = Boolean(
    resumes.length > 0 || profile?.resumeLink
  );

  const hasContact = Boolean(
    profile?.universityEmail ||
    profile?.personalEmail ||
    profile?.contact?.mobile ||
    profile?.location ||
    profile?.id ||
    profile?._id
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC] dark:bg-slate-950 px-5 pt-3">
      <StatusBar style="auto" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 130 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshProfile}
            tintColor="#8B0000"
            colors={["#8B0000"]}
          />
        }
      >
        {/* Header Title */}
        <Animated.View
          entering={FadeInDown.duration(240).springify().damping(20)}
          className="flex-row items-center justify-between mb-4"
        >
          <View>
            <Text className="text-xs font-black text-red-800 dark:text-red-400 tracking-wider">
              SCIS CONNECT
            </Text>
            <Text className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Student Profile
            </Text>
          </View>

          {/* Quick Refresh Icon */}
          <TouchableOpacity
            onPress={refreshProfile}
            className="w-9 h-9 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 items-center justify-center shadow-xs"
            activeOpacity={0.7}
          >
            <Ionicons name="refresh-outline" size={17} color="#64748B" />
          </TouchableOpacity>
        </Animated.View>

        {/* Profile Card Header */}
        <Animated.View
          entering={FadeInDown.delay(50).duration(260).springify().damping(20)}
        >
          <Card className="items-center py-6 mb-4 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
            {/* Top Accent Gradient Bar */}
            <View className="absolute top-0 left-0 right-0 h-2 bg-red-800 dark:bg-red-700" />

            {/* Profile Avatar / Photo */}
            <View className="relative mb-3 mt-1">
              <View className="p-1 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-red-800/30 dark:border-red-600/40">
                <Avatar
                  uri={profileImage}
                  name={name}
                  size={88}
                  showStatus={profile?.isActive !== false}
                  statusColor="#10B981"
                />
              </View>
            </View>

            {/* Student Name */}
            <Text className="text-xl font-black text-slate-900 dark:text-white text-center tracking-tight">
              {name}
            </Text>

            {/* Roll No & Program */}
            <View className="flex-row flex-wrap items-center justify-center gap-1.5 mt-1 mb-2.5">
              {rollNo && (
                <View className="bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-md border border-slate-200/80 dark:border-slate-700">
                  <Text className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    {rollNo}
                  </Text>
                </View>
              )}
              <View className="bg-red-50 dark:bg-red-950/60 px-2.5 py-0.5 rounded-md border border-red-200 dark:border-red-800">
                <Text className="text-xs font-semibold text-red-800 dark:text-red-300">
                  {programTitle}
                </Text>
              </View>
              {currentSemester && (
                <View className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200/80 dark:border-slate-700">
                  <Text className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Sem {currentSemester}
                  </Text>
                </View>
              )}
            </View>

            {/* Status Pills */}
            <View className="flex-row flex-wrap items-center justify-center gap-2 mt-1">
              {profile?.openToWork && (
                <View className="flex-row items-center bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <View className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                  <Text className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                    Open to Work
                  </Text>
                </View>
              )}
              {profile?.placementStatus && (
                <View className="flex-row items-center bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                  <Ionicons name="briefcase-outline" size={11} color="#B45309" />
                  <Text className="text-[11px] font-bold text-amber-700 dark:text-amber-300 ml-1">
                    {profile.placementStatus}
                  </Text>
                </View>
              )}
              {profile?.communityStatus && (
                <View className="flex-row items-center bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                  <Ionicons name="school-outline" size={11} color="#64748B" />
                  <Text className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 ml-1">
                    {profile.communityStatus}
                  </Text>
                </View>
              )}
            </View>
          </Card>
        </Animated.View>

        {/* Quick Highlights / Metrics Grid */}
        {hasHighlights ? (
          <Animated.View
            entering={FadeInDown.delay(100).duration(260).springify().damping(20)}
            className="flex-row gap-2.5 mb-4"
          >
            {cgpa !== undefined && cgpa !== null && (
              <View className="flex-1 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 items-center shadow-xs">
                <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  CGPA
                </Text>
                <Text className="text-xl font-black text-red-800 dark:text-red-400 mt-0.5">
                  {cgpa}
                </Text>
                <Text className="text-[10px] text-slate-500 font-medium mt-0.5">
                  Academics
                </Text>
              </View>
            )}

            {leetcode?.totalSolved !== undefined && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() =>
                  openLink(
                    `https://leetcode.com/u/${leetcode.username || profile?.leetcode_profiles?.[0]?.username}`
                  )
                }
                className="flex-1 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 items-center shadow-xs"
              >
                <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  LeetCode
                </Text>
                <Text className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
                  {leetcode.totalSolved}
                </Text>
                <Text className="text-[10px] text-slate-500 font-medium mt-0.5">
                  Solved
                </Text>
              </TouchableOpacity>
            )}

            {projects.length > 0 && (
              <View className="flex-1 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 items-center shadow-xs">
                <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Projects
                </Text>
                <Text className="text-xl font-black text-slate-800 dark:text-white mt-0.5">
                  {projects.length}
                </Text>
                <Text className="text-[10px] text-slate-500 font-medium mt-0.5">
                  Featured
                </Text>
              </View>
            )}

            {skills.length > 0 && (
              <View className="flex-1 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 items-center shadow-xs">
                <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Skills
                </Text>
                <Text className="text-xl font-black text-slate-800 dark:text-white mt-0.5">
                  {skills.length}
                </Text>
                <Text className="text-[10px] text-slate-500 font-medium mt-0.5">
                  Stack
                </Text>
              </View>
            )}
          </Animated.View>
        ) : null}

        {/* Bio Section */}
        {profile?.bio ? (
          <Animated.View
            entering={FadeInDown.delay(140).duration(260).springify().damping(20)}
            className="mb-4"
          >
            <Card className="border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center">
                  <Ionicons name="finger-print-outline" size={16} color="#8B0000" />
                  <Text className="text-sm font-bold text-slate-900 dark:text-white ml-1.5">
                    About & Bio
                  </Text>
                </View>
                {profile.bio.length > 180 && (
                  <TouchableOpacity
                    onPress={() => setBioExpanded(!bioExpanded)}
                    activeOpacity={0.7}
                  >
                    <Text className="text-xs font-bold text-red-800 dark:text-red-400">
                      {bioExpanded ? "Show Less" : "Read More"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text
                numberOfLines={bioExpanded ? undefined : 4}
                className="text-xs text-slate-600 dark:text-slate-300 leading-5"
              >
                {profile.bio}
              </Text>
            </Card>
          </Animated.View>
        ) : null}

        {/* Skills & Technologies */}
        {skills.length > 0 ? (
          <Animated.View
            entering={FadeInDown.delay(180).duration(260).springify().damping(20)}
            className="mb-4"
          >
            <Card className="border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
              <View className="flex-row items-center mb-3">
                <Ionicons name="code-slash-outline" size={16} color="#8B0000" />
                <Text className="text-sm font-bold text-slate-900 dark:text-white ml-1.5">
                  Technical Skills & Stack
                </Text>
              </View>
              <View className="flex-row flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <View
                    key={index}
                    className="bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 px-3 py-1 rounded-lg"
                  >
                    <Text className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {skill}
                    </Text>
                  </View>
                ))}
              </View>
            </Card>
          </Animated.View>
        ) : null}

        {/* Projects Showcase */}
        {projects.length > 0 ? (
          <Animated.View
            entering={FadeInDown.delay(220).duration(260).springify().damping(20)}
            className="mb-4"
          >
            <View className="flex-row items-center justify-between mb-2 px-1">
              <View className="flex-row items-center">
                <Ionicons name="layers-outline" size={16} color="#8B0000" />
                <Text className="text-sm font-bold text-slate-900 dark:text-white ml-1.5">
                  Featured Projects ({projects.length})
                </Text>
              </View>
            </View>

            <View className="gap-3">
              {projects.map((proj, idx) => (
                <Card
                  key={proj._id || proj.id || idx}
                  className="border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs"
                >
                  <View className="flex-row items-start justify-between">
                    <Text className="text-sm font-extrabold text-slate-900 dark:text-white flex-1 mr-2">
                      {proj.title}
                    </Text>
                    {proj.link && (
                      <TouchableOpacity
                        onPress={() => openLink(proj.link)}
                        className="bg-red-50 dark:bg-red-950/60 p-1.5 rounded-md border border-red-200 dark:border-red-800"
                        activeOpacity={0.7}
                      >
                        <Ionicons name="open-outline" size={14} color="#8B0000" />
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-4.5">
                    {proj.description}
                  </Text>
                  {proj.link && (
                    <TouchableOpacity
                      onPress={() => openLink(proj.link)}
                      className="mt-3 flex-row items-center"
                      activeOpacity={0.7}
                    >
                      <Ionicons name="logo-github" size={13} color="#475569" />
                      <Text
                        numberOfLines={1}
                        className="text-[11px] font-semibold text-red-800 dark:text-red-400 ml-1 flex-1"
                      >
                        {proj.link}
                      </Text>
                    </TouchableOpacity>
                  )}
                </Card>
              ))}
            </View>
          </Animated.View>
        ) : null}

        {/* Coding & Social Profiles */}
        {hasCodingProfiles ? (
          <Animated.View
            entering={FadeInDown.delay(260).duration(260).springify().damping(20)}
            className="mb-4"
          >
            <Card className="border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
              <View className="flex-row items-center mb-3">
                <Ionicons name="globe-outline" size={16} color="#8B0000" />
                <Text className="text-sm font-bold text-slate-900 dark:text-white ml-1.5">
                  Coding & Professional Profiles
                </Text>
              </View>

              <View className="gap-2.5">
                {profile?.github ? (
                  <TouchableOpacity
                    onPress={() => openLink(profile.github)}
                    className="flex-row items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800"
                    activeOpacity={0.7}
                  >
                    <View className="flex-row items-center flex-1 mr-2">
                      <Ionicons name="logo-github" size={18} color="#1E293B" />
                      <View className="ml-2.5 flex-1">
                        <Text className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          GitHub
                        </Text>
                        <Text
                          numberOfLines={1}
                          className="text-[10px] text-slate-500 font-mono"
                        >
                          {profile.github}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
                  </TouchableOpacity>
                ) : null}

                {profile?.linkedin ? (
                  <TouchableOpacity
                    onPress={() => openLink(profile.linkedin)}
                    className="flex-row items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800"
                    activeOpacity={0.7}
                  >
                    <View className="flex-row items-center flex-1 mr-2">
                      <Ionicons name="logo-linkedin" size={18} color="#0A66C2" />
                      <View className="ml-2.5 flex-1">
                        <Text className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          LinkedIn
                        </Text>
                        <Text
                          numberOfLines={1}
                          className="text-[10px] text-slate-500 font-mono"
                        >
                          {profile.linkedin}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
                  </TouchableOpacity>
                ) : null}

                {leetcode ? (
                  <TouchableOpacity
                    onPress={() =>
                      openLink(`https://leetcode.com/u/${leetcode.username}`)
                    }
                    className="flex-row items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800"
                    activeOpacity={0.7}
                  >
                    <View className="flex-row items-center flex-1 mr-2">
                      <Ionicons name="code-working-outline" size={18} color="#F59E0B" />
                      <View className="ml-2.5 flex-1">
                        <Text className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          LeetCode ({leetcode.totalSolved} solved)
                        </Text>
                        <Text className="text-[10px] text-slate-500 font-mono">
                          @{leetcode.username}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
                  </TouchableOpacity>
                ) : null}

                {profile?.gfg ? (
                  <TouchableOpacity
                    onPress={() => openLink(profile.gfg)}
                    className="flex-row items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800"
                    activeOpacity={0.7}
                  >
                    <View className="flex-row items-center flex-1 mr-2">
                      <Ionicons name="terminal-outline" size={18} color="#10B981" />
                      <View className="ml-2.5 flex-1">
                        <Text className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          GeeksforGeeks
                        </Text>
                        <Text
                          numberOfLines={1}
                          className="text-[10px] text-slate-500 font-mono"
                        >
                          {profile.gfg}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
                  </TouchableOpacity>
                ) : null}

                {profile?.codeforces ? (
                  <TouchableOpacity
                    onPress={() => openLink(profile.codeforces)}
                    className="flex-row items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800"
                    activeOpacity={0.7}
                  >
                    <View className="flex-row items-center flex-1 mr-2">
                      <Ionicons name="trophy-outline" size={18} color="#EF4444" />
                      <View className="ml-2.5 flex-1">
                        <Text className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Codeforces
                        </Text>
                        <Text
                          numberOfLines={1}
                          className="text-[10px] text-slate-500 font-mono"
                        >
                          {profile.codeforces}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
                  </TouchableOpacity>
                ) : null}
              </View>
            </Card>
          </Animated.View>
        ) : null}

        {/* Academic Education Timeline */}
        {hasEducation && education ? (
          <Animated.View
            entering={FadeInDown.delay(300).duration(260).springify().damping(20)}
            className="mb-4"
          >
            <Card className="border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
              <View className="flex-row items-center mb-3">
                <Ionicons name="school-outline" size={16} color="#8B0000" />
                <Text className="text-sm font-bold text-slate-900 dark:text-white ml-1.5">
                  Academic Background
                </Text>
              </View>

              <View className="gap-3">
                {/* Post Graduation */}
                {education.postGraduation?.degree && (
                  <View className="p-3 bg-red-50/50 dark:bg-red-950/20 rounded-lg border border-red-100 dark:border-red-900/40">
                    <View className="flex-row justify-between items-center">
                      <Text className="text-xs font-black text-red-900 dark:text-red-300">
                        {education.postGraduation.degree} · Post Graduation
                      </Text>
                      {education.postGraduation.cgpa && (
                        <Text className="text-xs font-extrabold text-red-800 dark:text-red-400">
                          CGPA: {education.postGraduation.cgpa}
                        </Text>
                      )}
                    </View>
                    <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">
                      {education.postGraduation.collegeName} (
                      {education.postGraduation.university})
                    </Text>

                    {/* SGPA semester pills */}
                    {sgpaList.length > 0 && (
                      <View className="flex-row flex-wrap gap-1.5 mt-2 pt-2 border-t border-red-200/60 dark:border-red-900/60">
                        {sgpaList.map((item) => (
                          <View
                            key={item._id || item.sem}
                            className="bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-red-200 dark:border-red-800"
                          >
                            <Text className="text-[10px] font-bold text-slate-800 dark:text-slate-200">
                              Sem {item.sem}:{" "}
                              <Text className="text-red-800 dark:text-red-400">
                                {item.sgpa}
                              </Text>
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}

                {/* Graduation */}
                {education.graduation?.degree && (
                  <View className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-800">
                    <View className="flex-row justify-between items-center">
                      <Text className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {education.graduation.degree} · Graduation (
                        {education.graduation.passingYear})
                      </Text>
                      {education.graduation.cgpa && (
                        <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          CGPA: {education.graduation.cgpa}
                        </Text>
                      )}
                    </View>
                    <Text className="text-xs text-slate-500 mt-0.5">
                      {education.graduation.collegeName} ·{" "}
                      {education.graduation.university}
                    </Text>
                  </View>
                )}

                {/* 12th & 10th */}
                <View className="flex-row gap-2">
                  {education.twelfth?.schoolName && (
                    <View className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-800">
                      <Text className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        12th ({education.twelfth.passingYear})
                      </Text>
                      <Text className="text-[11px] font-black text-slate-900 dark:text-white mt-0.5">
                        {education.twelfth.percentage}%
                      </Text>
                      <Text
                        numberOfLines={1}
                        className="text-[10px] text-slate-500 mt-0.5"
                      >
                        {education.twelfth.schoolName}
                      </Text>
                    </View>
                  )}

                  {education.tenth?.schoolName && (
                    <View className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-800">
                      <Text className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        10th ({education.tenth.passingYear})
                      </Text>
                      <Text className="text-[11px] font-black text-slate-900 dark:text-white mt-0.5">
                        {education.tenth.percentage}%
                      </Text>
                      <Text
                        numberOfLines={1}
                        className="text-[10px] text-slate-500 mt-0.5"
                      >
                        {education.tenth.schoolName}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </Card>
          </Animated.View>
        ) : null}

        {/* Resumes & Documents */}
        {hasResumes ? (
          <Animated.View
            entering={FadeInDown.delay(340).duration(260).springify().damping(20)}
            className="mb-4"
          >
            <Card className="border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
              <View className="flex-row items-center mb-3">
                <Ionicons name="document-text-outline" size={16} color="#8B0000" />
                <Text className="text-sm font-bold text-slate-900 dark:text-white ml-1.5">
                  Resumes & Documents
                </Text>
              </View>

              <View className="gap-2">
                {resumes.map((resume, idx) => (
                  <TouchableOpacity
                    key={resume.id || resume._id || idx}
                    onPress={() => openLink(resume.url)}
                    className="flex-row items-center justify-between p-3 rounded-lg bg-red-50/60 dark:bg-red-950/30 border border-red-200/80 dark:border-red-900/50"
                    activeOpacity={0.7}
                  >
                    <View className="flex-row items-center flex-1 mr-2">
                      <Ionicons name="document-attach" size={18} color="#8B0000" />
                      <View className="ml-2.5 flex-1">
                        <Text className="text-xs font-bold text-red-950 dark:text-red-200">
                          {resume.title || "Student Resume"}
                          {resume.isPrimary && " (Primary)"}
                        </Text>
                        <Text className="text-[10px] text-slate-500">
                          Tap to view or download PDF
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="download-outline" size={16} color="#8B0000" />
                  </TouchableOpacity>
                ))}

                {profile?.resumeLink ? (
                  <TouchableOpacity
                    onPress={() => openLink(profile.resumeLink)}
                    className="flex-row items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800"
                    activeOpacity={0.7}
                  >
                    <View className="flex-row items-center flex-1 mr-2">
                      <Ionicons name="cloud-outline" size={18} color="#475569" />
                      <View className="ml-2.5 flex-1">
                        <Text className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Google Drive Resume Link
                        </Text>
                        <Text
                          numberOfLines={1}
                          className="text-[10px] text-slate-500 font-mono"
                        >
                          {profile.resumeLink}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="open-outline" size={15} color="#64748B" />
                  </TouchableOpacity>
                ) : null}
              </View>
            </Card>
          </Animated.View>
        ) : null}

        {/* Contact & Account Details */}
        {hasContact ? (
          <Animated.View
            entering={FadeInDown.delay(380).duration(260).springify().damping(20)}
            className="mb-5"
          >
            <Card className="border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
              <View className="flex-row items-center mb-3">
                <Ionicons name="person-circle-outline" size={16} color="#8B0000" />
                <Text className="text-sm font-bold text-slate-900 dark:text-white ml-1.5">
                  Contact & Account Details
                </Text>
              </View>

              <View className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {profile?.universityEmail && (
                  <View className="py-2 flex-row justify-between items-center">
                    <Text className="text-xs text-slate-500 font-medium">
                      University Email
                    </Text>
                    <View className="flex-row items-center">
                      <Text className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 mr-1">
                        {profile.universityEmail}
                      </Text>
                      {profile.universityEmailVerified && (
                        <Ionicons
                          name="checkmark-circle"
                          size={14}
                          color="#10B981"
                        />
                      )}
                    </View>
                  </View>
                )}

                {profile?.personalEmail && (
                  <View className="py-2 flex-row justify-between items-center">
                    <Text className="text-xs text-slate-500 font-medium">
                      Personal Email
                    </Text>
                    <View className="flex-row items-center">
                      <Text className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 mr-1">
                        {profile.personalEmail}
                      </Text>
                      {profile.personalEmailVerified && (
                        <Ionicons
                          name="checkmark-circle"
                          size={14}
                          color="#10B981"
                        />
                      )}
                    </View>
                  </View>
                )}

                {profile?.contact?.mobile ? (
                  <View className="py-2 flex-row justify-between items-center">
                    <Text className="text-xs text-slate-500 font-medium">Phone</Text>
                    <Text className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {profile.contact.mobile}
                    </Text>
                  </View>
                ) : null}

                {profile?.location ? (
                  <View className="py-2 flex-row justify-between items-center">
                    <Text className="text-xs text-slate-500 font-medium">Location</Text>
                    <Text className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {profile.location}
                    </Text>
                  </View>
                ) : null}

                <View className="py-2 flex-row justify-between items-center">
                  <Text className="text-xs text-slate-500 font-medium">Account ID</Text>
                  <Text className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400">
                    {profile?.id || profile?._id || "N/A"}
                  </Text>
                </View>
              </View>
            </Card>
          </Animated.View>
        ) : null}

        {/* Sign Out Button */}
        <Animated.View
          entering={FadeInDown.delay(420).duration(260).springify().damping(20)}
        >
          <Button
            title="Sign Out"
            variant="outline"
            onPress={handleLogout}
            leftIcon={<Ionicons name="log-out-outline" size={18} color="#EF4444" />}
            className="border-red-300 dark:border-red-800 py-3.5"
            textClassName="text-red-600 dark:text-red-400 font-bold"
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
