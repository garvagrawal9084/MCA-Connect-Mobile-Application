import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

export type ProfileSection = "bio" | "contact" | "skills" | "education";

interface EditSectionPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectSection: (section: ProfileSection) => void;
}

interface SectionOption {
  id: ProfileSection;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  bgColor: string;
}

const SECTION_OPTIONS: SectionOption[] = [
  {
    id: "bio",
    title: "About & Bio",
    subtitle: "Personal bio, career objectives, campus location",
    icon: "finger-print-outline",
    iconColor: "#8B0000",
    bgColor: "bg-red-50 dark:bg-red-950/50",
  },
  {
    id: "contact",
    title: "Contact & Account Details",
    subtitle: "Mobile, alternate phone, WhatsApp, personal email",
    icon: "call-outline",
    iconColor: "#0284C7",
    bgColor: "bg-sky-50 dark:bg-sky-950/50",
  },
  {
    id: "skills",
    title: "Technical Skills & Profiles",
    subtitle: "Tech stack, GitHub, LinkedIn, LeetCode, GFG, Codeforces",
    icon: "code-slash-outline",
    iconColor: "#D97706",
    bgColor: "bg-amber-50 dark:bg-amber-950/50",
  },
  {
    id: "education",
    title: "Academic Background",
    subtitle: "Post-Grad, Under-Grad, 12th & 10th grade, CGPA",
    icon: "school-outline",
    iconColor: "#059669",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/50",
  },
];

export function EditSectionPickerModal({
  visible,
  onClose,
  onSelectSection,
}: EditSectionPickerModalProps) {
  const handleSelect = (section: ProfileSection) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    setTimeout(() => {
      onSelectSection(section);
    }, 200);
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
        <View className="bg-white dark:bg-slate-900 rounded-t-[32px] p-6 pb-9 shadow-2xl border-t border-slate-200/80 dark:border-slate-800">
          {/* Top Drag Indicator */}
          <View className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full self-center mb-4" />

          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-[11px] font-black text-red-800 dark:text-red-400 tracking-wider uppercase">
                SCIS CONNECT
              </Text>
              <Text className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Edit Profile Section
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

          <Text className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-4.5">
            Choose a section to update your student information. Changes will synchronize with your profile immediately.
          </Text>

          {/* Section Options */}
          <View className="gap-2.5 mb-5">
            {SECTION_OPTIONS.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => handleSelect(item.id)}
                activeOpacity={0.7}
                className="flex-row items-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80"
              >
                <View
                  className={`w-11 h-11 rounded-xl ${item.bgColor} items-center justify-center mr-3`}
                >
                  <Ionicons name={item.icon} size={20} color={item.iconColor} />
                </View>
                <View className="flex-1 min-w-0 mr-2">
                  <Text className="text-sm font-bold text-slate-900 dark:text-white" numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5" numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Cancel */}
          <TouchableOpacity
            onPress={onClose}
            className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-800 items-center justify-center"
            activeOpacity={0.7}
          >
            <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default EditSectionPickerModal;
