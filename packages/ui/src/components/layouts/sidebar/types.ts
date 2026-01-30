import type { LucideIcon } from "lucide-react"

export type MenuItem = {
  title: string
  url: string
  icon?: LucideIcon
  isActive?: boolean
  items?: MenuItem[]
}

export type User = {
  name: string
  email: string
  avatar?: string
}
