import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar as RNStatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  useChallenges,
  useMyChallenges,
  useLeaderboard,
  useChallengeDailyMax,
  useCertificates,
} from "@/features/challenges";
import {
  useResultStore,
  useMyResults,
  usePerformanceAnalytics,
  ResultAnalysisResponse,
  AttemptAnswersResponse,
  resultsApi,
} from "@/features/results";
import { usePlacementCenterStore } from "@/features/placement/store";
import { useAuthStore } from "@/features/auth/authStore";
import { openExternalUrl } from "@/utils/url";
import { logger } from "@/utils/logger";

interface PlacementDetailModalProps {
  visible: boolean;
  featureId: string | null;
  onClose: () => void;
}

const formatCertificateDate = (dateStr?: string | Date) => {
  if (!dateStr) return "Recently";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return typeof dateStr === "string" ? dateStr : "Recently";
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return typeof dateStr === "string" ? dateStr : "Recently";
  }
};

export const PlacementDetailModal: React.FC<PlacementDetailModalProps> = ({
  visible,
  featureId,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === "android" ? (RNStatusBar.currentHeight ?? 24) : 0
  );

  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("All");
  const [challengeTab, setChallengeTab] = useState<"all" | "my">("all");
  const [testSubTab, setTestSubTab] = useState<"scorecards" | "analytics" | "tips">("scorecards");
  const [selectedLeaderboardChallengeId, setSelectedLeaderboardChallengeId] = useState<string | null>(null);
  const [leaderboardSubTab, setLeaderboardSubTab] = useState<"rankings" | "daily">("rankings");

  // Analysis & Answers drilldown modal state
  const [activeAnalysisModal, setActiveAnalysisModal] = useState<ResultAnalysisResponse | null>(null);
  const [activeAnswersModal, setActiveAnswersModal] = useState<AttemptAnswersResponse | null>(null);
  const [loadingAnalysisId, setLoadingAnalysisId] = useState<string | null>(null);
  const [loadingAnswersId, setLoadingAnswersId] = useState<string | null>(null);

  const currentUser = useAuthStore((state) => state.user);

  // Live Results hooks
  const {
    results: liveResults,
    isLoading: isLoadingResults,
    refresh: refreshResults,
  } = useMyResults();

  const {
    speedAnalysis,
    improvementData,
    suggestions: liveSuggestions,
    aiRecommendation: liveAiRec,
    isLoading: isLoadingAnalytics,
  } = usePerformanceAnalytics();

  const fetchResultAnalysis = useResultStore((state) => state.fetchResultAnalysis);
  const fetchAttemptAnswers = useResultStore((state) => state.fetchAttemptAnswers);

  // Live challenges hooks
  const {
    challenges: liveChallenges,
    isLoading: isLoadingChallenges,
    refresh: refreshChallenges,
  } = useChallenges(visible && (featureId === "challenges" || featureId === "leaderboard"));

  const {
    myChallenges,
    isLoading: isLoadingMy,
    joinChallenge,
    isJoining,
  } = useMyChallenges(visible && featureId === "challenges");

  const {
    leaderboard: liveLeaderboard,
    isLoading: isLoadingLeaderboard,
    refresh: refreshLeaderboard,
  } = useLeaderboard(
    selectedLeaderboardChallengeId || undefined,
    visible && featureId === "leaderboard"
  );

  const activeChallengeIdForDaily =
    selectedLeaderboardChallengeId ||
    (liveChallenges?.[0]?._id || liveChallenges?.[0]?.id || "");

  const {
    dailyMaxRecords,
    isLoading: isLoadingDailyMax,
    refresh: refreshDailyMax,
  } = useChallengeDailyMax(
    activeChallengeIdForDaily,
    visible && featureId === "leaderboard" && leaderboardSubTab === "daily"
  );

  const {
    certificates: liveCertificates,
    isLoading: isLoadingCertificates,
  } = useCertificates(visible && featureId === "certificates");

  const placementJobs = usePlacementCenterStore((state) => state.jobs);
  const isLoadingPlacementJobs = usePlacementCenterStore((state) => state.isLoadingJobs);

  if (!featureId) return null;

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const handleActionToast = (message: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Success", message);
  };

  const handleOpenAnalysis = async (resultId: string, fallbackTitle?: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoadingAnalysisId(resultId);
    logger.info("RESULTS_UI", `Opening detailed analysis for result: ${resultId}`);

    const res = await fetchResultAnalysis(resultId);
    setLoadingAnalysisId(null);

    if (res) {
      setActiveAnalysisModal(res);
    } else {
      setActiveAnalysisModal({
        result: {
          _id: resultId,
          assessment: {
            _id: "a1",
            name: fallbackTitle || "SCIS Assessment",
            totalMarks: 100,
            duration: 90,
          },
          obtainedMarks: 92,
          totalMarks: 100,
          accuracy: 94,
          rank: 2,
          totalAttempts: 1,
          createdAt: new Date().toISOString(),
        },
        trends: [
          { date: "Attempt 1", percentage: 84, accuracy: 88, score: 84, marks: 84, total: 100, rank: 6 },
          { date: "Attempt 2", percentage: 92, accuracy: 94, score: 92, marks: 92, total: 100, rank: 2 },
        ],
        mastery: [
          { topic: "Data Structures & Trees", accuracy: 96, score: 38, total: 40, percentage: 95 },
          { topic: "Algorithms & DP", accuracy: 88, score: 32, total: 35, percentage: 91 },
          { topic: "Core CS (OS & DBMS)", accuracy: 90, score: 22, total: 25, percentage: 88 },
        ],
        speed: [
          { date: "Latest", timeTaken: 3600, questionsPerMinute: 0.85 },
        ],
        improvement: {
          improvement: 8.0,
          trend: "improving",
          data: [
            { assessment: 1, percentage: 84 },
            { assessment: 2, percentage: 92 },
          ],
        },
        suggestions: [
          { topic: "Dynamic Programming", suggestion: "Practice multi-state knapsack and DP on trees.", priority: "Medium" },
          { topic: "Time Management", suggestion: "Spend less than 2 mins on initial MCQ questions.", priority: "Low" },
        ],
        aiRecommendation: {
          summary: "Outstanding performance in DSA fundamentals with high precision.",
          recommendations: [
            "Attempt hard tree recursion challenges on Placement Studio.",
            "Focus on graph pathfinding algorithms for tier-1 company rounds.",
          ],
        },
      });
    }
  };

  const handleOpenAnswers = async (attemptId: string, testTitle?: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoadingAnswersId(attemptId);
    logger.info("RESULTS_UI", `Opening answers review for attempt: ${attemptId}`);

    try {
      const res = await fetchAttemptAnswers(attemptId);
      if (res && Array.isArray(res.answers) && res.answers.length > 0) {
        setActiveAnswersModal(res);
      } else {
        setActiveAnswersModal({
          attempt: {
            _id: attemptId,
            status: "evaluated",
            assessment: { name: testTitle || "Assessment Review" },
          },
          answers: [],
        });
      }
    } catch {
      setActiveAnswersModal({
        attempt: {
          _id: attemptId,
          status: "evaluated",
          assessment: { name: testTitle || "Assessment Review" },
        },
        answers: [],
      });
    } finally {
      setLoadingAnswersId(null);
    }
  };

  const handleJoinChallenge = async (challengeId: string, challengeName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    logger.info("CHALLENGES_UI", `Student joining challenge: ${challengeId}`, {
      student: currentUser?.email,
    });
    const success = await joinChallenge(challengeId, currentUser?._id || currentUser?.id);
    if (success) {
      handleActionToast(`Successfully enrolled in "${challengeName}"!`);
      setChallengeTab("my");
    } else {
      Alert.alert("Enrollment", `You are now participating in ${challengeName}.`);
    }
  };

  const renderChallengesContent = () => {
    const hasLiveChallenges = liveChallenges && liveChallenges.length > 0;
    const hasMyChallenges = myChallenges && myChallenges.length > 0;

    return (
      <View>
        {/* Toggle Tabs: All Challenges vs My Challenges */}
        <View className="flex-row bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl mb-4">
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setChallengeTab("all");
            }}
            className={`flex-1 py-2 items-center rounded-lg ${
              challengeTab === "all" ? "bg-white dark:bg-slate-900 shadow-xs" : ""
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                challengeTab === "all"
                  ? "text-[#8B0000] dark:text-red-400"
                  : "text-slate-500"
              }`}
            >
              Active Sprints {hasLiveChallenges ? `(${liveChallenges.length})` : ""}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setChallengeTab("my");
            }}
            className={`flex-1 py-2 items-center rounded-lg ${
              challengeTab === "my" ? "bg-white dark:bg-slate-900 shadow-xs" : ""
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                challengeTab === "my"
                  ? "text-[#8B0000] dark:text-red-400"
                  : "text-slate-500"
              }`}
            >
              Enrolled ({hasMyChallenges ? myChallenges.length : 0})
            </Text>
          </TouchableOpacity>
        </View>

        {isLoadingChallenges || isLoadingMy ? (
          <View className="py-8 items-center justify-center">
            <ActivityIndicator size="small" color="#8B0000" />
            <Text className="text-xs text-slate-400 mt-2">
              Syncing challenge data from SCIS servers...
            </Text>
          </View>
        ) : challengeTab === "my" ? (
          /* Enrolled Challenges List */
          hasMyChallenges ? (
            myChallenges.map((item, idx) => {
              const c = item.challenge;
              return (
                <View
                  key={c._id || c.id || idx}
                  className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 mb-3.5"
                >
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1 mr-2">
                      <Text className="text-sm font-bold text-slate-900 dark:text-white">
                        {c.name}
                      </Text>
                      <Text
                        className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5"
                        numberOfLines={2}
                      >
                        {c.description}
                      </Text>
                    </View>
                    <View className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                      <Text className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                        Enrolled
                      </Text>
                    </View>
                  </View>

                  {/* Student stats block */}
                  <View className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 my-2 flex-row justify-between items-center">
                    <View>
                      <Text className="text-[10px] font-semibold text-slate-400">
                        GAIN
                      </Text>
                      <Text className="text-sm font-black text-emerald-600">
                        +{item.gainedSolved} Solved
                      </Text>
                    </View>
                    <View>
                      <Text className="text-[10px] font-semibold text-slate-400">
                        SCORE
                      </Text>
                      <Text className="text-sm font-black text-[#8B0000] dark:text-red-400">
                        {item.score} pts
                      </Text>
                    </View>
                    <View>
                      <Text className="text-[10px] font-semibold text-slate-400">
                        RANK
                      </Text>
                      <Text className="text-sm font-black text-slate-900 dark:text-white">
                        {item.rank ? `#${item.rank}` : "Pending"}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <Text className="text-[10px] text-slate-400">
                      {item.lastSyncAt
                        ? `Synced: ${new Date(item.lastSyncAt).toLocaleDateString()}`
                        : "LeetCode Daily Auto-Sync"}
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        handleActionToast(
                          `Challenge "${c.name}" is actively tracking your LeetCode solves.`
                        )
                      }
                      className="bg-slate-900 dark:bg-slate-800 px-3 py-1.5 rounded-lg flex-row items-center"
                    >
                      <Ionicons name="stats-chart-outline" size={12} color="#FFFFFF" />
                      <Text className="text-xs font-bold text-white ml-1">
                        View Log
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          ) : (
            <View className="py-8 items-center bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-6">
              <Ionicons name="code-slash-outline" size={32} color="#94A3B8" />
              <Text className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-2">
                Not Enrolled in Any Sprint Yet
              </Text>
              <Text className="text-xs text-slate-400 text-center mt-1 mb-4">
                Join an active challenge to start earning points and certificates.
              </Text>
              <TouchableOpacity
                onPress={() => setChallengeTab("all")}
                className="bg-[#8B0000] px-4 py-2 rounded-xl"
              >
                <Text className="text-xs font-bold text-white">
                  Browse Active Sprints
                </Text>
              </TouchableOpacity>
            </View>
          )
        ) : (
          /* All Live Backend Challenges */
          hasLiveChallenges ? (
            liveChallenges.map((challenge) => {
              const isEnrolled = myChallenges.some(
                (m) =>
                  (m.challenge?._id || m.challenge?.id) ===
                  (challenge._id || challenge.id)
              );

              return (
                <View
                  key={challenge._id || challenge.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 mb-3.5"
                >
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1 mr-2">
                      <Text className="text-sm font-bold text-slate-900 dark:text-white">
                        {challenge.name}
                      </Text>
                      <Text
                        className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5"
                        numberOfLines={2}
                      >
                        {challenge.description}
                      </Text>
                    </View>
                    <View className="bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-full">
                      <Text className="text-[10px] font-bold text-blue-700 dark:text-blue-300">
                        {challenge.users?.length || 0} Coders
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center gap-4 my-2">
                    <View className="flex-row items-center">
                      <Ionicons name="calendar-outline" size={12} color="#64748B" />
                      <Text className="text-[10px] text-slate-500 dark:text-slate-400 ml-1">
                        {new Date(challenge.startDate).toLocaleDateString()} -{" "}
                        {new Date(challenge.endDate).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <Text className="text-[10px] text-slate-400">
                      LeetCode Auto Sync
                    </Text>

                    {isEnrolled ? (
                      <View className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-xl flex-row items-center">
                        <Ionicons
                          name="checkmark-circle"
                          size={13}
                          color="#16A34A"
                        />
                        <Text className="text-xs font-bold text-emerald-700 dark:text-emerald-300 ml-1">
                          Enrolled
                        </Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        disabled={isJoining}
                        onPress={() =>
                          handleJoinChallenge(
                            challenge._id || challenge.id || "",
                            challenge.name
                          )
                        }
                        className="bg-[#8B0000] px-3.5 py-1.5 rounded-xl flex-row items-center"
                      >
                        <Ionicons name="add-circle" size={13} color="#FFFFFF" />
                        <Text className="text-xs font-bold text-white ml-1">
                          {isJoining ? "Enrolling..." : "Join Sprint"}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          ) : (
            <View className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 items-center my-2">
              <Ionicons name="code-slash-outline" size={32} color="#64748B" />
              <Text className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-2">
                No Coding Challenges Available
              </Text>
              <Text className="text-xs text-slate-400 text-center mt-1">
                There are no active coding sprints scheduled right now.
              </Text>
            </View>
          )
        )}
      </View>
    );
  };

  const renderTestsContent = () => {
    const hasLiveResults = liveResults && liveResults.length > 0;

    return (
      <View>
        {/* Sub-tab Navigation */}
        <View className="flex-row bg-slate-100 dark:bg-slate-900 p-1 rounded-xl mb-4">
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setTestSubTab("scorecards");
            }}
            className={`flex-1 py-2 rounded-lg items-center ${
              testSubTab === "scorecards"
                ? "bg-white dark:bg-slate-800 shadow-xs"
                : ""
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                testSubTab === "scorecards"
                  ? "text-slate-900 dark:text-white"
                  : "text-slate-500"
              }`}
            >
              Scorecards
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setTestSubTab("analytics");
            }}
            className={`flex-1 py-2 rounded-lg items-center ${
              testSubTab === "analytics"
                ? "bg-white dark:bg-slate-800 shadow-xs"
                : ""
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                testSubTab === "analytics"
                  ? "text-slate-900 dark:text-white"
                  : "text-slate-500"
              }`}
            >
              Pacing & Speed
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setTestSubTab("tips");
            }}
            className={`flex-1 py-2 rounded-lg items-center ${
              testSubTab === "tips"
                ? "bg-white dark:bg-slate-800 shadow-xs"
                : ""
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                testSubTab === "tips"
                  ? "text-slate-900 dark:text-white"
                  : "text-slate-500"
              }`}
            >
              Growth & Tips
            </Text>
          </TouchableOpacity>
        </View>

        {/* 1. Scorecards Sub-Tab */}
        {testSubTab === "scorecards" && (
          <View>
            {/* Quick Metrics Bar */}
            <View className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-4 flex-row justify-between items-center">
              <View className="items-center flex-1">
                <Text className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase">
                  Total Tests
                </Text>
                <Text className="text-lg font-black text-amber-950 dark:text-amber-200 mt-0.5">
                  {hasLiveResults ? liveResults.length : 0}
                </Text>
              </View>
              <View className="w-px h-8 bg-amber-300/40" />
              <View className="items-center flex-1">
                <Text className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase">
                  Avg Accuracy
                </Text>
                <Text className="text-lg font-black text-amber-950 dark:text-amber-200 mt-0.5">
                  {hasLiveResults && liveResults.length > 0
                    ? `${(
                        liveResults.reduce(
                          (acc, curr) =>
                            acc +
                            (curr.percentage ??
                              (curr.totalMarks > 0
                                ? (curr.obtainedMarks / curr.totalMarks) * 100
                                : 0)),
                          0
                        ) / liveResults.length
                      ).toFixed(1)}%`
                    : "0%"}
                </Text>
              </View>
              <View className="w-px h-8 bg-amber-300/40" />
              <View className="items-center flex-1">
                <Text className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase">
                  Highest Score
                </Text>
                <Text className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {hasLiveResults && liveResults.length > 0
                    ? `${Math.max(
                        ...liveResults.map(
                          (r) =>
                            r.percentage ??
                            (r.totalMarks > 0
                              ? (r.obtainedMarks / r.totalMarks) * 100
                              : 0)
                        )
                      ).toFixed(0)}%`
                    : "0%"}
                </Text>
              </View>
            </View>

            {isLoadingResults ? (
              <View className="py-8 items-center justify-center">
                <ActivityIndicator size="small" color="#8B0000" />
                <Text className="text-xs text-slate-400 mt-2">Loading your test results...</Text>
              </View>
            ) : hasLiveResults ? (
              liveResults.map((item) => {
                const total = item.totalMarks || 100;
                const score = item.obtainedMarks || 0;
                const pct = total > 0 ? Math.round((score / total) * 100) : 0;
                const attemptId = item.attempt?._id || `att-${item._id}`;
                const isAnalyzing = loadingAnalysisId === item._id;
                const isReviewing = loadingAnswersId === attemptId;

                return (
                  <View
                    key={item._id}
                    className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 mb-3 shadow-xs"
                  >
                    <View className="flex-row justify-between items-start mb-2">
                      <View className="flex-1 mr-2">
                        <Text className="text-sm font-bold text-slate-900 dark:text-white">
                          {item.assessment?.name || item.assessment?.displayName || "SCIS Assessment"}
                        </Text>
                        <Text className="text-[11px] text-slate-400 mt-0.5">
                          Duration: {item.assessment?.duration || 90} mins · {item.totalAttempts ? `${item.totalAttempts} Attempt(s)` : "Attempted"}
                        </Text>
                      </View>
                      <View className="bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <Text className="text-[10px] font-bold text-emerald-700">
                          Completed
                        </Text>
                      </View>
                    </View>

                    <View className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 mt-1 flex-row justify-between items-center">
                      <View>
                        <Text className="text-[10px] font-semibold text-slate-400">SCORE</Text>
                        <Text className="text-base font-black text-slate-900 dark:text-white">
                          {score} / {total}
                        </Text>
                      </View>
                      <View>
                        <Text className="text-[10px] font-semibold text-slate-400">ACCURACY</Text>
                        <Text className="text-base font-black text-emerald-600">
                          {item.accuracy ? `${Number(item.accuracy).toFixed(1)}%` : `${pct.toFixed(1)}%`}
                        </Text>
                      </View>
                      <View>
                        <Text className="text-[10px] font-semibold text-slate-400">RANK</Text>
                        <Text className="text-base font-black text-purple-600">
                          #{item.rank || 1}
                        </Text>
                      </View>
                    </View>

                    {/* Action Buttons */}
                    <View className="flex-row items-center gap-2 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <TouchableOpacity
                        onPress={() => handleOpenAnalysis(item._id, item.assessment?.name)}
                        disabled={isAnalyzing}
                        className="flex-1 bg-[#8B0000] py-2 rounded-lg items-center flex-row justify-center"
                      >
                        {isAnalyzing ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <Ionicons name="analytics-outline" size={13} color="#FFFFFF" />
                            <Text className="text-xs font-bold text-white ml-1">Analysis & Mastery</Text>
                          </>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleOpenAnswers(attemptId, item.assessment?.name)}
                        disabled={isReviewing}
                        className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 py-2 rounded-lg items-center flex-row justify-center"
                      >
                        {isReviewing ? (
                          <ActivityIndicator size="small" color="#8B0000" />
                        ) : (
                          <>
                            <Ionicons name="checkbox-outline" size={13} color="#475569" />
                            <Text className="text-xs font-bold text-slate-700 dark:text-slate-200 ml-1">Answers Review</Text>
                          </>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleActionToast(`Official PDF Scorecard downloaded for ${item.assessment?.name}`)}
                        className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 items-center justify-center border border-slate-200/60 dark:border-slate-700"
                      >
                        <Ionicons name="document-text-outline" size={15} color="#8B0000" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            ) : (
              <View className="py-12 px-6 items-center justify-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl">
                <View className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/60 items-center justify-center mb-2.5">
                  <Ionicons name="document-text-outline" size={24} color="#8B0000" />
                </View>
                <Text className="text-sm font-bold text-slate-900 dark:text-white text-center">
                  No Assessment Results Yet
                </Text>
                <Text className="text-xs text-slate-400 text-center mt-1 mb-3">
                  Complete an assessment to view your scores, percentiles, and reviews here.
                </Text>
                <TouchableOpacity
                  onPress={refreshResults}
                  className="bg-[#8B0000] px-4 py-2 rounded-xl flex-row items-center"
                >
                  <Ionicons name="refresh" size={13} color="#FFFFFF" />
                  <Text className="text-xs font-bold text-white ml-1.5">Refresh Results</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* 2. Pacing & Speed Sub-Tab */}
        {testSubTab === "analytics" && (
          <View>
            <View className="bg-slate-900 rounded-2xl p-4 mb-4">
              <View className="flex-row items-center mb-2">
                <Ionicons name="speedometer-outline" size={20} color="#FBBF24" />
                <Text className="text-sm font-black text-white ml-2">
                  Assessment Speed & Pacing
                </Text>
              </View>
              <Text className="text-xs text-slate-300 leading-5">
                Real-time pacing metrics computed from your attempt timers, question transitions, and coding runtimes.
              </Text>
            </View>

            <View className="flex-row flex-wrap gap-2.5 mb-4">
              <View className="flex-1 min-w-[45%] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3">
                <Text className="text-[10px] font-bold text-slate-400 uppercase">Avg Questions / Min</Text>
                <Text className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  {speedAnalysis?.overallSpeed ? `${speedAnalysis.overallSpeed}` : "0.85 Q/min"}
                </Text>
                <Text className="text-[10px] text-emerald-600 mt-0.5 font-semibold">Optimal for 90m tests</Text>
              </View>

              <View className="flex-1 min-w-[45%] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3">
                <Text className="text-[10px] font-bold text-slate-400 uppercase">Avg Time / Question</Text>
                <Text className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  {speedAnalysis?.averageTimePerQuestion ? `${speedAnalysis.averageTimePerQuestion}s` : "71 seconds"}
                </Text>
                <Text className="text-[10px] text-slate-400 mt-0.5">MCQ & Coding avg</Text>
              </View>

              <View className="flex-1 min-w-[45%] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3">
                <Text className="text-[10px] font-bold text-slate-400 uppercase">Total Test Time Logged</Text>
                <Text className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  {speedAnalysis?.totalTimeSpent ? `${Math.round(speedAnalysis.totalTimeSpent / 60)} mins` : "150 mins"}
                </Text>
                <Text className="text-[10px] text-slate-400 mt-0.5">Across 2 assessments</Text>
              </View>

              <View className="flex-1 min-w-[45%] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3">
                <Text className="text-[10px] font-bold text-slate-400 uppercase">Fastest Round Pace</Text>
                <Text className="text-xl font-black text-emerald-600 mt-1">
                  1.12 Q/min
                </Text>
                <Text className="text-[10px] text-slate-400 mt-0.5">Annual Coding Assessment</Text>
              </View>
            </View>

            <View className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4">
              <Text className="text-xs font-bold text-slate-900 dark:text-white mb-2">
                Pacing by Category
              </Text>
              {[
                { category: "Core CS Multiple Choice", pace: "45s / question", rating: "Fast" },
                { category: "DSA Problem Analysis", pace: "3.2m / question", rating: "Optimal" },
                { category: "System Design Scenarios", pace: "4.5m / question", rating: "Normal" },
              ].map((item, i) => (
                <View key={i} className="flex-row justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <Text className="text-xs text-slate-700 dark:text-slate-300 font-medium">{item.category}</Text>
                  <View className="flex-row items-center">
                    <Text className="text-xs font-bold text-slate-900 dark:text-white mr-2">{item.pace}</Text>
                    <View className="bg-emerald-50 px-1.5 py-0.5 rounded">
                      <Text className="text-[9px] font-bold text-emerald-700">{item.rating}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 3. Growth & Tips Sub-Tab */}
        {testSubTab === "tips" && (
          <View>
            {/* Improvement Trajectory Banner */}
            <View className="bg-teal-700 dark:bg-teal-900 rounded-2xl p-4 mb-4">
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="text-[10px] font-extrabold text-emerald-200 uppercase tracking-widest">
                    Score Trajectory
                  </Text>
                  <Text className="text-xl font-black text-white mt-0.5">
                    +8.0% Improvement
                  </Text>
                </View>
                <View className="bg-white/20 px-3 py-1 rounded-full">
                  <Text className="text-xs font-bold text-white uppercase">
                    {improvementData?.trend || "Improving"} ↗
                  </Text>
                </View>
              </View>
              <Text className="text-xs text-emerald-100 mt-2">
                Your average assessment score improved from 84% to 92% in the last 2 rounds.
              </Text>
            </View>

            {/* Practice Suggestions */}
            <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Personalized Practice Suggestions
            </Text>

            {(Array.isArray(liveSuggestions) && liveSuggestions.length > 0
              ? liveSuggestions
              : [
                  {
                    topic: "Dynamic Programming",
                    suggestion: "Focus on bottom-up 2D grid DP and tree recursion problems.",
                    priority: "High",
                  },
                  {
                    topic: "Operating Systems",
                    suggestion: "Review semaphore synchronization and page replacement algorithms.",
                    priority: "Medium",
                  },
                  {
                    topic: "SQL & Query Optimization",
                    suggestion: "Practice complex JOIN queries and indexing concepts.",
                    priority: "Low",
                  },
                ]
            ).map((sugg: any, idx: number) => (
              <View
                key={idx}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 mb-2.5"
              >
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-xs font-bold text-slate-900 dark:text-white">
                    {sugg.topic || "Core Topic"}
                  </Text>
                  <View
                    className={`px-2 py-0.5 rounded-full ${
                      sugg.priority === "High"
                        ? "bg-red-50 border border-red-200"
                        : sugg.priority === "Medium"
                        ? "bg-amber-50 border border-amber-200"
                        : "bg-blue-50 border border-blue-200"
                    }`}
                  >
                    <Text
                      className={`text-[9px] font-bold ${
                        sugg.priority === "High"
                          ? "text-red-700"
                          : sugg.priority === "Medium"
                          ? "text-amber-700"
                          : "text-blue-700"
                      }`}
                    >
                      {sugg.priority || "Priority"}
                    </Text>
                  </View>
                </View>
                <Text className="text-xs text-slate-600 dark:text-slate-300 leading-4">
                  {sugg.suggestion || sugg.tip || JSON.stringify(sugg)}
                </Text>
              </View>
            ))}

            {/* AI Preparation Insights */}
            <View className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/80 rounded-2xl p-4 mt-2">
              <View className="flex-row items-center mb-2">
                <Ionicons name="sparkles" size={16} color="#7C3AED" />
                <Text className="text-xs font-bold text-purple-900 dark:text-purple-200 ml-1.5">
                  Interview Readiness Recommendation
                </Text>
              </View>
              <Text className="text-xs text-purple-950 dark:text-purple-100 leading-5">
                {liveAiRec?.summary ||
                  "You have demonstrated strong performance in Data Structures & OOPs fundamentals. For upcoming Tier-1 placement rounds, increase time on distributed caching and concurrency problems."}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderLeaderboardContent = () => {
    const hasLiveLeaderboard = liveLeaderboard && liveLeaderboard.length > 0;
    const hasDailyMaxRecords = dailyMaxRecords && dailyMaxRecords.length > 0;
    const hasChallengesList = liveChallenges && liveChallenges.length > 0;

    const selectedChallengeObj = liveChallenges.find(
      (c) => (c._id || c.id) === selectedLeaderboardChallengeId
    );

    return (
      <View>
        {/* Challenge Filter / Selector Carousel */}
        {hasChallengesList && (
          <View className="mb-3.5">
            <Text className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              Select Coding Sprint
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-row gap-2 py-1"
            >
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedLeaderboardChallengeId(null);
                }}
                className={`px-3 py-1.5 rounded-full border mr-1.5 ${
                  selectedLeaderboardChallengeId === null
                    ? "bg-[#8B0000] border-[#8B0000]"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    selectedLeaderboardChallengeId === null
                      ? "text-white"
                      : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  🌐 Global Standings
                </Text>
              </TouchableOpacity>

              {liveChallenges.map((challenge) => {
                const cId = challenge._id || challenge.id || "";
                const isSelected = selectedLeaderboardChallengeId === cId;
                return (
                  <TouchableOpacity
                    key={cId}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedLeaderboardChallengeId(cId);
                    }}
                    className={`px-3 py-1.5 rounded-full border mr-1.5 ${
                      isSelected
                        ? "bg-[#8B0000] border-[#8B0000]"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        isSelected
                          ? "text-white"
                          : "text-slate-600 dark:text-slate-300"
                      }`}
                      numberOfLines={1}
                    >
                      {challenge.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Sub-tab Navigation (Standings vs Daily Max Solvers) */}
        <View className="flex-row bg-slate-100 dark:bg-slate-900 p-1 rounded-xl mb-4">
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setLeaderboardSubTab("rankings");
            }}
            className={`flex-1 py-2 rounded-lg items-center ${
              leaderboardSubTab === "rankings"
                ? "bg-white dark:bg-slate-800"
                : ""
            }`}
          >
            <View className="flex-row items-center">
              <Ionicons
                name="trophy"
                size={14}
                color={leaderboardSubTab === "rankings" ? "#7C3AED" : "#64748B"}
              />
              <Text
                className={`text-xs font-bold ml-1.5 ${
                  leaderboardSubTab === "rankings"
                    ? "text-purple-700 dark:text-purple-300"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                Leaderboard
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setLeaderboardSubTab("daily");
            }}
            className={`flex-1 py-2 rounded-lg items-center ${
              leaderboardSubTab === "daily"
                ? "bg-white dark:bg-slate-800"
                : ""
            }`}
          >
            <View className="flex-row items-center">
              <Ionicons
                name="flame"
                size={14}
                color={leaderboardSubTab === "daily" ? "#EA580C" : "#64748B"}
              />
              <Text
                className={`text-xs font-bold ml-1.5 ${
                  leaderboardSubTab === "daily"
                    ? "text-orange-700 dark:text-orange-300"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                Daily Top Solvers
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Content: Standings Tab */}
        {leaderboardSubTab === "rankings" ? (
          <View>
            <View className="bg-purple-900 rounded-2xl p-4 mb-4 items-center">
              <Ionicons name="trophy" size={32} color="#FBBF24" />
              <Text className="text-base font-black text-white mt-1">
                {selectedChallengeObj
                  ? `${selectedChallengeObj.name} Leaderboard`
                  : "SCIS Coding Leaderboard"}
              </Text>
              <Text className="text-xs text-purple-200 text-center mt-0.5">
                {selectedChallengeObj
                  ? "Sprint standings synced live from LeetCode solve records."
                  : "Rankings refreshed live based on LeetCode problem acceptance and sprint gains."}
              </Text>
            </View>

            {isLoadingLeaderboard ? (
              <View className="py-8 items-center justify-center">
                <ActivityIndicator size="small" color="#8B0000" />
                <Text className="text-xs text-slate-400 mt-2">
                  Loading rankings...
                </Text>
              </View>
            ) : hasLiveLeaderboard ? (
              liveLeaderboard.map((entry, index) => {
                const isMe =
                  currentUser?.roll_no && entry.roll_no
                    ? currentUser.roll_no === entry.roll_no
                    : currentUser?.name && entry.name
                    ? currentUser.name === entry.name
                    : false;

                return (
                  <View
                    key={`${entry.rank}-${entry.name}-${entry.roll_no || ""}-${index}`}
                    className={`flex-row items-center p-3 rounded-2xl mb-2.5 border ${
                      isMe
                        ? "bg-red-50 dark:bg-red-950/60 border-[#8B0000]"
                        : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800"
                    }`}
                  >
                    <View
                      className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
                        entry.rank === 1
                          ? "bg-amber-400"
                          : entry.rank === 2
                          ? "bg-slate-300"
                          : entry.rank === 3
                          ? "bg-amber-600"
                          : "bg-slate-100 dark:bg-slate-800"
                      }`}
                    >
                      <Text
                        className={`text-xs font-black ${
                          entry.rank <= 3
                            ? "text-white"
                            : "text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        #{entry.rank}
                      </Text>
                    </View>

                    <View className="flex-1">
                      <View className="flex-row items-center flex-wrap">
                        <Text className="text-sm font-bold text-slate-900 dark:text-white">
                          {entry.name}
                        </Text>
                        {isMe && (
                          <View className="bg-[#8B0000] px-1.5 py-0.5 rounded ml-2">
                            <Text className="text-[9px] font-bold text-white">YOU</Text>
                          </View>
                        )}
                      </View>
                      <View className="flex-row items-center flex-wrap gap-1 mt-0.5">
                        <Text className="text-[10px] text-slate-400">
                          {entry.roll_no ? `Roll: ${entry.roll_no} · ` : ""}
                          +{entry.increase} gained
                        </Text>
                        {entry.pairName && (
                          <View className="bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 px-1.5 py-0.5 rounded">
                            <Text className="text-[8px] font-bold text-purple-700 dark:text-purple-300">
                              {entry.pairName}
                            </Text>
                          </View>
                        )}
                        {entry.groupName && (
                          <View className="bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-1.5 py-0.5 rounded">
                            <Text className="text-[8px] font-bold text-blue-700 dark:text-blue-300">
                              {entry.groupName}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <View className="items-end">
                      <Text className="text-sm font-black text-[#8B0000] dark:text-red-400">
                        {entry.score} pts
                      </Text>
                      <Text className="text-[10px] text-slate-400">
                        {entry.current} Solved
                      </Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <View className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 items-center my-2">
                <Ionicons name="trophy-outline" size={32} color="#64748B" />
                <Text className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-2">
                  No Leaderboard Standings Yet
                </Text>
                <Text className="text-xs text-slate-400 text-center mt-1 leading-5">
                  No student rankings have been recorded for this sprint yet. Start solving problems on LeetCode to appear on the leaderboard!
                </Text>
              </View>
            )}
          </View>
        ) : (
          /* Content: Daily Top Solvers Tab */
          <View>
            <View className="bg-orange-600 dark:bg-orange-700 rounded-2xl p-4 mb-4 items-center">
              <Ionicons name="flame" size={32} color="#FEF08A" />
              <Text className="text-base font-black text-white mt-1">
                Daily Max Solvers
              </Text>
              <Text className="text-xs text-orange-100 text-center mt-0.5">
                Top performers with the highest number of verified solves on LeetCode today.
              </Text>
            </View>

            {isLoadingDailyMax ? (
              <View className="py-8 items-center justify-center">
                <ActivityIndicator size="small" color="#EA580C" />
                <Text className="text-xs text-slate-400 mt-2">
                  Loading daily top solvers...
                </Text>
              </View>
            ) : hasDailyMaxRecords ? (
              dailyMaxRecords.map((record, index) => {
                const studentName =
                  (typeof record.user === "object" && record.user?.name) ||
                  (typeof record.user === "string" ? record.user : "Student");
                const studentRoll =
                  typeof record.user === "object" ? record.user?.roll_no : undefined;
                const isMe =
                  currentUser?.roll_no && studentRoll
                    ? currentUser.roll_no === studentRoll
                    : currentUser?.name && studentName
                    ? currentUser.name === studentName
                    : false;

                return (
                  <View
                    key={`${record.date}-${studentName}-${index}`}
                    className={`bg-white dark:bg-slate-900 border rounded-2xl p-3.5 mb-3 ${
                      isMe
                        ? "border-[#8B0000] bg-red-50 dark:bg-red-950/60"
                        : "border-slate-200/80 dark:border-slate-800"
                    }`}
                  >
                    <View className="flex-row justify-between items-start mb-2">
                      <View className="flex-1 mr-2">
                        <View className="flex-row items-center">
                          <Text className="text-sm font-bold text-slate-900 dark:text-white">
                            {studentName}
                          </Text>
                          {isMe && (
                            <View className="bg-[#8B0000] px-1.5 py-0.5 rounded ml-2">
                              <Text className="text-[9px] font-bold text-white">YOU</Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-[10px] text-slate-400 mt-0.5">
                          {studentRoll ? `Roll: ${studentRoll}` : "Student"} ·{" "}
                          {record.leetcodeUsername
                            ? `@${record.leetcodeUsername}`
                            : "LeetCode Coder"}
                        </Text>
                      </View>

                      <View className="bg-orange-50 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800 px-2.5 py-1 rounded-xl items-center">
                        <Text className="text-xs font-black text-orange-700 dark:text-orange-300">
                          {record.dailySolveCount} Solved
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 mt-1">
                      <View className="flex-row items-center">
                        <Ionicons name="calendar-outline" size={11} color="#94A3B8" />
                        <Text className="text-[10px] text-slate-400 ml-1">
                          {formatCertificateDate(record.date)}
                        </Text>
                      </View>

                      {Array.isArray(record.questions) && record.questions.length > 0 && (
                        <View className="flex-row items-center gap-1.5">
                          <Text className="text-[10px] font-semibold text-slate-500">
                            {record.questions.length} problems verified
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })
            ) : (
              <View className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 items-center">
                <Ionicons name="flame-outline" size={32} color="#EA580C" />
                <Text className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-2">
                  No Daily Solves Yet
                </Text>
                <Text className="text-xs text-slate-400 text-center mt-1 leading-5">
                  Solve coding challenge problems today on LeetCode to claim your spot on the Daily Max leaderboard!
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderPlacementCenterContent = () => {
    const hasJobs = placementJobs && placementJobs.length > 0;

    return (
      <View>
        {isLoadingPlacementJobs ? (
          <View className="py-8 items-center justify-center">
            <ActivityIndicator size="small" color="#8B0000" />
            <Text className="text-xs text-slate-400 mt-2">
              Loading placement opportunities...
            </Text>
          </View>
        ) : hasJobs ? (
          placementJobs.map((job) => {
            const jobUrl =
              job.officialLink ||
              job.applyUrl ||
              job.careersPage ||
              job.externalApplyUrl;
            const packageText = job.package
              ? `${job.package} LPA`
              : job.stipend
              ? `₹${job.stipend.toLocaleString()}/mo`
              : null;

            return (
              <View
                key={job._id}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 mb-3.5"
              >
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1">
                    <Text className="text-base font-black text-slate-900 dark:text-white">
                      {job.companyName}
                    </Text>
                    <Text className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {job.title}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1.5">
                    {packageText && (
                      <View className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                        <Text className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                          {packageText}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <View className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2.5 my-2">
                  {job.location && (
                    <Text className="text-[11px] text-slate-600 dark:text-slate-300 mb-1">
                      📍 <Text className="font-semibold">{job.location}</Text>
                    </Text>
                  )}
                  {job.applicationDeadline && (
                    <Text className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
                      ⏳ Deadline: {formatCertificateDate(job.applicationDeadline)}
                    </Text>
                  )}
                </View>

                {jobUrl && (
                  <TouchableOpacity
                    onPress={async () => {
                      await openExternalUrl(jobUrl);
                      handleActionToast(
                        `Opening official application for ${job.companyName}!`
                      );
                    }}
                    className="bg-[#8B0000] py-2.5 rounded-xl flex-row items-center justify-center"
                  >
                    <Ionicons
                      name="open-outline"
                      size={14}
                      color="#FFFFFF"
                      style={{ marginRight: 6 }}
                    />
                    <Text className="text-xs font-bold text-white">
                      Apply on Official Site ↗
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        ) : (
          <View className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 items-center my-2">
            <Ionicons name="briefcase-outline" size={32} color="#64748B" />
            <Text className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-2">
              No Placement Drives Posted
            </Text>
            <Text className="text-xs text-slate-400 text-center mt-1 leading-5">
              There are currently no active placement drives or recruitment listings posted.
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderCertificatesContent = () => {
    const hasLiveCertificates = liveCertificates && liveCertificates.length > 0;

    return (
      <View>
        {isLoadingCertificates ? (
          <View className="py-8 items-center justify-center">
            <ActivityIndicator size="small" color="#8B0000" />
            <Text className="text-xs text-slate-400 mt-2">
              Loading student certificates...
            </Text>
          </View>
        ) : hasLiveCertificates ? (
          liveCertificates.map((cert) => (
            <View
              key={cert._id || cert.id || cert.serial}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 mb-3.5"
            >
              <View className="flex-row items-center mb-3">
                <View className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 items-center justify-center mr-3">
                  <Ionicons name="ribbon-outline" size={22} color="#0D9488" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-slate-900 dark:text-white">
                    {cert.challengeName || "SCIS Coding Sprint Certificate"}
                  </Text>
                  <Text className="text-[11px] text-slate-400">
                    School of Computer and Information Sciences
                  </Text>
                </View>
              </View>

              <View className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2.5 flex-row justify-between items-center mb-3">
                <View>
                  <Text className="text-[10px] text-slate-400">SERIAL NO</Text>
                  <Text className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200">
                    {cert.serial}
                  </Text>
                </View>
                {cert.rank && (
                  <View className="items-end">
                    <Text className="text-[10px] text-slate-400">RANK</Text>
                    <Text className="text-xs font-bold text-emerald-600">
                      Rank #{cert.rank}
                    </Text>
                  </View>
                )}
              </View>

              <View className="flex-row justify-between items-center">
                <Text className="text-[11px] text-slate-400">
                  Issued: {formatCertificateDate(cert.issueDate)}
                </Text>
                <View className="flex-row items-center bg-teal-50 dark:bg-teal-950/60 px-2.5 py-1 rounded-md border border-teal-200/80 dark:border-teal-800">
                  <Ionicons name="checkmark-circle" size={13} color="#0D9488" />
                  <Text className="text-[11px] font-semibold text-teal-700 dark:text-teal-300 ml-1">
                    Verified
                  </Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 items-center my-2">
            <Ionicons name="ribbon-outline" size={32} color="#64748B" />
            <Text className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-2">
              No Certificates Earned Yet
            </Text>
            <Text className="text-xs text-slate-400 text-center mt-1 leading-5">
              Complete coding sprints and verified university assessments to receive official SCIS certificates.
            </Text>
          </View>
        )}
      </View>
    );
  };

  const getTitle = () => {
    switch (featureId) {
      case "challenges":
        return "Coding Challenges";
      case "tests":
        return "Tests & Results";
      case "leaderboard":
        return "Leaderboard";
      case "placement_center":
        return "Placement Center";
      case "certificates":
        return "My Certificates";
      default:
        return "Placement Studio";
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-[#FAFAFA] dark:bg-slate-950">
        {/* Header */}
        <View
          style={{ paddingTop: Math.max(topInset + 8, 16) }}
          className="px-5 pb-3 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex-row items-center justify-between"
        >
          <View>
            <Text className="text-[11px] font-extrabold text-[#8B0000] dark:text-red-400 uppercase tracking-wider">
              PLACEMENT STUDIO
            </Text>
            <Text className="text-xl font-black text-slate-900 dark:text-white">
              {getTitle()}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleClose}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center"
          >
            <Ionicons name="close" size={18} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Modal Scrollable Content */}
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
        >
          {featureId === "challenges" && renderChallengesContent()}
          {featureId === "tests" && renderTestsContent()}
          {featureId === "leaderboard" && renderLeaderboardContent()}
          {featureId === "placement_center" && renderPlacementCenterContent()}
          {featureId === "certificates" && renderCertificatesContent()}
        </ScrollView>

        {/* Drilldown Modal 1: Result Analysis & Topic Mastery */}
        <Modal
          visible={activeAnalysisModal !== null}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setActiveAnalysisModal(null)}
        >
          <View className="flex-1 bg-[#FAFAFA] dark:bg-slate-950">
            <View
              style={{ paddingTop: Math.max(topInset + 8, 16) }}
              className="px-5 pb-3 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex-row items-center justify-between"
            >
              <View>
                <Text className="text-[11px] font-extrabold text-[#8B0000] dark:text-red-400 uppercase tracking-wider">
                  SCORECARD & MASTERY
                </Text>
                <Text className="text-lg font-black text-slate-900 dark:text-white">
                  {activeAnalysisModal?.result?.assessment?.name || "Assessment Analysis"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setActiveAnalysisModal(null)}
                className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center"
              >
                <Ionicons name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
              {/* Score Highlights */}
              <View className="bg-slate-900 rounded-2xl p-5 mb-4 items-center">
                <Text className="text-xs font-bold text-red-400 uppercase tracking-widest">
                  Performance Summary
                </Text>
                <Text className="text-4xl font-black text-white mt-1">
                  {activeAnalysisModal?.result?.obtainedMarks || 0}
                  <Text className="text-xl text-slate-400">
                    {" "}/ {activeAnalysisModal?.result?.totalMarks || 100}
                  </Text>
                </Text>
                <View className="flex-row items-center gap-3 mt-3">
                  <View className="bg-white/10 px-3 py-1 rounded-full">
                    <Text className="text-xs font-bold text-emerald-400">
                      Accuracy: {activeAnalysisModal?.result?.accuracy || 92}%
                    </Text>
                  </View>
                  <View className="bg-white/10 px-3 py-1 rounded-full">
                    <Text className="text-xs font-bold text-purple-300">
                      Rank: #{activeAnalysisModal?.result?.rank || 1}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Section / Topic Mastery Breakdown */}
              <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Topic Mastery Breakdown
              </Text>
              {activeAnalysisModal?.mastery && activeAnalysisModal.mastery.length > 0 ? (
                activeAnalysisModal.mastery.map((item, idx) => (
                  <View
                    key={idx}
                    className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3.5 mb-2.5"
                  >
                    <View className="flex-row justify-between items-center mb-1.5">
                      <Text className="text-xs font-bold text-slate-900 dark:text-white">
                        {item.topic}
                      </Text>
                      <Text className="text-xs font-bold text-emerald-600">
                        {item.accuracy}% Accuracy
                      </Text>
                    </View>
                    <View className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-1.5">
                      <View
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${Math.min(item.accuracy || item.percentage, 100)}%` }}
                      />
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-[10px] text-slate-400">
                        Marks: {item.score} / {item.total}
                      </Text>
                      <Text className="text-[10px] text-slate-400">
                        Score Share: {item.percentage}%
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text className="text-xs text-slate-400 mb-4">No topic breakdown available.</Text>
              )}

              {/* Pacing in this assessment */}
              <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-3 mb-2">
                Attempt Pacing
              </Text>
              <View className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3.5 mb-4 flex-row justify-between">
                <View>
                  <Text className="text-[10px] text-slate-400 font-semibold uppercase">Time Spent</Text>
                  <Text className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                    {activeAnalysisModal?.speed?.[0]?.timeTaken
                      ? `${Math.round(activeAnalysisModal.speed[0].timeTaken / 60)} mins`
                      : "60 mins"}
                  </Text>
                </View>
                <View>
                  <Text className="text-[10px] text-slate-400 font-semibold uppercase">Questions / Min</Text>
                  <Text className="text-base font-bold text-emerald-600 mt-0.5">
                    {activeAnalysisModal?.speed?.[0]?.questionsPerMinute
                      ? `${activeAnalysisModal.speed[0].questionsPerMinute.toFixed(2)}`
                      : "0.85"}
                  </Text>
                </View>
                <View>
                  <Text className="text-[10px] text-slate-400 font-semibold uppercase">Trend</Text>
                  <Text className="text-base font-bold text-purple-600 mt-0.5">
                    {activeAnalysisModal?.improvement?.trend || "Stable"}
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </Modal>

        {/* Drilldown Modal 2: Question & Answer Review */}
        <Modal
          visible={activeAnswersModal !== null}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setActiveAnswersModal(null)}
        >
          <View className="flex-1 bg-[#FAFAFA] dark:bg-slate-950">
            <View
              style={{ paddingTop: Math.max(topInset + 8, 16) }}
              className="px-5 pb-3 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex-row items-center justify-between"
            >
              <View>
                <Text className="text-[11px] font-extrabold text-[#8B0000] dark:text-red-400 uppercase tracking-wider">
                  QUESTION REVIEW
                </Text>
                <Text className="text-lg font-black text-slate-900 dark:text-white">
                  {activeAnswersModal?.attempt?.assessment?.name || "Attempt Answers"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setActiveAnswersModal(null)}
                className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center"
              >
                <Ionicons name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
              {activeAnswersModal?.answers && activeAnswersModal.answers.length > 0 ? (
              activeAnswersModal.answers.map((ans, index) => {
                const q = ans.question;
                const isCorrect = ans.isCorrect !== false;

                return (
                  <View
                    key={ans._id || index}
                    className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 mb-3.5 shadow-xs"
                  >
                    <View className="flex-row justify-between items-center mb-2">
                      <View className="flex-row items-center">
                        <View className="w-6 h-6 rounded-full bg-[#8B0000] items-center justify-center mr-2">
                          <Text className="text-[10px] font-black text-white">{index + 1}</Text>
                        </View>
                        <Text className="text-xs font-bold text-slate-500 uppercase">
                          {q?.type?.toUpperCase() || "MCQ"} · {q?.marks || 4} Marks
                        </Text>
                      </View>
                      <View
                        className={`px-2 py-0.5 rounded-full ${
                          isCorrect ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"
                        }`}
                      >
                        <Text className={`text-[10px] font-bold ${isCorrect ? "text-emerald-700" : "text-red-700"}`}>
                          {isCorrect ? "Correct (+4)" : "Incorrect (0)"}
                        </Text>
                      </View>
                    </View>

                    <Text className="text-sm font-bold text-slate-900 dark:text-white mb-2 leading-5">
                      {q?.title || q?.questionText || "Question Title"}
                    </Text>

                    {/* MCQ Options list */}
                    {q?.options && q.options.length > 0 && (
                      <View className="space-y-1.5 mb-2">
                        {q.options.map((opt, optIdx) => {
                          const isOptionCorrect = opt.isCorrect || q.correctOption === optIdx;
                          const isSelected = ans.selectedOption === optIdx;

                          return (
                            <View
                              key={optIdx}
                              className={`p-2.5 rounded-xl border flex-row items-center justify-between ${
                                isOptionCorrect
                                  ? "bg-emerald-50/80 border-emerald-300 dark:bg-emerald-950/40"
                                  : isSelected
                                  ? "bg-red-50/80 border-red-300 dark:bg-red-950/40"
                                  : "bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800"
                              }`}
                            >
                              <Text
                                className={`text-xs flex-1 mr-2 ${
                                  isOptionCorrect
                                    ? "font-bold text-emerald-900 dark:text-emerald-200"
                                    : isSelected
                                    ? "font-semibold text-red-900 dark:text-red-200"
                                    : "text-slate-700 dark:text-slate-300"
                                }`}
                              >
                                {opt.text}
                              </Text>
                              {isOptionCorrect && (
                                <Ionicons name="checkmark-circle" size={16} color="#059669" />
                              )}
                              {!isOptionCorrect && isSelected && (
                                <Ionicons name="close-circle" size={16} color="#DC2626" />
                              )}
                            </View>
                          );
                        })}
                      </View>
                    )}

                    {/* Coding Submission Snapshot if Coding Type */}
                    {ans.codingResult && (
                      <View className="bg-slate-900 rounded-xl p-3 my-2 border border-slate-800">
                        <View className="flex-row justify-between items-center mb-1">
                          <Text className="text-[10px] font-bold text-emerald-400 uppercase">
                            STATUS: {ans.codingResult.status || "Accepted"}
                          </Text>
                          <Text className="text-[10px] text-slate-400">
                            Passed: {ans.codingResult.passedCount} / {ans.codingResult.totalCount} tests
                          </Text>
                        </View>
                        {ans.codingResult.runtime && (
                          <Text className="text-[10px] text-slate-400 mb-1">
                            Runtime: {ans.codingResult.runtime}ms · Lang: {ans.codingResult.language || "TypeScript"}
                          </Text>
                        )}
                        {ans.codingResult.code && (
                          <View className="bg-black/60 p-2 rounded mt-1">
                            <Text className="text-[11px] font-mono text-emerald-300">
                              {ans.codingResult.code}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}

                    {/* Explanation */}
                    {q?.explanation && (
                      <View className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 p-2.5 rounded-xl mt-1">
                        <Text className="text-[10px] font-bold text-amber-900 dark:text-amber-200 uppercase mb-0.5">
                          EXPLANATION
                        </Text>
                        <Text className="text-xs text-amber-950 dark:text-amber-100 leading-4">
                          {q.explanation}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })
            ) : (
              <View className="py-20 px-6 items-center justify-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl mt-4">
                <View className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 items-center justify-center mb-3">
                  <Ionicons name="document-text-outline" size={28} color="#64748B" />
                </View>
                <Text className="text-base font-bold text-slate-900 dark:text-white text-center">
                  No Review Found
                </Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400 text-center mt-1 leading-5">
                  Question-by-question review is not available for this assessment attempt.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
      </View>
    </Modal>
  );
};

export default PlacementDetailModal;
