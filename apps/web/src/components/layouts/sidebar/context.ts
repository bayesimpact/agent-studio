import { createContext, type Dispatch, useContext } from "react"

interface SidebarLayoutContextValue {
  headerTitle: string
  setHeaderTitle: Dispatch<React.SetStateAction<string>>
}

export const SidebarLayoutContext = createContext<SidebarLayoutContextValue | null>(null)

export function useSidebarLayout() {
  const context = useContext(SidebarLayoutContext)
  if (!context) {
    throw new Error("useSidebarLayout must be used within a SidebarLayoutProvider")
  }
  return context
}
