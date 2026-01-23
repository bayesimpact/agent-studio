import { useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ChatBotsList } from "@/components/chat-bots/ChatBotsList"
import { useSidebar } from "@/components/layouts/sidebar/context"
import { selectMe, selectMeStatus } from "@/features/me/me.selectors"
import { selectOrganizations } from "@/features/organizations/organizations.selectors"
import { selectProjects } from "@/features/projects/projects.selectors"
import { LoadingRoute } from "@/routes/LoadingRoute"
import { useAppSelector } from "@/store/hooks"
import { meStateToUser } from "@/utils/to-user"

export function ProjectRoute() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const organizations = useAppSelector(selectOrganizations)
  const meStatus = useAppSelector(selectMeStatus)
  const meUser = useAppSelector(selectMe)
  const user = meStateToUser(meUser)

  const { setHeaderTitle } = useSidebar()

  // Find the project to get its name for the header
  const projects = useAppSelector(selectProjects)
  const project = projects?.projects?.find((p) => p.id === projectId)
  const headerTitle = project ? `${project.name} - Chat Bots` : "Dashboard"

  useEffect(() => {
    setHeaderTitle(headerTitle)
  }, [headerTitle, setHeaderTitle])

  useEffect(() => {
    // If user data is loaded and has no organizations, redirect to onboarding
    if (meStatus === "succeeded" && organizations.length === 0) {
      navigate("/onboarding", { replace: true })
    }
  }, [meStatus, organizations, navigate])

  if (user && organizations.length > 0) {
    return <ChatBotsList />
  }

  // Show loading while redirecting
  return <LoadingRoute />
}
