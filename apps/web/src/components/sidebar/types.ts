import type { LucideIcon } from "lucide-react"

export type MenuItem = {
  id: string
  title: string
  url: string
  icon?: LucideIcon
  isActive?: boolean
  items?: MenuItem[]
}
