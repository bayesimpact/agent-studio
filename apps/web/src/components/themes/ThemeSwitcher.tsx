"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@caseai-connect/ui/shad/select"
import { useTheme } from "next-themes"
import { themes } from "./helpers"

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()

  return (
    <Select value={theme} onValueChange={setTheme}>
      <SelectTrigger className="w-fit justify-center text-primary">
        <SelectValue placeholder="Theme" />
      </SelectTrigger>
      <SelectContent align="start" side="right">
        {themes.map((t) => (
          <SelectItem key={t.value} value={t.value}>
            {t.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
