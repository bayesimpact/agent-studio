export const themes = [
  // { value: "default", label: "Default" }, // black
  { value: "coral", label: "Coral" },
  { value: "blue", label: "Blue" },
] as const

export const defaultTheme = (import.meta.env.VITE_THEME_KEY as string | undefined) || "coral"
