import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  TouchableOpacityProps,
} from "react-native";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
  textClassName?: string;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  className = "",
  textClassName = "",
  fullWidth = true,
  activeOpacity = 0.8,
  ...restProps
}) => {
  const isDisabled = disabled || isLoading;

  // Base container styles
  const getContainerStyle = () => {
    let base = "flex-row items-center justify-center rounded-xl";

    // Size
    switch (size) {
      case "sm":
        base += " px-3.5 py-2";
        break;
      case "lg":
        base += " px-6 py-4";
        break;
      case "md":
      default:
        base += " px-5 py-3.5";
        break;
    }

    // Width
    if (fullWidth) base += " w-full";

    // Variant
    switch (variant) {
      case "secondary":
        base += " bg-sky-500 active:bg-sky-600 dark:bg-sky-600";
        break;
      case "outline":
        base += " bg-transparent border border-indigo-600 dark:border-indigo-400 active:bg-indigo-50 dark:active:bg-indigo-950/30";
        break;
      case "ghost":
        base += " bg-transparent active:bg-slate-100 dark:active:bg-slate-800";
        break;
      case "primary":
      default:
        base += " bg-indigo-600 active:bg-indigo-700 shadow-md shadow-indigo-600";
        break;
    }

    if (isDisabled) {
      base += " opacity-60";
    }

    return base;
  };

  // Text styles
  const getTextStyle = () => {
    let base = "font-bold text-center tracking-wide";

    // Size
    switch (size) {
      case "sm":
        base += " text-xs";
        break;
      case "lg":
        base += " text-lg";
        break;
      case "md":
      default:
        base += " text-base";
        break;
    }

    // Variant
    switch (variant) {
      case "outline":
        base += " text-indigo-600 dark:text-indigo-400";
        break;
      case "ghost":
        base += " text-slate-700 dark:text-slate-300";
        break;
      case "secondary":
      case "primary":
      default:
        base += " text-white";
        break;
    }

    return base;
  };

  const getSpinnerColor = () => {
    switch (variant) {
      case "outline":
      case "ghost":
        return "#4F46E5";
      default:
        return "#FFFFFF";
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={activeOpacity}
      className={`${getContainerStyle()} ${className}`}
      {...restProps}
    >
      {isLoading ? (
        <View className="flex-row items-center justify-center py-0.5">
          <ActivityIndicator size="small" color={getSpinnerColor()} />
          <Text className={`${getTextStyle()} ml-2 ${textClassName}`}>
            Please wait...
          </Text>
        </View>
      ) : (
        <View className="flex-row items-center justify-center">
          {leftIcon && <View className="mr-2">{leftIcon}</View>}
          <Text className={`${getTextStyle()} ${textClassName}`}>{title}</Text>
          {rightIcon && <View className="ml-2">{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

export default Button;
