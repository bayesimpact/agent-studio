import { createContext, type Dispatch, useContext } from "react"

interface SidebarLayoutContextValue {
  headerTitle: string
  setHeaderTitle: (name: string) => void
  headerRightSlot: React.ReactNode
  setHeaderRightSlot: Dispatch<React.SetStateAction<React.ReactNode>>
}

export const SidebarLayoutContext = createContext<SidebarLayoutContextValue | null>(null)

export function useSidebarLayout() {
  const context = useContext(SidebarLayoutContext)
  if (!context) {
    throw new Error("useSidebarLayout must be used within a SidebarLayoutProvider")
  }
  return context
}
