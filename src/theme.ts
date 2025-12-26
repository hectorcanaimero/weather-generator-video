const palette = {
  black: "#000000",
  white: "#FFFFFF",
  // Creem.io inspired Dark Palette
  creemBlack: "#050505", // Ultra dark background
  creemDark: "#0A0A0A", // Main background
  creemSurface: "#121212", // Cards/Modals
  creemSurfaceHighlight: "#1E1E1E", // Hover/Active states
  creemBorder: "#2A2A2A", // Subtle borders

  // Accents
  creemPeach: "#FFB088", // Primary Accent
  creemPeachDim: "rgba(255, 176, 136, 0.2)",
  creemBlue: "#88CCFF", // Secondary Accent (if needed for charts)
  creemPurple: "#D488FF", // Tertiary Accent

  // Text
  textPrimary: "#FFFFFF",
  textSecondary: "#A1A1AA",
  textTertiary: "#52525B",

  // Functional
  success: "#34D399",
  warning: "#FBBF24",
  error: "#F87171",
  info: "#60A5FA",
};

export const Colors = {
  ...palette,
  text: palette.textPrimary,
  textSecondary: palette.textSecondary,
  background: palette.creemDark,
  surface: palette.creemSurface,
  surfaceHighlight: palette.creemSurfaceHighlight,
  tint: palette.creemPeach,
  border: palette.creemBorder,
  accent: palette.creemPeach,
  accentDim: palette.creemPeachDim,
};

export default Colors;
