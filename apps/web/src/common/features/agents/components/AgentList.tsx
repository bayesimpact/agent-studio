import { useTranslation } from "react-i18next"
import { useNavigate, useOutlet } from "react-router-dom"
import { Grid, GridContent, GridHeader } from "@/common/components/grid/Grid"
import type { Agent } from "@/common/features/agents/agents.models"
import { AgentItem } from "@/common/features/agents/components/AgentItem"
import type { Project } from "@/common/features/projects/projects.models"
import { useGetPath } from "@/common/hooks/use-build-path"
import { DeskRouteNames } from "@/desk/routes/helpers"

export function AgentList({
  project,
  agents,
  children,
  action,
  extraItems,
}: {
  project: Project
  agents: Agent[]
  children?: React.ReactNode
  action?: React.ReactNode
  extraItems?: number
}) {
  const { t } = useTranslation()
  const outlet = useOutlet()
  const navigate = useNavigate()
  const { getPath } = useGetPath()

  const handleBack = () => {
    if (outlet) {
      const path = getPath("project")
      navigate(path)
    } else {
      const path = getPath("organization", { forceInterface: DeskRouteNames.HOME })
      navigate(path)
    }
  }

  if (outlet) return outlet
  return (
    <Grid cols={3} total={agents.length} extraItems={extraItems}>
      <GridHeader
        onBack={handleBack}
        title={project.name}
        description={t("project:project")}
        action={action}
      />

      <GridContent>
        {agents.map((agent, index) => (
          <AgentItem
            index={index}
            key={agent.id}
            organizationId={project.organizationId}
            projectId={agent.projectId}
            agent={agent}
          />
        ))}

        {children}
      </GridContent>
    </Grid>
  )
}
