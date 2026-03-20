import { Button } from "@caseai-connect/ui/shad/button"
import { PlusIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { ListHeader } from "@/components/layouts/ListHeader"
import { useSidebarLayout } from "@/components/layouts/sidebar/context"
import { ProjectDeletor } from "@/components/project/ProjectDeletor"
import { ProjectEditor } from "@/components/project/ProjectEditor"
import type { Agent } from "@/features/agents/agents.models"
import { AgentCreator } from "@/features/agents/components/AgentCreator"
import { AgentItem } from "@/features/agents/components/AgentItem"
import { selectCurrentOrganizationId } from "@/features/organizations/organizations.selectors"
import type { Project } from "@/features/projects/projects.models"
import { useAbility } from "@/hooks/use-ability"
import { useGetPath } from "@/hooks/use-build-path"
import { useIsRoute } from "@/hooks/use-is-route"
import { useRedirectToStudio } from "@/hooks/use-redirect-to-studio"
import { RouteNames } from "@/routes/helpers"
import { useAppSelector } from "@/store/hooks"

export function AgentList({ project, agents }: { project: Project; agents: Agent[] }) {
  const { t } = useTranslation()
  const { getPath } = useGetPath()
  const { isAdminInterface } = useAbility()
  useHandleHeader(project)
  useRedirectToStudio({ condition: agents.length === 0, to: "project" })

  return (
    <ListHeader path={getPath("project")} title={t("agent:list.title")}>
      {isAdminInterface && <AgentCreatorButton project={project} />}

      {agents.map((agent) => (
        <AgentItem
          key={agent.id}
          organizationId={project.organizationId}
          projectId={agent.projectId}
          agent={agent}
        />
      ))}
    </ListHeader>
  )
}

function AgentCreatorButton({ project }: { project: Project }) {
  const { t } = useTranslation("agent", { keyPrefix: "create" })
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon className="mr-2 size-4" />
        {t("button")}
      </Button>
      <AgentCreator project={project} open={open} onOpenChange={setOpen} />
    </>
  )
}

function useHandleHeader(project: Project) {
  const { isAdminInterface } = useAbility()
  const { setHeaderRightSlot } = useSidebarLayout()
  const { isRoute } = useIsRoute()
  const isProjectRoute = isRoute(RouteNames.PROJECT)

  useEffect(() => {
    if (!isProjectRoute) return
    if (isAdminInterface) setHeaderRightSlot(<HeaderRightSlot project={project} />)
    return () => {
      setHeaderRightSlot(undefined)
    }
  }, [project, setHeaderRightSlot, isAdminInterface, isProjectRoute])
}

function HeaderRightSlot({ project }: { project: Project }) {
  const organizationId = useAppSelector(selectCurrentOrganizationId)
  if (!organizationId) return null
  return (
    <div className="flex items-center gap-2">
      <ProjectEditor project={project} />
      <ProjectDeletor project={project} />
    </div>
  )
}
