export const genderThemes = {
  male: {
    primary: "#0A84FF",
    accent: "#FF4D4D",
    glow: "rgba(10,132,255,0.3)",
    gradient: "from-[#0A84FF] to-[#FF4D4D]",
    heroBg: "linear-gradient(135deg, #020B22 0%, #0A1628 50%, #1A0A22 100%)",
    cardBg: "rgba(10,132,255,0.08)",
    border: "rgba(10,132,255,0.2)",
  },
  female: {
    primary: "#10B981",
    accent: "#000000",
    glow: "rgba(16,185,129,0.3)",
    gradient: "from-[#10B981] to-[#000000]",
    heroBg: "linear-gradient(135deg, #020B22 0%, #0A1A12 50%, #000000 100%)",
    cardBg: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.2)",
  },
  other: {
    primary: "#7C3AED",
    accent: "#C89B3C",
    glow: "rgba(124,58,237,0.3)",
    gradient: "from-[#7C3AED] to-[#C89B3C]",
    heroBg: "linear-gradient(135deg, #020B22 0%, #140A28 50%, #1A180A 100%)",
    cardBg: "rgba(124,58,237,0.08)",
    border: "rgba(124,58,237,0.2)",
  },
} as const

export type Gender = keyof typeof genderThemes
