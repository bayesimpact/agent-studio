import { SidebarMenuButton } from "@caseai-connect/ui/shad/sidebar"
import { ExternalLinkIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useOutlet } from "react-router-dom"
import { SidebarAgentList } from "@/common/components/sidebar/list/SidebarAgentList"
import { SidebarLayout } from "@/common/components/sidebar/SidebarLayout"
import type { User } from "@/common/features/me/me.models"
import type { Organization } from "@/common/features/organizations/organizations.models"
import { ProjectList } from "@/common/features/projects/components/ProjectList"
import type { Project } from "@/common/features/projects/projects.models"
import { selectCurrentProjectData } from "@/common/features/projects/projects.selectors"
import { useAbility } from "@/common/hooks/use-ability"
import { useAppSelector } from "@/common/store/hooks"
import { buildStudioPath } from "@/studio/routes/helpers"

export function DeskDashboardRoute({
  user,
  projects,
  organization,
}: {
  user: User
  projects: Project[]
  organization: Organization
}) {
  const outlet = useOutlet()
  const project = useAppSelector(selectCurrentProjectData)

  return (
    <SidebarLayout
      organization={organization}
      sidebarContentChildren={
        <SidebarAgentList organizationId={organization.id} project={project.value} />
      }
      user={{ name: user.name, email: user.email }}
      sidebarFooterChildren={<SidebarFooterChildren organizationId={organization.id} />}
    >
      <div className="mx-10 2xl:mx-30 my-10 border relative rounded-2xl overflow-hidden">
        {outlet ? outlet : <ProjectList projects={projects} organization={organization} />}
      </div>
    </SidebarLayout>
  )
}

function SidebarFooterChildren({ organizationId }: { organizationId: string }) {
  const { t } = useTranslation()
  const { abilities } = useAbility()
  if (!abilities.canAccessStudio) return null
  return (
    <SidebarMenuButton
      variant="outline"
      className="bg-primary hover:bg-primary/90 text-white hover:text-white active:bg-primary/80 active:text-white"
      asChild
    >
      <a
        target="_blank"
        className="text-center w-full flex items-center justify-center"
        rel="noopener noreferrer"
        href={buildStudioPath(`/o/${organizationId}`)}
      >
        <ExternalLinkIcon />
        {t("actions:goToStudio")}
      </a>
    </SidebarMenuButton>
  )
}
