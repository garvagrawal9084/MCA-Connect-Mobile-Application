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
import { UpdateContactRequest } from "@/features/profile/types";
import { ContactInfo } from "@/features/auth/types";

interface EditContactModalProps {
  visible: boolean;
  onClose: () => void;
  currentContact?: ContactInfo;
  currentPersonalEmail?: string;
  onSave: (data: UpdateContactRequest) => Promise<boolean>;
}

export function EditContactModal({
  visible,
  onClose,
  currentContact,
  currentPersonalEmail = "",
  onSave,
}: EditContactModalProps) {
  const [mobile, setMobile] = useState(currentContact?.mobile || "");
  const [alternateMobile, setAlternateMobile] = useState(
    currentContact?.alternateMobile || ""
  );
  const [whatsappNumber, setWhatsappNumber] = useState(
    currentContact?.whatsappNumber || ""
  );
  const [personalEmail, setPersonalEmail] = useState(currentPersonalEmail);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setMobile(currentContact?.mobile || "");
      setAlternateMobile(currentContact?.alternateMobile || "");
      setWhatsappNumber(currentContact?.whatsappNumber || "");
      setPersonalEmail(currentPersonalEmail || "");
    }
  }, [visible, currentContact, currentPersonalEmail]);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const payload: UpdateContactRequest = {
        mobile: mobile.trim(),
        alternateMobile: alternateMobile.trim(),
        whatsappNumber: whatsappNumber.trim(),
        personalEmail: personalEmail.trim(),
      };
      const success = await onSave(payload);
      if (success) {
        onClose();
      }
    } catch {
      Alert.alert("Error", "Failed to update contact details.");
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
                Edit Contact Details
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
              label="Personal Email"
              value={personalEmail}
              onChangeText={setPersonalEmail}
              placeholder="e.g. yourname@gmail.com"
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Ionicons name="mail-outline" size={18} color="#64748B" />}
              helperText="Secondary email used for notifications and recovery."
            />

            <Input
              label="Primary Mobile Number"
              value={mobile}
              onChangeText={setMobile}
              placeholder="e.g. 9876543210"
              keyboardType="phone-pad"
              leftIcon={<Ionicons name="call-outline" size={18} color="#64748B" />}
              helperText="Primary phone number for SMS and placement contact."
            />

            <Input
              label="WhatsApp Number"
              value={whatsappNumber}
              onChangeText={setWhatsappNumber}
              placeholder="e.g. 9876543210"
              keyboardType="phone-pad"
              leftIcon={<Ionicons name="logo-whatsapp" size={18} color="#10B981" />}
              helperText="Active WhatsApp number for placement updates."
            />

            <Input
              label="Alternate Mobile Number"
              value={alternateMobile}
              onChangeText={setAlternateMobile}
              placeholder="Optional alternate number"
              keyboardType="phone-pad"
              leftIcon={<Ionicons name="phone-portrait-outline" size={18} color="#64748B" />}
            />

            <View className="mt-4 gap-2.5">
              <Button
                title="Save Contact Details"
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

export default EditContactModal;
