import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle
} from "react-native";

import { theme } from "@/src/constants/theme";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "light";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends Omit<PressableProps, "style"> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  left?: ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function Button({
  title,
  variant = "primary",
  size = "md",
  loading = false,
  left,
  style,
  textStyle,
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      {...props}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        styles[size],
        pressed && !isDisabled ? styles.pressed : null,
        isDisabled ? styles.disabled : null,
        style
      ]}
    >
      {loading ? <ActivityIndicator color={variant === "light" ? theme.colors.red : theme.colors.white} /> : left}
      <Text style={[styles.label, styles[`${variant}Text`], styles[`${size}Text`], textStyle]}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: theme.radius.md,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center"
  },
  primary: {
    backgroundColor: theme.colors.red
  },
  secondary: {
    backgroundColor: theme.colors.elevated,
    borderColor: theme.colors.border,
    borderWidth: 1
  },
  danger: {
    backgroundColor: theme.colors.redDark
  },
  ghost: {
    backgroundColor: "transparent",
    borderColor: theme.colors.border,
    borderWidth: 1
  },
  light: {
    backgroundColor: theme.colors.white
  },
  sm: {
    minHeight: 38,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  md: {
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  lg: {
    minHeight: 58,
    paddingHorizontal: 18,
    paddingVertical: 15
  },
  label: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0,
    textAlign: "center"
  },
  primaryText: {
    color: theme.colors.white
  },
  secondaryText: {
    color: theme.colors.text
  },
  dangerText: {
    color: theme.colors.white
  },
  ghostText: {
    color: theme.colors.text
  },
  lightText: {
    color: theme.colors.red
  },
  smText: {
    fontSize: 13
  },
  mdText: {
    fontSize: 15
  },
  lgText: {
    fontSize: 17
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }]
  },
  disabled: {
    opacity: 0.55
  }
});
