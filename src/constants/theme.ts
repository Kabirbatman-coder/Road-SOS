import { Platform } from "react-native";

export const theme = {
  colors: {
    background: "#07080A",
    surface: "#101216",
    elevated: "#171A20",
    card: "#FFFFFF",
    cardMuted: "#F4F5F7",
    text: "#F8FAFC",
    textMuted: "#A6ADBA",
    textDark: "#15171A",
    textDarkMuted: "#667085",
    border: "#2A2F38",
    borderLight: "#E5E7EB",
    red: "#E11D2E",
    redDark: "#991B1B",
    redSoft: "#FDE8EA",
    amber: "#F59E0B",
    amberSoft: "#FEF3C7",
    green: "#16A34A",
    greenSoft: "#DCFCE7",
    blue: "#2563EB",
    blueSoft: "#DBEAFE",
    black: "#000000",
    white: "#FFFFFF"
  },
  spacing: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 24,
    xl: 32
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 18,
    xl: 24
  }
};

export const shadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 22
  },
  android: {
    elevation: 5
  },
  default: {}
});
