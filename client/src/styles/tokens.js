export const COLORS = {
  soil: "#3E2723",          // Rich dark fertile soil brown
  soilLight: "#5D4037",     // Lighter soil brown
  turmeric: "#D4AC0D",      // Golden ripe crops/wheat
  turmericLight: "#FCF3CF", // Soft gold/yellow
  rice: "#2E7D32",          // Healthy green crops/sprouts
  riceLight: "#E8F5E9",     // Fresh mint/sprout green
  clay: "#C0392B",          // Alert/distress red clay
  clayLight: "#FDEDEC",     // Soft pinkish alert
  parchment: "#F1F8F3",     // Soft, premium pale sage/mint green background
  parchmentDeep: "#E1ECE5", // Deeper sage/mint green
  ink: "#1A251E",           // Very dark green-black for primary typography
  inkMuted: "#506356",      // Muted forest gray-green for descriptions
  cream: "#FAFDFB"          // Clean crop-white for cards/containers
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
