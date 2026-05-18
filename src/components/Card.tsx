import type { ReactNode } from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { shadow, theme } from "@/src/constants/theme";

interface CardProps {
  title?: string;
  eyebrow?: string;
  children: ReactNode;
  tone?: "dark" | "light";
  style?: StyleProp<ViewStyle>;
}

export function Card({ title, eyebrow, children, tone = "dark", style }: CardProps) {
  const isLight = tone === "light";

  return (
    <View style={[styles.card, isLight ? styles.light : styles.dark, style]}>
      {eyebrow ? <Text style={[styles.eyebrow, isLight ? styles.lightMuted : styles.darkMuted]}>{eyebrow}</Text> : null}
      {title ? <Text style={[styles.title, isLight ? styles.lightTitle : styles.darkTitle]}>{title}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    ...shadow
  },
  dark: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1
  },
  light: {
    backgroundColor: theme.colors.white
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.7,
    marginBottom: 6,
    textTransform: "uppercase"
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0,
    marginBottom: 12
  },
  darkTitle: {
    color: theme.colors.text
  },
  lightTitle: {
    color: theme.colors.textDark
  },
  darkMuted: {
    color: theme.colors.textMuted
  },
  lightMuted: {
    color: theme.colors.textDarkMuted
  }
});
