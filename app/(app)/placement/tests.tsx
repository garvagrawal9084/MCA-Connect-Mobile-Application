/**
 * SCIS Connect Mobile - Placement Studio: My Results Screen
 * Directly connects to backend endpoint:
 * - GET /api/assessments/results/my
 * - GET /api/assessments/results/:id
 * - GET /api/assessments/:assessmentId/results
 * - POST /api/assessments/results/compute/:attemptId
 * - POST /api/assessments/results/:id/publish
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  TextInput,
  Platform,
  StatusBar as RNStatusBar,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

import {
  useMyResults,
  useResult,
  usePerformanceAnalytics,
  useResultActions,
  useResultStore,
  ResultItem,
  ResultAnalysisResponse,
  AttemptAnswersResponse,
} from "@/features/results";
import { useAuthStore } from "@/features/auth/authStore";
import { logger } from "@/utils/logger";

export default function TestsAndResultsScreen() {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);

  // Sub-tabs
  const [activeTab, setActiveTab] = useState<"results" | "analytics" | "admin">("results");
  const [refreshing, setRefreshing] = useState(false);

  // Drilldown states
  const [selectedResult, setSelectedResult] = useState<ResultItem | null>(null);
  const [activeAnalysisModal, setActiveAnalysisModal] = useState<ResultAnalysisResponse | null>(null);
  const [activeAnswersModal, setActiveAnswersModal] = useState<AttemptAnswersResponse | null>(null);
  const [loadingAnalysisId, setLoadingAnalysisId] = useState<string | null>(null);
  const [loadingAnswersId, setLoadingAnswersId] = useState<string | null>(null);

  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === "android" ? (RNStatusBar.currentHeight ?? 24) : 0
  );

  // Faculty / Admin inputs
  const [attemptIdInput, setAttemptIdInput] = useState("");
  const [resultIdInput, setResultIdInput] = useState("");

  // Store hooks
  const { results: liveResults, isLoading: isLoadingResults, error: resultsError, refresh: refreshResults } = useMyResults();
  const {
    speedAnalysis,
    improvementData,
    suggestions,
    aiRecommendation,
    isLoading: isLoadingAnalytics,
    refresh: refreshAnalytics,
  } = usePerformanceAnalytics();
  const { computeResult, publishResult, isComputing, isPublishing } = useResultActions();
  const fetchResultAnalysis = useResultStore((state) => state.fetchResultAnalysis);
  const fetchAttemptAnswers = useResultStore((state) => state.fetchAttemptAnswers);

  const isFacultyOrAdmin =
    currentUser?.role === "ADMIN" ||
    currentUser?.role === "FACULTY" ||
    currentUser?.role === "OWNER" ||
    currentUser?.role === "SUPER_ADMIN" ||
    currentUser?.role === "admin" ||
    currentUser?.role === "faculty";

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Promise.allSettled([refreshResults(), refreshAnalytics()]);
    } finally {
      setRefreshing(false);
    }
  }, [refreshResults, refreshAnalytics]);

  const handleOpenDetails = (item: ResultItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedResult(item);
    logger.info("TESTS_SCREEN", `Viewing result details: ${item._id}`);
  };

  const handleOpenAnalysis = async (item: ResultItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoadingAnalysisId(item._id);
    logger.info("TESTS_SCREEN", `Opening result analysis: ${item._id}`);

    const res = await fetchResultAnalysis(item._id);
    setLoadingAnalysisId(null);

    if (res) {
      setActiveAnalysisModal(res);
    } else {
      setSelectedResult(item);
    }
  };

  const handleOpenAnswers = async (item: ResultItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const attemptId = item.attempt?._id;

    if (!attemptId) {
      setActiveAnswersModal({
        attempt: {
          _id: item._id,
          status: item.status || "evaluated",
          assessment: { name: item.assessment?.name || "Assessment Review" },
        },
        answers: [],
      });
      return;
    }

    setLoadingAnswersId(attemptId);
    logger.info("TESTS_SCREEN", `Opening answers review: ${attemptId}`);

    try {
      const res = await fetchAttemptAnswers(attemptId);
      if (res && Array.isArray(res.answers) && res.answers.length > 0) {
        setActiveAnswersModal(res);
      } else {
        setActiveAnswersModal({
          attempt: {
            _id: attemptId,
            status: item.status || "evaluated",
            assessment: { name: item.assessment?.name || "Assessment Review" },
          },
          answers: [],
        });
      }
    } catch {
      setActiveAnswersModal({
        attempt: {
          _id: attemptId,
          status: item.status || "evaluated",
          assessment: { name: item.assessment?.name || "Assessment Review" },
        },
        answers: [],
      });
    } finally {
      setLoadingAnswersId(null);
    }
  };

  const handleComputeResult = async () => {
    if (!attemptIdInput.trim()) {
      Alert.alert("Input Required", "Please enter an Attempt ID to compute result.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const res = await computeResult(attemptIdInput.trim());
    if (res) {
      Alert.alert("Result Computed", `Successfully computed score: ${res.obtainedMarks} / ${res.totalMarks}`);
      setAttemptIdInput("");
      refreshResults();
    } else {
      Alert.alert("Error", "Could not compute result for this attempt.");
    }
  };

  const handlePublishResult = async () => {
    if (!resultIdInput.trim()) {
      Alert.alert("Input Required", "Please enter a Result ID to publish.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const res = await publishResult(resultIdInput.trim());
    if (res) {
      Alert.alert("Result Published", `Result ${resultIdInput.trim()} is now publicly accessible to the student.`);
      setResultIdInput("");
      refreshResults();
    } else {
      Alert.alert("Error", "Could not publish result.");
    }
  };

  const hasLiveResults = liveResults && liveResults.length > 0;

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC] dark:bg-slate-950">
      <StatusBar style="auto" />

      {/* Top Header */}
      <View className="px-5 pt-3 pb-3 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex-row items-center justify-between shadow-xs">
        <View className="flex-row items-center flex-1">
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center mr-3"
          >
            <Ionicons name="arrow-back" size={18} color="#64748B" />
          </TouchableOpacity>

          {/* Gradient Icon and Title */}
          <View className="w-10 h-10 rounded-xl bg-[#8B0000] items-center justify-center mr-3 shadow-xs">
            <Ionicons name="stats-chart" size={20} color="#FFFFFF" />
          </View>
          <View className="flex-1">
            <Text className="text-xl font-black text-slate-900 dark:text-white">
              My Results
            </Text>
            <Text className="text-xs text-slate-500 dark:text-slate-400">
              View your assessment performance
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleRefresh}
          className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center ml-2"
        >
          <Ionicons name="refresh" size={16} color="#64748B" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#8B0000"
          />
        }
      >
        {/* Navigation Tabs if Admin or Analytics Available */}
        {isFacultyOrAdmin && (
          <View className="flex-row bg-slate-200/80 dark:bg-slate-900 p-1 rounded-xl mb-4">
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab("results");
              }}
              className={`flex-1 py-2 rounded-lg items-center ${
                activeTab === "results" ? "bg-white dark:bg-slate-800 shadow-xs" : ""
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  activeTab === "results"
                    ? "text-slate-900 dark:text-white"
                    : "text-slate-500"
                }`}
              >
                My Scorecards
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab("admin");
              }}
              className={`flex-1 py-2 rounded-lg items-center ${
                activeTab === "admin" ? "bg-white dark:bg-slate-800 shadow-xs" : ""
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  activeTab === "admin"
                    ? "text-[#8B0000] dark:text-red-400"
                    : "text-slate-500"
                }`}
              >
                Faculty Actions
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Results List */}
        {activeTab === "results" && (
          <View>
            {isLoadingResults ? (
              <View className="py-16 items-center justify-center">
                <ActivityIndicator size="large" color="#8B0000" />
                <Text className="text-xs text-slate-400 mt-3 font-medium">
                  Loading assessment results...
                </Text>
              </View>
            ) : hasLiveResults ? (
              liveResults.map((item, index) => {
                const percentage =
                  item.percentage !== undefined
                    ? item.percentage
                    : item.totalMarks > 0
                    ? (item.obtainedMarks / item.totalMarks) * 100
                    : 0;
                const formattedPercentage = percentage.toFixed(1);
                const rank = item.rank || index + 1;
                const correctCount = item.correct ?? item.correctCount ?? 0;
                const wrongCount = item.wrong ?? item.wrongCount ?? 0;
                const skippedCount = item.skipped ?? item.skippedCount ?? 0;
                const rawPercentile =
                  item.percentile !== undefined
                    ? Math.max(0, 100 - item.percentile)
                    : Math.max(0, 100 - percentage);
                const topPercentile = rawPercentile.toFixed(1);

                return (
                  <Animated.View
                    key={item._id || index}
                    entering={FadeInDown.delay(index * 50).duration(260).springify().damping(20)}
                    className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 mb-4 shadow-sm overflow-hidden"
                  >
                    {/* Top Accent Gradient/Pill */}
                    <View className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />

                    {/* Card Header: Title + Status Badge */}
                    <View className="flex-row justify-between items-start mb-4 mt-0.5">
                      <Text
                        className="text-base font-bold text-slate-900 dark:text-white flex-1 mr-2 leading-6"
                        numberOfLines={2}
                      >
                        {item.assessment?.name || item.assessment?.displayName || "Assessment"}
                      </Text>
                      <View className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-md">
                        <Text className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          {item.status || "Passed"}
                        </Text>
                      </View>
                    </View>

                    {/* 3 Columns Metrics Row */}
                    <View className="flex-row justify-between items-center py-2 mb-3">
                      {/* 1. Percentage */}
                      <View className="items-start flex-1">
                        <Text className="text-2xl font-black text-[#8B0000] dark:text-red-400">
                          {formattedPercentage}%
                        </Text>
                        <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Percentage
                        </Text>
                      </View>

                      {/* 2. Rank */}
                      <View className="items-center flex-1">
                        <Text className="text-2xl font-black text-slate-900 dark:text-white">
                          #{rank}
                        </Text>
                        <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Rank
                        </Text>
                      </View>

                      {/* 3. Marks */}
                      <View className="items-end flex-1">
                        <Text className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                          {item.obtainedMarks}/{item.totalMarks}
                        </Text>
                        <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Marks
                        </Text>
                      </View>
                    </View>

                    {/* Breakdown Counts Row: Correct, Wrong, Skipped */}
                    <View className="flex-row items-center gap-4 py-2 border-t border-slate-100 dark:border-slate-800/80 mb-2">
                      <View className="flex-row items-center">
                        <Ionicons name="checkmark-circle-outline" size={14} color="#16A34A" />
                        <Text className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 ml-1">
                          {correctCount} correct
                        </Text>
                      </View>

                      <View className="flex-row items-center">
                        <Ionicons name="close-circle-outline" size={14} color="#DC2626" />
                        <Text className="text-xs font-semibold text-red-600 dark:text-red-400 ml-1">
                          {wrongCount} wrong
                        </Text>
                      </View>

                      <View className="flex-row items-center">
                        <Ionicons name="play-skip-forward-outline" size={14} color="#D97706" />
                        <Text className="text-xs font-semibold text-amber-600 dark:text-amber-400 ml-1">
                          {skippedCount} skipped
                        </Text>
                      </View>
                    </View>

                    {/* Top Percentile Line */}
                    <View className="flex-row items-center mb-4">
                      <Ionicons name="trending-up" size={14} color="#8B0000" />
                      <Text className="text-xs font-bold text-[#8B0000] dark:text-red-400 ml-1.5">
                        Top {topPercentile}% percentile
                      </Text>
                    </View>

                    {/* Action Buttons Row */}
                    <View className="flex-row gap-2.5">
                      {/* View Details Button */}
                      <TouchableOpacity
                        onPress={() => handleOpenDetails(item)}
                        className="flex-1 bg-red-50/80 dark:bg-red-950/40 border border-red-200/60 dark:border-red-900/60 py-2.5 rounded-xl flex-row items-center justify-center"
                      >
                        <Ionicons name="bar-chart-outline" size={14} color="#8B0000" />
                        <Text className="text-xs font-bold text-[#8B0000] dark:text-red-400 ml-1.5">
                          View Details
                        </Text>
                      </TouchableOpacity>

                      {/* Review Button */}
                      <TouchableOpacity
                        onPress={() => handleOpenAnswers(item)}
                        className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-2.5 rounded-xl flex-row items-center justify-center"
                      >
                        <Ionicons name="help-circle-outline" size={14} color="#475569" />
                        <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1.5">
                          Review
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </Animated.View>
                );
              })
            ) : (
              /* Clean Empty State (Zero Dummy Data) */
              <View className="py-16 px-6 items-center justify-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl">
                <View className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/60 items-center justify-center mb-3">
                  <Ionicons name="document-text-outline" size={28} color="#8B0000" />
                </View>
                <Text className="text-base font-bold text-slate-900 dark:text-white text-center">
                  No Assessment Results Yet
                </Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400 text-center mt-1 mb-4 leading-5">
                  Complete mock tests or company assessment rounds to view your scorecards, rankings, and section mastery here.
                </Text>
                <TouchableOpacity
                  onPress={handleRefresh}
                  className="bg-[#8B0000] px-5 py-2.5 rounded-xl flex-row items-center"
                >
                  <Ionicons name="refresh" size={14} color="#FFFFFF" />
                  <Text className="text-xs font-bold text-white ml-1.5">Check for Updates</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Faculty Admin Tab */}
        {activeTab === "admin" && isFacultyOrAdmin && (
          <View>
            <View className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 mb-4">
              <Text className="text-xs font-bold text-[#8B0000] dark:text-red-400 uppercase tracking-wider mb-1">
                Faculty Result Actions
              </Text>
              <Text className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Execute compute routines or publish results to student apps.
              </Text>

              {/* Compute Result Block */}
              <View className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl mb-4 border border-slate-200/60 dark:border-slate-800">
                <Text className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  1. Compute Attempt Result (POST /results/compute/:attemptId)
                </Text>
                <TextInput
                  value={attemptIdInput}
                  onChangeText={setAttemptIdInput}
                  placeholder="Enter Attempt ID"
                  placeholderTextColor="#94A3B8"
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-3 py-2 rounded-lg text-xs text-slate-900 dark:text-white mb-2"
                />
                <TouchableOpacity
                  disabled={isComputing}
                  onPress={handleComputeResult}
                  className="bg-[#8B0000] py-2 rounded-lg items-center justify-center"
                >
                  {isComputing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text className="text-xs font-bold text-white">Compute Result</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Publish Result Block */}
              <View className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <Text className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  2. Publish Scorecard (POST /results/:id/publish)
                </Text>
                <TextInput
                  value={resultIdInput}
                  onChangeText={setResultIdInput}
                  placeholder="Enter Result ID"
                  placeholderTextColor="#94A3B8"
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-3 py-2 rounded-lg text-xs text-slate-900 dark:text-white mb-2"
                />
                <TouchableOpacity
                  disabled={isPublishing}
                  onPress={handlePublishResult}
                  className="bg-slate-900 dark:bg-slate-800 py-2 rounded-lg items-center justify-center border border-slate-700"
                >
                  {isPublishing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text className="text-xs font-bold text-white">Publish Scorecard</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Detail Modal: Section Analysis & Strong/Weak Areas */}
      <Modal
        visible={selectedResult !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedResult(null)}
      >
        <View className="flex-1 bg-[#F8FAFC] dark:bg-slate-950">
          <View
            style={{ paddingTop: Math.max(topInset + 8, 16) }}
            className="px-5 pb-3 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex-row items-center justify-between"
          >
            <View className="flex-1 mr-2">
              <Text className="text-[10px] font-extrabold text-[#8B0000] dark:text-red-400 uppercase tracking-wider">
                SCORECARD BREAKDOWN
              </Text>
              <Text className="text-lg font-black text-slate-900 dark:text-white" numberOfLines={1}>
                {selectedResult?.assessment?.name || "Result Details"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setSelectedResult(null)}
              className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center"
            >
              <Ionicons name="close" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            {/* Overview Card */}
            <View className="bg-slate-900 rounded-2xl p-5 mb-4 items-center">
              <Text className="text-xs font-bold text-red-400 uppercase tracking-widest">
                Obtained Score
              </Text>
              <Text className="text-4xl font-black text-white mt-1">
                {selectedResult?.obtainedMarks ?? 0}
                <Text className="text-xl text-slate-400">
                  {" "}/ {selectedResult?.totalMarks ?? 0}
                </Text>
              </Text>
              <View className="flex-row items-center gap-3 mt-3">
                <View className="bg-white/10 px-3 py-1 rounded-full">
                  <Text className="text-xs font-bold text-emerald-400">
                    Accuracy: {selectedResult?.accuracy ? `${selectedResult.accuracy.toFixed(1)}%` : "N/A"}
                  </Text>
                </View>
                <View className="bg-white/10 px-3 py-1 rounded-full">
                  <Text className="text-xs font-bold text-purple-300">
                    Rank: #{selectedResult?.rank || 1}
                  </Text>
                </View>
              </View>
            </View>

            {/* Section Analysis List */}
            {selectedResult?.sectionAnalysis && selectedResult.sectionAnalysis.length > 0 && (
              <View className="mb-4">
                <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Section Analysis
                </Text>
                {selectedResult.sectionAnalysis.map((sec, idx) => (
                  <View
                    key={sec._id || idx}
                    className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3.5 mb-2.5 shadow-xs"
                  >
                    <View className="flex-row justify-between items-center mb-1.5">
                      <Text className="text-xs font-bold text-slate-900 dark:text-white flex-1 mr-2">
                        {sec.sectionName || `Section ${idx + 1}`}
                      </Text>
                      <Text className="text-xs font-bold text-emerald-600">
                        {Number(sec.accuracy ?? sec.percentage ?? 0).toFixed(1)}% Accuracy
                      </Text>
                    </View>
                    <View className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-1.5">
                      <View
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${Math.min(sec.accuracy ?? sec.percentage ?? 100, 100)}%` }}
                      />
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-[10px] text-slate-400">
                        Marks: {sec.marksObtained ?? 0} / {sec.totalMarks ?? 0}
                      </Text>
                      <Text className="text-[10px] text-slate-400">
                        {sec.correct ?? 0} correct · {sec.wrong ?? 0} wrong
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Strong Areas */}
            {selectedResult?.strongAreas && selectedResult.strongAreas.length > 0 && (
              <View className="mb-4">
                <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Strong Areas
                </Text>
                <View className="flex-row flex-wrap gap-1.5">
                  {selectedResult.strongAreas.map((area, idx) => (
                    <View
                      key={idx}
                      className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-lg"
                    >
                      <Text className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                        ✓ {area}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Weak Areas */}
            {selectedResult?.weakAreas && selectedResult.weakAreas.length > 0 && (
              <View className="mb-4">
                <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Areas for Improvement
                </Text>
                <View className="flex-row flex-wrap gap-1.5">
                  {selectedResult.weakAreas.map((area, idx) => (
                    <View
                      key={idx}
                      className="bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 px-3 py-1.5 rounded-lg"
                    >
                      <Text className="text-xs font-semibold text-rose-700 dark:text-rose-300">
                        ! {area}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Answers Review Modal */}
      <Modal
        visible={activeAnswersModal !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setActiveAnswersModal(null)}
      >
        <View className="flex-1 bg-[#F8FAFC] dark:bg-slate-950">
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
                          {isCorrect ? "Correct" : "Incorrect"}
                        </Text>
                      </View>
                    </View>

                    <Text className="text-sm font-bold text-slate-900 dark:text-white mb-2 leading-5">
                      {q?.title || q?.questionText || "Question Title"}
                    </Text>

                    {/* Options */}
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
                  Question-by-question review is not available for this assessment.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
