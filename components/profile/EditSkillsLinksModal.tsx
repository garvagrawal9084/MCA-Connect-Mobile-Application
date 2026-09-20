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
import { UpdateProfessionalRequest } from "@/features/profile/types";

interface EditSkillsLinksModalProps {
  visible: boolean;
  onClose: () => void;
  currentSkills?: string[];
  currentGithub?: string;
  currentLinkedin?: string;
  currentLeetcode?: string;
  currentGfg?: string;
  currentCodeforces?: string;
  onSave: (data: UpdateProfessionalRequest) => Promise<boolean>;
}

export function EditSkillsLinksModal({
  visible,
  onClose,
  currentSkills = [],
  currentGithub = "",
  currentLinkedin = "",
  currentLeetcode = "",
  currentGfg = "",
  currentCodeforces = "",
  onSave,
}: EditSkillsLinksModalProps) {
  const [skillsText, setSkillsText] = useState("");
  const [github, setGithub] = useState(currentGithub);
  const [linkedin, setLinkedin] = useState(currentLinkedin);
  const [leetcodeUsername, setLeetcodeUsername] = useState(currentLeetcode);
  const [gfg, setGfg] = useState(currentGfg);
  const [codeforces, setCodeforces] = useState(currentCodeforces);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setSkillsText(currentSkills.join(", "));
      setGithub(currentGithub || "");
      setLinkedin(currentLinkedin || "");
      setLeetcodeUsername(currentLeetcode || "");
      setGfg(currentGfg || "");
      setCodeforces(currentCodeforces || "");
    }
  }, [
    visible,
    currentSkills,
    currentGithub,
    currentLinkedin,
    currentLeetcode,
    currentGfg,
    currentCodeforces,
  ]);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const parsedSkills = skillsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload: UpdateProfessionalRequest = {
        skills: parsedSkills,
        currentSkills: parsedSkills,
        github: github.trim(),
        linkedin: linkedin.trim(),
        leetcodeUsername: leetcodeUsername.trim(),
        gfg: gfg.trim(),
        codeforces: codeforces.trim(),
      };

      const success = await onSave(payload);
      if (success) {
        onClose();
      }
    } catch {
      Alert.alert("Error", "Failed to update skills and profile links.");
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
        <View className="bg-white dark:bg-slate-900 rounded-t-[32px] max-h-[85%] p-6 pb-9 shadow-2xl border-t border-slate-200/80 dark:border-slate-800">
          {/* Top Drag Indicator */}
          <View className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full self-center mb-4" />

          {/* Header */}
          <View className="flex-row items-center justify-between mb-5">
            <View>
              <Text className="text-[11px] font-black text-red-800 dark:text-red-400 tracking-wider uppercase">
                SCIS CONNECT
              </Text>
              <Text className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Edit Skills & Handles
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
            {/* Skills */}
            <Input
              label="Technical Skills (comma separated)"
              value={skillsText}
              onChangeText={setSkillsText}
              placeholder="e.g. React Native, TypeScript, Node.js, Python, Docker"
              multiline
              numberOfLines={2}
              leftIcon={<Ionicons name="code-slash-outline" size={18} color="#8B0000" />}
              helperText="Separate each skill or technology with a comma."
            />

            {/* GitHub */}
            <Input
              label="GitHub Profile URL / Handle"
              value={github}
              onChangeText={setGithub}
              placeholder="https://github.com/username or username"
              autoCapitalize="none"
              leftIcon={<Ionicons name="logo-github" size={18} color="#1E293B" />}
            />

            {/* LinkedIn */}
            <Input
              label="LinkedIn Profile URL"
              value={linkedin}
              onChangeText={setLinkedin}
              placeholder="https://linkedin.com/in/username"
              autoCapitalize="none"
              leftIcon={<Ionicons name="logo-linkedin" size={18} color="#0A66C2" />}
            />

            {/* LeetCode */}
            <Input
              label="LeetCode Username"
              value={leetcodeUsername}
              onChangeText={setLeetcodeUsername}
              placeholder="e.g. leetcode_user"
              autoCapitalize="none"
              leftIcon={<Ionicons name="code-working-outline" size={18} color="#F59E0B" />}
              helperText="Used to sync problem counts and contest ratings."
            />

            {/* GeeksforGeeks */}
            <Input
              label="GeeksforGeeks URL / Handle"
              value={gfg}
              onChangeText={setGfg}
              placeholder="https://auth.geeksforgeeks.org/user/username"
              autoCapitalize="none"
              leftIcon={<Ionicons name="terminal-outline" size={18} color="#10B981" />}
            />

            {/* Codeforces */}
            <Input
              label="Codeforces Handle / URL"
              value={codeforces}
              onChangeText={setCodeforces}
              placeholder="https://codeforces.com/profile/username"
              autoCapitalize="none"
              leftIcon={<Ionicons name="trophy-outline" size={18} color="#EF4444" />}
            />

            <View className="mt-4 gap-2.5">
              <Button
                title="Save Skills & Profiles"
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

export default EditSkillsLinksModal;
