import React from "react";
import { View, ViewProps } from "react-native";

export interface CardProps extends ViewProps {
  variant?: "elevated" | "outlined" | "flat";
  className?: string;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = "elevated",
  className = "",
  ...restProps
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case "outlined":
        return "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800";
      case "flat":
        return "bg-slate-100 dark:bg-slate-800";
      case "elevated":
      default:
        return "bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md shadow-slate-200/50 dark:shadow-none";
    }
  };

  return (
    <View
      className={`rounded-3xl p-5 ${getVariantStyle()} ${className}`}
      {...restProps}
    >
      {children}
    </View>
  );
};

export default Card;
