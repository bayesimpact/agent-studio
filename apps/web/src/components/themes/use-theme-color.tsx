import { useTheme } from "next-themes"

export function useThemeColor() {
  const { theme } = useTheme()
  return theme === "coral" ? "#f18c6e" : "#7ABECC"
}
