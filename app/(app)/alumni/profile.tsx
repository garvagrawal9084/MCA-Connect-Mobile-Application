import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Linking,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "@/services/api";
import { useMentorshipRequests } from "@/features/alumni/hooks";
import { AlumniUser } from "@/features/alumni/types";
import { logger } from "@/utils/logger";

function Section({ title, delay = 0, children }: { title: string; delay?: number; children: React.ReactNode }) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(280).springify().damping(20)} className="px-5 mb-4">
      <View className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
        <Text className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">{title}</Text>
        {children}
      </View>
    </Animated.View>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value?: string }) {
  if (!value) return null;
  return (
    <View className="flex-row items-center py-1.5">
      <Ionicons name={icon as any} size={15} color="#94A3B8" />
      <Text className="text-xs text-slate-500 dark:text-slate-400 ml-2 w-20">{label}</Text>
      <Text className="text-sm text-slate-800 dark:text-slate-200 flex-1">{value}</Text>
    </View>
  );
}

function EducationCard({ label, data }: { label: string; data?: any }) {
  if (!data || (!data.degree && !data.schoolName && !data.collegeName)) return null;
  const name = data.degree || data.schoolName || data.collegeName || "";
  const score = data.cgpa ? `CGPA: ${data.cgpa}` : data.percentage ? `${data.percentage}%` : "";
  const year = data.passingYear || data.expectedGraduationYear;
  const uni = data.university || data.board || "";
  return (
    <View className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 mb-2">
      <Text className="text-xs font-bold text-red-800 dark:text-red-300 uppercase">{label}</Text>
      {name ? <Text className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">{name}</Text> : null}
      {uni ? <Text className="text-xs text-slate-500 dark:text-slate-400">{uni}</Text> : null}
      <View className="flex-row gap-3 mt-1">
        {score ? <Text className="text-xs text-slate-600 dark:text-slate-300">{score}</Text> : null}
        {year ? <Text className="text-xs text-slate-600 dark:text-slate-300">Year: {year}</Text> : null}
      </View>
    </View>
  );
}

interface ProfileData {
  _id?: string;
  id?: string;
  name: string;
  email?: string;
  roll_no?: string;
  bio?: string;
  linkedin?: string;
  github?: string;
  gfg?: string;
  codeforces?: string;
  codechef?: string;
  company?: string;
  currentPosition?: string;
  location?: string;
  skills?: string[];
  batchYear?: number | string;
  program?: { _id: string; name: string; code: string } | null;
  communityStatus?: string;
  openToWork?: boolean;
  availableForReferral?: boolean;
  availableForMentorship?: boolean;
  placementStatus?: string;
  resumeLink?: string;
  resume?: { id?: string; title?: string; url: string; uploadedAt?: string } | null;
  profileImage?: { url?: string | null; publicId?: string | null } | null;
  education?: {
    tenth?: any;
    twelfth?: any;
    graduation?: any;
    postGraduation?: any;
  };
  professionalDetails?: {
    certifications?: string[];
    achievements?: string[];
    technicalSkills?: string[];
    hackathons?: string[];
  };
  leetcode_profiles?: { username: string; totalSolved?: number; easySolved?: number; mediumSolved?: number; hardSolved?: number; ranking?: number }[];
  projects?: { title: string; description?: string; link?: string }[];
  sgpa?: { sem: number; sgpa: number }[];
  contact?: { mobile?: string; whatsappNumber?: string };
  followerCount?: number;
  followingCount?: number;
  followers?: any[];
  following?: any[];
}

export default function AlumniProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ data?: string }>();
  const { createRequest } = useMentorshipRequests();

  const fallbackProfile: ProfileData | null = params.data
    ? (() => { try { return JSON.parse(params.data); } catch { return null; } })()
    : null;

  const [profile, setProfile] = useState<ProfileData | null>(fallbackProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showMentorshipModal, setShowMentorshipModal] = useState(false);
  const [mentorshipAreas, setMentorshipAreas] = useState("");
  const [mentorshipMessage, setMentorshipMessage] = useState("");
  const [isSendingRequest, setIsSendingRequest] = useState(false);

  const fetchFullProfile = useCallback(async () => {
    const userId = fallbackProfile?._id || fallbackProfile?.id;
    if (!userId) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setFetchError(null);
      const response = await apiClient.get(`/api/profile/${userId}`);
      const data = response.data as Record<string, unknown>;
      if (data) {
        const userData = (data.user || data) as ProfileData;
        if (userData && userData.name) {
          if (!userData._id && userData.id) {
            userData._id = userData.id;
          }
          setProfile(userData);
          logger.info("ALUMNI_PROFILE", `Loaded: ${userData.name}`, {
            edu: !!userData.education,
            proj: userData.projects?.length || 0,
            lc: userData.leetcode_profiles?.length || 0,
            resume: !!userData.resume,
            sgpa: userData.sgpa?.length || 0,
          });
        } else {
          setFetchError("Profile data not found");
        }
      }
    } catch (err) {
      logger.error("ALUMNI_PROFILE", "Failed to fetch profile", err);
      setFetchError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  }, [fallbackProfile?._id, fallbackProfile?.id]);

  useEffect(() => {
    fetchFullProfile();
  }, [fetchFullProfile]);

  const handleFollow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsFollowing(!isFollowing);
  };

  const handleRequestMentorship = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowMentorshipModal(true);
  };

  const handleSendRequest = async () => {
    const userId = profile?._id || profile?.id;
    if (!userId || !mentorshipMessage.trim()) {
      Alert.alert("Required", "Please enter a message.");
      return;
    }
    setIsSendingRequest(true);
    const areas = mentorshipAreas.split(",").map((a) => a.trim()).filter(Boolean);
    const success = await createRequest(userId, areas, mentorshipMessage.trim());
    setIsSendingRequest(false);
    if (success) {
      setShowMentorshipModal(false);
      setMentorshipAreas("");
      setMentorshipMessage("");
      Alert.alert("Request Sent", "Your mentorship request has been sent!");
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const openLink = (url: string) => {
    if (url) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Linking.openURL(url.startsWith("http") ? url : `https://${url}`);
    }
  };

  const handleFollowersPress = () => {
    const userId = profile?._id || profile?.id;
    if (!userId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/(app)/alumni/followlist",
      params: { userId, type: "followers", title: "Followers" },
    } as never);
  };

  const handleFollowingPress = () => {
    const userId = profile?._id || profile?.id;
    if (!userId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/(app)/alumni/followlist",
      params: { userId, type: "following", title: "Following" },
    } as never);
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-[#FAFAFA] dark:bg-slate-950 items-center justify-center">
        <StatusBar style="auto" />
        <ActivityIndicator size="large" color="#8B0000" />
        <Text className="text-sm text-slate-400 mt-3">Loading profile...</Text>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView className="flex-1 bg-[#FAFAFA] dark:bg-slate-950 items-center justify-center px-6">
        <StatusBar style="auto" />
        <Ionicons name="alert-circle-outline" size={48} color="#94A3B8" />
        <Text className="text-lg font-bold text-slate-900 dark:text-white mt-4">Profile Not Found</Text>
        {fetchError ? <Text className="text-sm text-slate-500 mt-1 text-center">{fetchError}</Text> : null}
        <TouchableOpacity onPress={handleBack} className="bg-red-800 px-6 py-3 rounded-2xl mt-4">
          <Text className="text-white font-bold text-sm">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const p = profile;
  const displayName = p.name || "User";
  const initials = displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const edu = p.education;
  const prof = p.professionalDetails;
  const lc = p.leetcode_profiles?.[0];
  const followerCount = p.followerCount ?? p.followers?.length ?? 0;
  const followingCount = p.followingCount ?? p.following?.length ?? 0;

  const getPhotoUrl = (): string | null => {
    if (!p.profileImage) return null;
    if (typeof p.profileImage === "string") return p.profileImage;
    return p.profileImage.url || null;
  };
  const photoUrl = getPhotoUrl();

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAFA] dark:bg-slate-950">
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <Animated.View entering={FadeInDown.duration(260).springify().damping(20)} className="px-5 pt-3 pb-4">
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity onPress={handleBack} className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 items-center justify-center shadow-xs">
              <Ionicons name="arrow-back" size={18} color="#64748B" />
            </TouchableOpacity>
            <Text className="text-sm font-bold text-slate-900 dark:text-white">Profile</Text>
            <View className="w-10" />
          </View>
        </Animated.View>

        {/* Profile Header */}
        <Animated.View entering={FadeInDown.delay(60).duration(280).springify().damping(20)} className="px-5 mb-5">
          <View className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs items-center">
            {/* Avatar */}
            <View className="mb-4">
              {photoUrl ? (
                <Image source={{ uri: photoUrl }} className="w-20 h-20 rounded-full border-4 border-white dark:border-slate-900 shadow-md" />
              ) : (
                <View className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/40 items-center justify-center border-4 border-white dark:border-slate-900 shadow-md">
                  <Text className="text-2xl font-black text-red-700 dark:text-red-300">{initials}</Text>
                </View>
              )}
            </View>

            <Text className="text-xl font-black text-slate-900 dark:text-white text-center">{displayName}</Text>
            {p.communityStatus && (
              <View className="bg-red-50 dark:bg-red-950/60 border border-red-200/80 dark:border-red-800/80 px-3 py-1 rounded-full mt-2">
                <Text className="text-xs font-semibold text-red-800 dark:text-red-300">{p.communityStatus}</Text>
              </View>
            )}
            {p.roll_no && (
              <Text className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-mono">Roll No: {p.roll_no}</Text>
            )}
            {p.currentPosition && p.company && (
              <Text className="text-sm text-slate-600 dark:text-slate-400 mt-1 text-center">{p.currentPosition} at {p.company}</Text>
            )}
            {p.location && (
              <View className="flex-row items-center mt-1">
                <Ionicons name="location-outline" size={14} color="#94A3B8" />
                <Text className="text-xs text-slate-500 dark:text-slate-400 ml-1">{p.location}</Text>
              </View>
            )}
            {p.batchYear && (
              <View className="flex-row items-center mt-1">
                <Ionicons name="school-outline" size={14} color="#94A3B8" />
                <Text className="text-xs text-slate-500 dark:text-slate-400 ml-1">
                  Batch {p.batchYear}{p.program?.name ? ` · ${p.program.name}` : ""}
                </Text>
              </View>
            )}
            {/* Followers / Following - Clickable */}
            <View className="flex-row items-center gap-6 mt-3">
              <TouchableOpacity onPress={handleFollowersPress} className="items-center" activeOpacity={0.7}>
                <Text className="text-base font-black text-slate-900 dark:text-white">{followerCount}</Text>
                <Text className="text-[10px] text-slate-500 dark:text-slate-400 underline">Followers</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleFollowingPress} className="items-center" activeOpacity={0.7}>
                <Text className="text-base font-black text-slate-900 dark:text-white">{followingCount}</Text>
                <Text className="text-[10px] text-slate-500 dark:text-slate-400 underline">Following</Text>
              </TouchableOpacity>
            </View>
            {/* Action Buttons */}
            <View className="flex-row items-center gap-3 mt-5 w-full">
              <TouchableOpacity onPress={handleFollow} activeOpacity={0.85}
                className={`flex-1 py-3 rounded-2xl flex-row items-center justify-center ${isFollowing ? "bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" : "bg-red-800"}`}>
                <Ionicons name={isFollowing ? "person-remove-outline" : "person-add-outline"} size={16} color={isFollowing ? "#64748B" : "white"} />
                <Text className={`font-bold text-sm ml-2 ${isFollowing ? "text-slate-600 dark:text-slate-400" : "text-white"}`}>
                  {isFollowing ? "Following" : "Follow"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleRequestMentorship} activeOpacity={0.85}
                className="flex-1 bg-red-800 py-3 rounded-2xl flex-row items-center justify-center border border-red-900">
                <Ionicons name="chatbubble-outline" size={16} color="white" />
                <Text className="text-white font-bold text-sm ml-2">Mentorship</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Contact */}
        <Section title="Contact" delay={120}>
          {p.email ? <InfoRow icon="mail-outline" label="Email" value={p.email} /> : null}
          {p.contact?.mobile ? <InfoRow icon="call-outline" label="Phone" value={p.contact.mobile} /> : null}
        </Section>

        {/* Bio */}
        {p.bio ? (
          <Section title="About" delay={150}>
            <Text className="text-sm text-slate-700 dark:text-slate-300 leading-5">{p.bio}</Text>
          </Section>
        ) : null}

        {/* Skills */}
        {p.skills && p.skills.length > 0 && (
          <Section title="Skills" delay={180}>
            <View className="flex-row flex-wrap gap-2">
              {p.skills.map((skill, i) => (
                <View key={i} className="bg-red-50 dark:bg-red-950/60 border border-red-200/80 dark:border-red-800/80 px-3 py-1.5 rounded-full">
                  <Text className="text-xs font-semibold text-red-800 dark:text-red-300">{skill}</Text>
                </View>
              ))}
            </View>
          </Section>
        )}

        {/* Availability */}
        <Animated.View entering={FadeInDown.delay(200).duration(280).springify().damping(20)} className="px-5 mb-4">
          <View className="flex-row flex-wrap gap-2">
            {p.openToWork && (
              <View className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80 px-4 py-2 rounded-2xl flex-row items-center">
                <Ionicons name="briefcase-outline" size={15} color="#059669" />
                <Text className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 ml-2">Open to Work</Text>
              </View>
            )}
            {p.availableForReferral && (
              <View className="bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/80 px-4 py-2 rounded-2xl flex-row items-center">
                <Ionicons name="git-pull-request-outline" size={15} color="#2563EB" />
                <Text className="text-xs font-semibold text-blue-700 dark:text-blue-300 ml-2">Referrals</Text>
              </View>
            )}
            {p.availableForMentorship && (
              <View className="bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/80 px-4 py-2 rounded-2xl flex-row items-center">
                <Ionicons name="people-outline" size={15} color="#D97706" />
                <Text className="text-xs font-semibold text-amber-700 dark:text-amber-300 ml-2">Mentorship</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Education */}
        {edu && (edu.tenth || edu.twelfth || edu.graduation || edu.postGraduation) && (
          <Section title="Education" delay={220}>
            {edu.tenth && <EducationCard label="10th" data={edu.tenth} />}
            {edu.twelfth && <EducationCard label="12th" data={edu.twelfth} />}
            {edu.graduation && <EducationCard label="Graduation" data={edu.graduation} />}
            {edu.postGraduation && <EducationCard label="Post Graduation" data={edu.postGraduation} />}
          </Section>
        )}

        {/* SGPA */}
        {p.sgpa && p.sgpa.length > 0 && (
          <Section title="SGPA" delay={240}>
            <View className="flex-row flex-wrap gap-2">
              {p.sgpa.map((s, i) => (
                <View key={i} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl px-3 py-2 items-center">
                  <Text className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Sem {s.sem}</Text>
                  <Text className="text-sm font-black text-slate-800 dark:text-white">{s.sgpa}</Text>
                </View>
              ))}
            </View>
          </Section>
        )}

        {/* Certifications */}
        {prof?.certifications && prof.certifications.length > 0 && (
          <Section title="Certifications" delay={260}>
            {prof.certifications.map((cert, i) => (
              <View key={i} className="flex-row items-center py-1.5">
                <Ionicons name="ribbon-outline" size={14} color="#059669" />
                <Text className="text-sm text-slate-700 dark:text-slate-300 ml-2">{cert}</Text>
              </View>
            ))}
          </Section>
        )}

        {/* Achievements */}
        {prof?.achievements && prof.achievements.length > 0 && (
          <Section title="Achievements" delay={280}>
            {prof.achievements.map((a, i) => (
              <View key={i} className="flex-row items-center py-1.5">
                <Ionicons name="trophy-outline" size={14} color="#D97706" />
                <Text className="text-sm text-slate-700 dark:text-slate-300 ml-2">{a}</Text>
              </View>
            ))}
          </Section>
        )}

        {/* Projects */}
        {p.projects && p.projects.length > 0 && (
          <Section title="Projects" delay={300}>
            {p.projects.map((proj, i) => (
              <View key={i} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 mb-2">
                <Text className="text-sm font-bold text-slate-800 dark:text-white">{proj.title}</Text>
                {proj.description ? <Text className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-4">{proj.description}</Text> : null}
                {proj.link ? (
                  <TouchableOpacity onPress={() => openLink(proj.link!)} className="flex-row items-center mt-1">
                    <Ionicons name="link-outline" size={12} color="#2563EB" />
                    <Text className="text-xs text-blue-600 dark:text-blue-400 ml-1">View Project</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ))}
          </Section>
        )}

        {/* LeetCode */}
        {lc && (
          <Section title="LeetCode" delay={320}>
            <View className="flex-row flex-wrap gap-2">
              <View className="bg-slate-50 dark:bg-slate-800/50 rounded-xl px-3 py-2 items-center">
                <Text className="text-[10px] font-bold text-slate-500">Solved</Text>
                <Text className="text-sm font-black text-slate-800 dark:text-white">{lc.totalSolved || 0}</Text>
              </View>
              {lc.easySolved != null && (
                <View className="bg-emerald-50 dark:bg-emerald-950/40 rounded-xl px-3 py-2 items-center">
                  <Text className="text-[10px] font-bold text-emerald-600">Easy</Text>
                  <Text className="text-sm font-black text-emerald-700">{lc.easySolved}</Text>
                </View>
              )}
              {lc.mediumSolved != null && (
                <View className="bg-amber-50 dark:bg-amber-950/40 rounded-xl px-3 py-2 items-center">
                  <Text className="text-[10px] font-bold text-amber-600">Medium</Text>
                  <Text className="text-sm font-black text-amber-700">{lc.mediumSolved}</Text>
                </View>
              )}
              {lc.hardSolved != null && (
                <View className="bg-red-50 dark:bg-red-950/40 rounded-xl px-3 py-2 items-center">
                  <Text className="text-[10px] font-bold text-red-600">Hard</Text>
                  <Text className="text-sm font-black text-red-700">{lc.hardSolved}</Text>
                </View>
              )}
            </View>
            {lc.ranking ? <Text className="text-xs text-slate-500 dark:text-slate-400 mt-2">Ranking: #{lc.ranking}</Text> : null}
            {lc.username ? <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1">Username: {lc.username}</Text> : null}
          </Section>
        )}

        {/* Resume */}
        {(p.resume || p.resumeLink) && (
          <Section title="Resume" delay={340}>
            {p.resume && (
              <TouchableOpacity onPress={() => openLink(p.resume!.url)} className="flex-row items-center bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3" activeOpacity={0.7}>
                <View className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 items-center justify-center">
                  <Ionicons name="document-text-outline" size={20} color="#8B0000" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-sm font-bold text-slate-800 dark:text-white">{p.resume.title || "Resume"}</Text>
                  {p.resume.uploadedAt && <Text className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Uploaded: {new Date(p.resume.uploadedAt).toLocaleDateString()}</Text>}
                </View>
                <Ionicons name="open-outline" size={16} color="#8B0000" />
              </TouchableOpacity>
            )}
            {p.resumeLink && !p.resume && (
              <TouchableOpacity onPress={() => openLink(p.resumeLink!)} className="flex-row items-center bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3" activeOpacity={0.7}>
                <View className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 items-center justify-center">
                  <Ionicons name="document-text-outline" size={20} color="#8B0000" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-sm font-bold text-slate-800 dark:text-white">Resume</Text>
                  <Text className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5" numberOfLines={1}>{p.resumeLink}</Text>
                </View>
                <Ionicons name="open-outline" size={16} color="#8B0000" />
              </TouchableOpacity>
            )}
          </Section>
        )}

        {/* Links */}
        <Section title="Links" delay={360}>
          <View className="gap-2">
            {p.linkedin ? (
              <TouchableOpacity onPress={() => openLink(p.linkedin!)} className="flex-row items-center bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/80 p-3 rounded-xl" activeOpacity={0.7}>
                <Ionicons name="logo-linkedin" size={18} color="#2563EB" />
                <Text className="text-sm font-semibold text-blue-700 dark:text-blue-300 ml-2.5">LinkedIn</Text>
                <Ionicons name="open-outline" size={14} color="#2563EB" style={{ marginLeft: "auto" }} />
              </TouchableOpacity>
            ) : null}
            {p.github ? (
              <TouchableOpacity onPress={() => openLink(p.github!)} className="flex-row items-center bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60 p-3 rounded-xl" activeOpacity={0.7}>
                <Ionicons name="logo-github" size={18} color="#334155" />
                <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-2.5">GitHub</Text>
                <Ionicons name="open-outline" size={14} color="#64748B" style={{ marginLeft: "auto" }} />
              </TouchableOpacity>
            ) : null}
            {p.gfg ? (
              <TouchableOpacity onPress={() => openLink(p.gfg!)} className="flex-row items-center bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80 p-3 rounded-xl" activeOpacity={0.7}>
                <Ionicons name="code-slash-outline" size={18} color="#059669" />
                <Text className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 ml-2.5">GeeksforGeeks</Text>
                <Ionicons name="open-outline" size={14} color="#059669" style={{ marginLeft: "auto" }} />
              </TouchableOpacity>
            ) : null}
            {p.codeforces ? (
              <TouchableOpacity onPress={() => openLink(p.codeforces!)} className="flex-row items-center bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/80 p-3 rounded-xl" activeOpacity={0.7}>
                <Ionicons name="trophy-outline" size={18} color="#1E40AF" />
                <Text className="text-sm font-semibold text-blue-700 dark:text-blue-300 ml-2.5">Codeforces</Text>
                <Ionicons name="open-outline" size={14} color="#1E40AF" style={{ marginLeft: "auto" }} />
              </TouchableOpacity>
            ) : null}
            {p.codechef ? (
              <TouchableOpacity onPress={() => openLink(p.codechef!)} className="flex-row items-center bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/80 p-3 rounded-xl" activeOpacity={0.7}>
                <Ionicons name="fast-food-outline" size={18} color="#D97706" />
                <Text className="text-sm font-semibold text-amber-700 dark:text-amber-300 ml-2.5">CodeChef</Text>
                <Ionicons name="open-outline" size={14} color="#D97706" style={{ marginLeft: "auto" }} />
              </TouchableOpacity>
            ) : null}
          </View>
        </Section>

      </ScrollView>

      {/* Mentorship Modal */}
      <Modal visible={showMentorshipModal} transparent animationType="fade" onRequestClose={() => setShowMentorshipModal(false)}>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white dark:bg-slate-900 rounded-t-[32px] p-6 max-h-[85%] border-t border-slate-200 dark:border-slate-800 shadow-2xl">
            <View className="items-center mb-3">
              <View className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
            </View>
            <View className="flex-row items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <View>
                <Text className="text-[11px] font-bold text-red-800 dark:text-red-300 uppercase tracking-wider">MENTORSHIP REQUEST</Text>
                <Text className="text-lg font-black text-slate-900 dark:text-white">to {displayName}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowMentorshipModal(false)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center">
                <Ionicons name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Areas (comma separated)</Text>
              <TextInput className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white mb-4" placeholder="e.g. System Design, React" placeholderTextColor="#94A3B8" value={mentorshipAreas} onChangeText={setMentorshipAreas} autoCorrect={false} />
              <Text className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Message *</Text>
              <TextInput className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white mb-4 min-h-[100px]" placeholder="Tell them why you'd like mentorship..." placeholderTextColor="#94A3B8" value={mentorshipMessage} onChangeText={setMentorshipMessage} multiline textAlignVertical="top" />
              <TouchableOpacity onPress={handleSendRequest} disabled={isSendingRequest || !mentorshipMessage.trim()} activeOpacity={0.85}
                className={`py-3.5 rounded-2xl items-center ${isSendingRequest || !mentorshipMessage.trim() ? "bg-slate-200 dark:bg-slate-800" : "bg-red-800"}`}>
                <Text className="text-white font-bold text-sm">{isSendingRequest ? "Sending..." : "Send Request"}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
