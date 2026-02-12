import { HeaderButton } from "@caseai-connect/ui/components/layouts/sidebar/Header"
import { Button } from "@caseai-connect/ui/shad/button"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@caseai-connect/ui/shad/item"
import { SlidersHorizontalIcon, SparklesIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import type { Organization } from "@/features/organizations/organizations.models"
import type { Project } from "@/features/projects/projects.models"
import { useBuildPath, useGetPath } from "@/hooks/use-build-path"
import { InterfaceToggle } from "@/routes/DashboardRoute"
import { buildDate } from "@/utils/build-date"
import { FullPageCenterLayout } from "./layouts/FullPageCenterLayout"
import { CreateProjectDialogWithTrigger } from "./sidebar/projects/CreateProjectDialog"

export function ProjectList({
  projects,
  organization,
  isAdmin,
  isAdminInterface,
}: {
  projects: Project[]
  organization: Organization
  isAdmin: boolean
  isAdminInterface: boolean
}) {
  const { t } = useTranslation("common")
  const { getPath } = useGetPath()
  return (
    <FullPageCenterLayout>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-1 mb-2 border-b-4 pb-6 border-gray-100">
          <HeaderButton
            className="flex flex-1 gap-2 items-center"
            Icon={isAdminInterface ? SlidersHorizontalIcon : SparklesIcon}
            to={getPath("organization")}
            name={organization.name}
            subname={isAdminInterface ? "Admin" : undefined}
            iconClassName={
              isAdminInterface ? "bg-orange-500" : "bg-gradient-to-tr from-purple-600 to-indigo-600"
            }
          />

          <InterfaceToggle isAdmin={isAdmin} isAdminInterface={isAdminInterface} />
        </div>

        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">{t("projects")}</h4>
        {projects.map((project) => (
          <ProjectItem key={project.id} organizationId={organization.id} project={project} />
        ))}

        {isAdminInterface && (
          <CreateProjectDialogWithTrigger type="button" organization={organization} />
        )}
      </div>
    </FullPageCenterLayout>
  )
}

function ProjectItem({ project, organizationId }: { project: Project; organizationId: string }) {
  const navigate = useNavigate()
  const { t } = useTranslation("common")
  const { buildPath } = useBuildPath()
  const handleClick = () => {
    const path = buildPath("project", { organizationId, projectId: project.id })
    navigate(path)
  }
  return (
    <Item variant="outline" className="min-w-96 w-fit">
      <ItemContent>
        <ItemTitle>{project.name}</ItemTitle>
        <ItemDescription>{buildDate(project.updatedAt)}</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button onClick={handleClick}>{t("open")}</Button>
      </ItemActions>
    </Item>
  )
}
