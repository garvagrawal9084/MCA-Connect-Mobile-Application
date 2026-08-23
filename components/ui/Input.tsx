import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export interface InputProps extends Omit<TextInputProps, "secureTextEntry"> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
  containerClassName?: string;
  inputClassName?: string;
  labelClassName?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  isPassword = false,
  containerClassName = "",
  inputClassName = "",
  labelClassName = "",
  onFocus,
  onBlur,
  editable = true,
  ...restProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const hasError = Boolean(error);

  const getBorderColorClass = () => {
    if (hasError) return "border-red-500 bg-red-50/30 dark:bg-red-950/20";
    if (isFocused) return "border-2 border-indigo-600 dark:border-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/30";
    return "border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90";
  };

  return (
    <View className={`w-full mb-4 ${containerClassName}`}>
      {label && (
        <Text
          className={`text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 ${labelClassName}`}
        >
          {label}
        </Text>
      )}

      <View
        className={`flex-row items-center w-full px-3.5 py-2.5 rounded-xl ${getBorderColorClass()} ${
          !editable ? "opacity-60 bg-slate-100 dark:bg-slate-900" : ""
        }`}
      >
        {leftIcon && <View className="mr-2.5">{leftIcon}</View>}

        <TextInput
          className={`flex-1 text-base text-slate-900 dark:text-slate-100 p-0 ${inputClassName}`}
          placeholderTextColor="#94A3B8"
          secureTextEntry={isPassword ? !showPassword : false}
          editable={editable}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...restProps}
        />

        {isPassword ? (
          <TouchableOpacity
            onPress={() => setShowPassword((prev) => !prev)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="p-1"
            accessibilityLabel={showPassword ? "Hide password" : "Show password"}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={hasError ? "#EF4444" : isFocused ? "#4F46E5" : "#64748B"}
            />
          </TouchableOpacity>
        ) : (
          rightIcon && <View className="ml-2">{rightIcon}</View>
        )}
      </View>

      {hasError ? (
        <View className="flex-row items-center mt-1.5 ml-1">
          <Ionicons name="alert-circle" size={14} color="#EF4444" />
          <Text className="text-xs font-medium text-red-500 ml-1">
            {error}
          </Text>
        </View>
      ) : helperText ? (
        <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 ml-1">
          {helperText}
        </Text>
      ) : null}
    </View>
  );
};

export default Input;
