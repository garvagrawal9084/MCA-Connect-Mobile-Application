import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { UpdateEducationRequest } from "@/features/profile/types";
import { EducationDetails } from "@/features/auth/types";

interface EditEducationModalProps {
  visible: boolean;
  onClose: () => void;
  currentEducation?: EducationDetails;
  onSave: (data: UpdateEducationRequest) => Promise<boolean>;
}

export function EditEducationModal({
  visible,
  onClose,
  currentEducation,
  onSave,
}: EditEducationModalProps) {
  // Post Graduation
  const [pgDegree, setPgDegree] = useState(
    currentEducation?.postGraduation?.degree || ""
  );
  const [pgCollege, setPgCollege] = useState(
    currentEducation?.postGraduation?.collegeName || ""
  );
  const [pgCgpa, setPgCgpa] = useState(
    currentEducation?.postGraduation?.cgpa !== undefined
      ? String(currentEducation.postGraduation.cgpa)
      : ""
  );

  // Graduation
  const [ugDegree, setUgDegree] = useState(
    currentEducation?.graduation?.degree || ""
  );
  const [ugCollege, setUgCollege] = useState(
    currentEducation?.graduation?.collegeName || ""
  );
  const [ugCgpa, setUgCgpa] = useState(
    currentEducation?.graduation?.cgpa !== undefined
      ? String(currentEducation.graduation.cgpa)
      : ""
  );
  const [ugYear, setUgYear] = useState(
    currentEducation?.graduation?.passingYear !== undefined
      ? String(currentEducation.graduation.passingYear)
      : ""
  );

  // 12th
  const [twelfthSchool, setTwelfthSchool] = useState(
    currentEducation?.twelfth?.schoolName || ""
  );
  const [twelfthPercentage, setTwelfthPercentage] = useState(
    currentEducation?.twelfth?.percentage !== undefined
      ? String(currentEducation.twelfth.percentage)
      : ""
  );
  const [twelfthYear, setTwelfthYear] = useState(
    currentEducation?.twelfth?.passingYear !== undefined
      ? String(currentEducation.twelfth.passingYear)
      : ""
  );

  // 10th
  const [tenthSchool, setTenthSchool] = useState(
    currentEducation?.tenth?.schoolName || ""
  );
  const [tenthPercentage, setTenthPercentage] = useState(
    currentEducation?.tenth?.percentage !== undefined
      ? String(currentEducation.tenth.percentage)
      : ""
  );
  const [tenthYear, setTenthYear] = useState(
    currentEducation?.tenth?.passingYear !== undefined
      ? String(currentEducation.tenth.passingYear)
      : ""
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setPgDegree(currentEducation?.postGraduation?.degree || "");
      setPgCollege(currentEducation?.postGraduation?.collegeName || "");
      setPgCgpa(
        currentEducation?.postGraduation?.cgpa !== undefined
          ? String(currentEducation.postGraduation.cgpa)
          : ""
      );

      setUgDegree(currentEducation?.graduation?.degree || "");
      setUgCollege(currentEducation?.graduation?.collegeName || "");
      setUgCgpa(
        currentEducation?.graduation?.cgpa !== undefined
          ? String(currentEducation.graduation.cgpa)
          : ""
      );
      setUgYear(
        currentEducation?.graduation?.passingYear !== undefined
          ? String(currentEducation.graduation.passingYear)
          : ""
      );

      setTwelfthSchool(currentEducation?.twelfth?.schoolName || "");
      setTwelfthPercentage(
        currentEducation?.twelfth?.percentage !== undefined
          ? String(currentEducation.twelfth.percentage)
          : ""
      );
      setTwelfthYear(
        currentEducation?.twelfth?.passingYear !== undefined
          ? String(currentEducation.twelfth.passingYear)
          : ""
      );

      setTenthSchool(currentEducation?.tenth?.schoolName || "");
      setTenthPercentage(
        currentEducation?.tenth?.percentage !== undefined
          ? String(currentEducation.tenth.percentage)
          : ""
      );
      setTenthYear(
        currentEducation?.tenth?.passingYear !== undefined
          ? String(currentEducation.tenth.passingYear)
          : ""
      );
    }
  }, [visible, currentEducation]);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const payload: UpdateEducationRequest = {
        postGraduation: {
          ...currentEducation?.postGraduation,
          degree: pgDegree.trim(),
          collegeName: pgCollege.trim(),
          cgpa: pgCgpa ? Number(pgCgpa) : undefined,
        },
        graduation: {
          ...currentEducation?.graduation,
          degree: ugDegree.trim(),
          collegeName: ugCollege.trim(),
          cgpa: ugCgpa ? Number(ugCgpa) : undefined,
          passingYear: ugYear ? Number(ugYear) : undefined,
        },
        twelfth: {
          ...currentEducation?.twelfth,
          schoolName: twelfthSchool.trim(),
          percentage: twelfthPercentage ? Number(twelfthPercentage) : undefined,
          passingYear: twelfthYear ? Number(twelfthYear) : undefined,
        },
        tenth: {
          ...currentEducation?.tenth,
          schoolName: tenthSchool.trim(),
          percentage: tenthPercentage ? Number(tenthPercentage) : undefined,
          passingYear: tenthYear ? Number(tenthYear) : undefined,
        },
      };

      const success = await onSave(payload);
      if (success) {
        onClose();
      }
    } catch {
      Alert.alert("Error", "Failed to update education details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-end bg-black/60"
      >
        <View className="bg-white dark:bg-slate-900 rounded-t-[32px] max-h-[90%] p-6 pb-9 shadow-2xl border-t border-slate-200/80 dark:border-slate-800">
          {/* Top Drag Indicator */}
          <View className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full self-center mb-4" />

          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-[11px] font-black text-red-800 dark:text-red-400 tracking-wider uppercase">
                SCIS CONNECT
              </Text>
              <Text className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Edit Academic Background
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center"
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Post Graduation Section */}
            <Text className="text-xs font-black text-red-800 dark:text-red-400 uppercase tracking-wider mb-2 mt-1">
              1. Post Graduation (Current)
            </Text>
            <Input
              label="Degree / Course"
              value={pgDegree}
              onChangeText={setPgDegree}
              placeholder="e.g. Master of Computer Applications (MCA)"
            />
            <Input
              label="College / Institution"
              value={pgCollege}
              onChangeText={setPgCollege}
              placeholder="e.g. School of Computer and Information Sciences"
            />
            <Input
              label="Current CGPA"
              value={pgCgpa}
              onChangeText={setPgCgpa}
              placeholder="e.g. 8.75"
              keyboardType="decimal-pad"
            />

            {/* Graduation Section */}
            <Text className="text-xs font-black text-red-800 dark:text-red-400 uppercase tracking-wider mb-2 mt-3">
              2. Under Graduation
            </Text>
            <Input
              label="Degree / Course"
              value={ugDegree}
              onChangeText={setUgDegree}
              placeholder="e.g. Bachelor of Computer Applications (BCA)"
            />
            <Input
              label="College / University"
              value={ugCollege}
              onChangeText={setUgCollege}
              placeholder="e.g. Delhi University"
            />
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Input
                  label="CGPA"
                  value={ugCgpa}
                  onChangeText={setUgCgpa}
                  placeholder="e.g. 8.2"
                  keyboardType="decimal-pad"
                />
              </View>
              <View className="flex-1">
                <Input
                  label="Passing Year"
                  value={ugYear}
                  onChangeText={setUgYear}
                  placeholder="e.g. 2024"
                  keyboardType="number-pad"
                />
              </View>
            </View>

            {/* 12th Section */}
            <Text className="text-xs font-black text-red-800 dark:text-red-400 uppercase tracking-wider mb-2 mt-3">
              3. Higher Secondary (12th Grade)
            </Text>
            <Input
              label="School Name"
              value={twelfthSchool}
              onChangeText={setTwelfthSchool}
              placeholder="e.g. Delhi Public School"
            />
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Input
                  label="Percentage (%)"
                  value={twelfthPercentage}
                  onChangeText={setTwelfthPercentage}
                  placeholder="e.g. 89.4"
                  keyboardType="decimal-pad"
                />
              </View>
              <View className="flex-1">
                <Input
                  label="Passing Year"
                  value={twelfthYear}
                  onChangeText={setTwelfthYear}
                  placeholder="e.g. 2021"
                  keyboardType="number-pad"
                />
              </View>
            </View>

            {/* 10th Section */}
            <Text className="text-xs font-black text-red-800 dark:text-red-400 uppercase tracking-wider mb-2 mt-3">
              4. High School (10th Grade)
            </Text>
            <Input
              label="School Name"
              value={tenthSchool}
              onChangeText={setTenthSchool}
              placeholder="e.g. St. Xavier High School"
            />
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Input
                  label="Percentage (%)"
                  value={tenthPercentage}
                  onChangeText={setTenthPercentage}
                  placeholder="e.g. 91.2"
                  keyboardType="decimal-pad"
                />
              </View>
              <View className="flex-1">
                <Input
                  label="Passing Year"
                  value={tenthYear}
                  onChangeText={setTenthYear}
                  placeholder="e.g. 2019"
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <View className="mt-4 gap-2.5">
              <Button
                title="Save Academic Background"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  handleSave();
                }}
                isLoading={isSubmitting}
                leftIcon={<Ionicons name="checkmark-outline" size={18} color="#FFFFFF" />}
              />
              <Button
                title="Cancel"
                variant="ghost"
                onPress={onClose}
                disabled={isSubmitting}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default EditEducationModal;
