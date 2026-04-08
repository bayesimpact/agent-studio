import { useTranslation } from "react-i18next"
import { useNavigate, useOutlet } from "react-router-dom"
import { Grid, GridContent, GridHeader } from "@/common/components/grid/Grid"
import type { Project } from "@/common/features/projects/projects.models"
import type { Agent } from "@/features/agents/agents.models"
import { useGetPath } from "@/hooks/use-build-path"
import { AgentItem } from "@/studio/features/agents/components/AgentItem"

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
    const path = getPath(outlet ? "project" : "organization")
    navigate(path)
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
