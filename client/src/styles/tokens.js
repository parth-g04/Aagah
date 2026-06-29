export const COLORS = {
  soil: "#5C4033",
  soilLight: "#8A6A52",
  turmeric: "#D98E2F",
  turmericLight: "#F0C988",
  rice: "#3D7A4D",
  riceLight: "#DCEADD",
  clay: "#A8472E",
  clayLight: "#F0DAD3",
  parchment: "#F3EDE0",
  parchmentDeep: "#EAE1CC",
  ink: "#2B2620",
  inkMuted: "#6B6253",
  cream: "#FBF8F1"
};

export const FONTS = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace"
};

export const stressColor = (stress) => {
  if (stress >= 75) return COLORS.clay;
  if (stress >= 45) return COLORS.turmeric;
  return COLORS.rice;
};

export const stressBg = (stress) => {
  if (stress >= 75) return COLORS.clayLight;
  if (stress >= 45) return COLORS.turmericLight;
  return COLORS.riceLight;
};

export const stressLabel = (stress) => {
  if (stress >= 75) return "High";
  if (stress >= 45) return "Moderate";
  return "Low";
};
