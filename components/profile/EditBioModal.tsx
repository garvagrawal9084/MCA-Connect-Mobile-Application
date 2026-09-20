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

interface EditBioModalProps {
  visible: boolean;
  onClose: () => void;
  currentBio?: string;
  currentLocation?: string;
  onSave: (data: { bio: string; location?: string }) => Promise<boolean>;
}

export function EditBioModal({
  visible,
  onClose,
  currentBio = "",
  currentLocation = "",
  onSave,
}: EditBioModalProps) {
  const [bio, setBio] = useState(currentBio);
  const [location, setLocation] = useState(currentLocation);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setBio(currentBio);
      setLocation(currentLocation);
    }
  }, [visible, currentBio, currentLocation]);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const success = await onSave({
        bio: bio.trim(),
        location: location.trim(),
      });
      if (success) {
        onClose();
      }
    } catch {
      Alert.alert("Error", "Failed to update bio. Please try again.");
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
                Edit About & Bio
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
            <Input
              label="Bio / About Yourself"
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself, your interests, goals..."
              multiline
              numberOfLines={4}
              inputClassName="min-h-[90px] text-left pt-2 leading-5"
              helperText="Share a brief overview of your academic and career interests."
            />

            <Input
              label="Current Location / City"
              value={location}
              onChangeText={setLocation}
              placeholder="e.g. Hyderabad, Telangana"
              leftIcon={<Ionicons name="location-outline" size={18} color="#64748B" />}
              helperText="Your current residing city or campus location."
            />

            <View className="mt-4 gap-2.5">
              <Button
                title="Save Changes"
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

export default EditBioModal;
