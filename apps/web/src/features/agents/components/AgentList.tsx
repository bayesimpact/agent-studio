import { Button } from "@caseai-connect/ui/shad/button"
import { PlusIcon } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { ListHeader } from "@/components/layouts/ListHeader"
import type { Agent } from "@/features/agents/agents.models"
import { AgentCreator } from "@/features/agents/components/AgentCreator"
import { AgentItem } from "@/features/agents/components/AgentItem"
import type { Project } from "@/features/projects/projects.models"
import { useAbility } from "@/hooks/use-ability"
import { useGetPath } from "@/hooks/use-build-path"
import { useRedirectToStudio } from "@/hooks/use-redirect-to-studio"

export function AgentList({ project, agents }: { project: Project; agents: Agent[] }) {
  const { t } = useTranslation()
  const { getPath } = useGetPath()
  const { isAdminInterface } = useAbility()

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
