import { Section } from "@caseai-connect/ui/components/layouts/sidebar/Section"
import { SidebarMenu } from "@caseai-connect/ui/shad/sidebar"
import { useTranslation } from "react-i18next"
import type { Agent } from "@/features/agents/agents.models"
import { selectAgentsFromProjectId } from "@/features/agents/agents.selectors"
import type { Project } from "@/features/projects/projects.models"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"

export function ProjectItem({
  project,
  children,
  options,
  showEmptyProject = false,
}: {
  project: Project
  children: (args: { agents: Agent[] }) => React.ReactNode
  options?: React.ReactNode
  showEmptyProject?: boolean
}) {
  const { t } = useTranslation()
  const agents = useAppSelector(selectAgentsFromProjectId(project.id))

  const name = `${t("project:project")} - ${project.name}`

  if (!ADS.isFulfilled(agents)) return <div>Error</div>

  if (agents.value.length === 0 && !showEmptyProject) return null

  return (
    <Section name={name} options={options} className="group-data-[collapsible=icon]:hidden">
      <SidebarMenu>{children({ agents: agents.value })}</SidebarMenu>
    </Section>
  )
}
