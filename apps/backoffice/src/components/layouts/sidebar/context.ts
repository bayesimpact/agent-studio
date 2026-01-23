import { createContext, type Dispatch, useContext } from "react"

interface SidebarContextValue {
  headerTitle: string
  setHeaderTitle: Dispatch<React.SetStateAction<string>>
}

export const SidebarContext = createContext<SidebarContextValue | null>(null)

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a Sidebar")
  }
  return context
}
