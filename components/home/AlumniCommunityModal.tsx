import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";

interface AlumniCommunityModalProps {
  visible: boolean;
  onClose: () => void;
}

const UPCOMING_FEATURES = [
  {
    title: "Verified Alumni Directory",
    description: "Search and connect with alumni across MCA, MCS, IMT, MAI, and PhD cohorts.",
    icon: "people-outline" as const,
    color: "#8B0000",
  },
  {
    title: "1-on-1 Mentorship & Referrals",
    description: "Request resume reviews, mock interviews, and internal job referrals from senior alumni.",
    icon: "briefcase-outline" as const,
    color: "#D97706",
  },
  {
    title: "Tech Talks & Community AMAs",
    description: "Participate in interactive industry sessions, webinars, and career workshops.",
    icon: "mic-outline" as const,
    color: "#2563EB",
  },
  {
    title: "City & Global Hubs",
    description: "Join regional SCIS alumni networks across major tech hubs worldwide.",
    icon: "globe-outline" as const,
    color: "#059669",
  },
];

export const AlumniCommunityModal: React.FC<AlumniCommunityModalProps> = ({
  visible,
  onClose,
}) => {
  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View className="flex-1 bg-black/60 justify-end sm:justify-center p-0 sm:p-4">
          <TouchableWithoutFeedback>
            <View className="bg-white dark:bg-slate-900 rounded-t-[32px] sm:rounded-[32px] p-6 max-h-[88%] border-t border-slate-200 dark:border-slate-800 shadow-2xl">
              {/* Top Handle / Drag indicator on mobile */}
              <View className="items-center mb-3">
                <View className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
              </View>

              {/* Modal Header */}
              <View className="flex-row items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-2xl bg-amber-500/15 dark:bg-amber-500/20 border border-amber-400/40 dark:border-amber-500/40 items-center justify-center mr-3">
                    <Ionicons name="construct" size={20} color="#D97706" />
                  </View>
                  <View>
                    <Text className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                      FEATURE IN DEVELOPMENT
                    </Text>
                    <Text className="text-xl font-black text-slate-900 dark:text-white">
                      Alumni Network
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleClose}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center"
                  accessibilityLabel="Close"
                >
                  <Ionicons name="close" size={18} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Under Construction Notice Banner */}
                <View className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 p-4 rounded-2xl mb-5">
                  <View className="flex-row items-center mb-1.5">
                    <View className="bg-amber-100 dark:bg-amber-900/80 px-2.5 py-0.5 rounded-full mr-2">
                      <Text className="text-[10px] font-extrabold text-amber-800 dark:text-amber-300 uppercase tracking-wide">
                        Under Construction
                      </Text>
                    </View>
                    <Text className="text-xs font-bold text-amber-900 dark:text-amber-200">
                      Coming Soon to SCIS Connect
                    </Text>
                  </View>
                  <Text className="text-xs text-slate-600 dark:text-slate-300 leading-5">
                    The SCIS Alumni Network platform is actively being developed. Soon, you will be able to search the verified alumni directory, request mentorship, and discover career opportunities across 2,500+ SCIS graduates.
                  </Text>
                </View>

                {/* What's Coming Section */}
                <Text className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                  What's in the works
                </Text>

                <View className="space-y-2.5 mb-5">
                  {UPCOMING_FEATURES.map((item) => (
                    <View
                      key={item.title}
                      className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60 p-3.5 rounded-2xl mb-2 flex-row items-center"
                    >
                      <View
                        className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                        style={{ backgroundColor: `${item.color}15` }}
                      >
                        <Ionicons
                          name={item.icon}
                          size={18}
                          color={item.color}
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-bold text-slate-900 dark:text-white">
                          {item.title}
                        </Text>
                        <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-4">
                          {item.description}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Info Note */}
                <View className="flex-row items-center justify-center bg-slate-100/70 dark:bg-slate-800/50 py-2.5 px-3 rounded-xl mb-4">
                  <Ionicons name="information-circle-outline" size={14} color="#64748B" />
                  <Text className="text-[11px] text-slate-500 dark:text-slate-400 font-medium ml-1.5 text-center">
                    Building in collaboration with the SCIS Alumni Association.
                  </Text>
                </View>

                {/* Action Button */}
                <TouchableOpacity
                  onPress={handleClose}
                  className="bg-red-800 active:bg-red-900 py-3.5 rounded-2xl items-center mb-2 shadow-md shadow-red-950/20"
                  activeOpacity={0.85}
                >
                  <Text className="text-white font-bold text-sm tracking-wide">
                    Got it, thanks!
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default AlumniCommunityModal;
