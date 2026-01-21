import { useAuth0 } from "@auth0/auth0-react"
import { useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ChatBotsList } from "@/components/chat-bots/ChatBotsList"
import { SidebarLayout } from "@/components/layouts/SidebarLayout"
import { selectMe, selectMeStatus } from "@/features/me/me.selectors"
import { selectOrganizations } from "@/features/organizations/organizations.selectors"
import { selectProjects } from "@/features/projects/projects.selectors"
import { LoadingRoute } from "@/routes/LoadingRoute"
import { useAppSelector } from "@/store/hooks"
import { meStateToUser } from "@/utils/to-user"

export function ProjectChatBotsRoute() {
  const { isAuthenticated, isLoading } = useAuth0()
  const navigate = useNavigate()
  const { projectId } = useParams<{ projectId: string }>()
  const organizations = useAppSelector(selectOrganizations)
  const meStatus = useAppSelector(selectMeStatus)
  const meUser = useAppSelector(selectMe)
  const projects = useAppSelector(selectProjects)
  const user = meStateToUser(meUser)

  // Find the project to get its name for the header
  const project = projects?.projects?.find((p) => p.id === projectId)
  const headerTitle = project ? project.name : "Dashboard"

  useEffect(() => {
    // If user data is loaded and has no organizations, redirect to onboarding
    if (meStatus === "succeeded" && organizations.length === 0) {
      navigate("/onboarding", { replace: true })
    }
  }, [meStatus, organizations, navigate])

  if (isLoading || meStatus === "loading") return <LoadingRoute />

  if (isAuthenticated && user && organizations.length > 0) {
    return (
      <SidebarLayout user={user} headerTitle={headerTitle}>
        <ChatBotsList />
      </SidebarLayout>
    )
  }

  // Show loading while redirecting
  return <LoadingRoute />
}
