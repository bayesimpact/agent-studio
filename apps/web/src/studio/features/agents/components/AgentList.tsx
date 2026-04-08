import { Button } from "@caseai-connect/ui/shad/button"
import { PlusCircleIcon } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useOutlet } from "react-router-dom"
import type { Agent } from "@/features/agents/agents.models"
import { AgentCreator } from "@/features/agents/components/AgentCreator"
import type { Project } from "@/features/projects/projects.models"
import { useGetPath } from "@/hooks/use-build-path"
import { Grid, GridContent, GridHeader, GridItem } from "@/studio/components/grid/Grid"
import { AgentItem2 } from "@/studio/features/agents/components/AgentItem"
import { ProjectDeletor } from "@/studio/features/projects/components/ProjectDeletor"
import { ProjectEditor } from "@/studio/features/projects/components/ProjectEditor"
import { AnalyticsButton } from "./AnalyticsButton"
import { DocumentsButton } from "./DocumentsButton"
import { EvaluationButton } from "./EvaluationButton"
import { MembersButton } from "./MembersButton"

const extraItems = [
  AgentCreatorButton,
  DocumentsButton,
  MembersButton,
  AnalyticsButton,
  EvaluationButton,
]

export function AgentList({ project, agents }: { project: Project; agents: Agent[] }) {
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
    <Grid cols={3} total={agents.length} extraItems={extraItems.length}>
      <GridHeader
        onBack={handleBack}
        title={project.name}
        description={t("project:project")}
        action={
          <>
            <ProjectEditor project={project} />
            <ProjectDeletor project={project} />
          </>
        }
      />

      <GridContent>
        {agents.map((agent, index) => (
          <AgentItem2
            index={index}
            key={agent.id}
            organizationId={project.organizationId}
            projectId={agent.projectId}
            agent={agent}
          />
        ))}

        {extraItems.map((Component, index) => (
          <Component
            key={`${Component.name}-${index}`}
            project={project}
            index={agents.length + index}
          />
        ))}
      </GridContent>
    </Grid>
  )
}

function AgentCreatorButton({ project, index }: { project: Project; index: number }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  return (
    <GridItem
      className="bg-muted/35"
      index={index}
      title={t("agent:create.title")}
      description={t("agent:create.description")}
      action={
        <>
          <Button size="lg" className="text-base" onClick={() => setOpen(true)}>
            {t("actions:create")}
            <PlusCircleIcon className="ml-2 size-5" />
          </Button>
          <AgentCreator project={project} open={open} onOpenChange={setOpen} />
        </>
      }
    />
  )
}
