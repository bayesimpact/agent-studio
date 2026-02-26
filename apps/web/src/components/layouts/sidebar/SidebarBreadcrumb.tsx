import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@caseai-connect/ui/shad/breadcrumb"
import { Button } from "@caseai-connect/ui/shad/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@caseai-connect/ui/shad/dropdown-menu"
import { cn } from "@caseai-connect/ui/utils"
import { ChevronDownIcon, DotIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import {
  selectCurrentAgentSessionData,
  selectCurrentAgentSessionsData,
} from "@/features/agent-sessions/agent-sessions.selectors"
import { selectAgentData, selectCurrentAgentsData } from "@/features/agents/agents.selectors"
import type { Organization } from "@/features/organizations/organizations.models"
import {
  selectCurrentProjectData,
  selectCurrentProjectId,
  selectProjectsData,
} from "@/features/projects/projects.selectors"
import { useBuildPath } from "@/hooks/use-build-path"
import { useIsRoute } from "@/hooks/use-is-route"
import { RouteNames } from "@/routes/helpers"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { buildDate } from "@/utils/build-date"

export function SidebarBreadcrumb({ organization }: { organization: Organization }) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <ProjectList organizationId={organization.id} />

        <AgentList organizationId={organization.id} />

        <AgentSessionList organizationId={organization.id} />

        <ProjectEvaluation />

        <ProjectDocuments />

        <ProjectMemberships />

        <AgentFeedback />
      </BreadcrumbList>
    </Breadcrumb>
  )
}

function ProjectList({ organizationId }: { organizationId: string }) {
  const projects = useAppSelector(selectProjectsData)
  const project = useAppSelector(selectCurrentProjectData)
  const { buildPath } = useBuildPath()
  if (!ADS.isFulfilled(projects) || !ADS.isFulfilled(project)) return null

  const currentProjectPath = buildPath("project", { organizationId, projectId: project.value.id })
  const handleClick = (projectId: string) => () => {
    const path = buildPath("project", { organizationId, projectId })
    window.location.replace(path)
  }
  if (projects.value.length === 1)
    return (
      <BreadcrumbItem>
        <BreadcrumbLink asChild>
          <Link to={currentProjectPath}>{project.value.name}</Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
    )
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          {project.value.name}
          <ChevronDownIcon className="size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuGroup>
          {projects.value.map((p) => (
            <DropdownMenuItem
              key={p.id}
              className={cn("cursor-pointer", p.id === project.value.id && "text-muted-foreground")}
              onClick={handleClick(p.id)}
            >
              {p.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function AgentList({ organizationId }: { organizationId: string }) {
  const agents = useAppSelector(selectCurrentAgentsData)
  const agent = useAppSelector(selectAgentData)
  const { buildPath } = useBuildPath()
  if (!ADS.isFulfilled(agents) || !ADS.isFulfilled(agent)) return null

  const currentAgentPath = buildPath("agent", {
    organizationId,
    projectId: agent.value.projectId,
    agentId: agent.value.id,
  })
  const handleClick = (agentId: string) => () => {
    const nextAgent = agents.value.find((candidateAgent) => candidateAgent.id === agentId)
    if (!nextAgent) return
    const path =
      nextAgent.type === "extraction"
        ? buildPath("extractionAgent", {
            organizationId,
            projectId: agent.value.projectId,
            agentId,
          })
        : buildPath("agent", { organizationId, projectId: agent.value.projectId, agentId })
    window.location.replace(path)
  }
  const currentPath =
    agent.value.type === "extraction"
      ? buildPath("extractionAgent", {
          organizationId,
          projectId: agent.value.projectId,
          agentId: agent.value.id,
        })
      : currentAgentPath
  if (agents.value.length === 1)
    return (
      <>
        <BreadcrumbSeparator>
          <DotIcon />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to={currentPath}>{agent.value.name}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
      </>
    )
  return (
    <>
      <BreadcrumbSeparator>
        <DotIcon />
      </BreadcrumbSeparator>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            {agent.value.name}
            <ChevronDownIcon className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuGroup>
            {agents.value.map((a) => (
              <DropdownMenuItem
                key={a.id}
                className={cn("cursor-pointer", a.id === agent.value.id && "text-muted-foreground")}
                onClick={handleClick(a.id)}
              >
                {a.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}

function AgentSessionList({ organizationId }: { organizationId: string }) {
  const projectId = useAppSelector(selectCurrentProjectId)
  const sessions = useAppSelector(selectCurrentAgentSessionsData)
  const session = useAppSelector(selectCurrentAgentSessionData)
  const { buildPath } = useBuildPath()

  if (!ADS.isFulfilled(sessions) || !ADS.isFulfilled(session)) return null

  const currentSessionName = buildDate(session.value.createdAt)
  const currentSessionPath = buildPath("agentSession", {
    organizationId,
    projectId: projectId!,
    agentId: session.value.agentId,
    agentSessionId: session.value.id,
  })

  const handleClick =
    ({ agentId, agentSessionId }: { agentId: string; agentSessionId: string }) =>
    () => {
      const path = buildPath("agentSession", {
        organizationId,
        projectId: projectId!,
        agentId,
        agentSessionId,
      })
      window.location.replace(path)
    }
  if (sessions.value.length === 1)
    return (
      <>
        <BreadcrumbSeparator>
          <DotIcon />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to={currentSessionPath}>{currentSessionName}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
      </>
    )
  return (
    <>
      <BreadcrumbSeparator>
        <DotIcon />
      </BreadcrumbSeparator>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            {currentSessionName}
            <ChevronDownIcon className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuGroup>
            {sessions.value.map((s) => (
              <DropdownMenuItem
                key={s.id}
                className={cn(
                  "cursor-pointer",
                  s.id === session.value.id && "text-muted-foreground",
                )}
                onClick={handleClick({ agentId: s.agentId, agentSessionId: s.id })}
              >
                {buildDate(s.createdAt)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}

function AgentFeedback() {
  const { isRoute } = useIsRoute()
  const isFeedbackRoute = isRoute(RouteNames.FEEDBACK)
  const { t } = useTranslation()
  if (!isFeedbackRoute) return null
  return (
    <>
      <BreadcrumbSeparator>
        <DotIcon />
      </BreadcrumbSeparator>
      <BreadcrumbItem>{t("agentMessageFeedback:feedback")}</BreadcrumbItem>
    </>
  )
}

function ProjectDocuments() {
  const { isRoute } = useIsRoute()
  const isDocumentsRoute = isRoute(RouteNames.DOCUMENTS)
  const { t } = useTranslation("document")
  if (!isDocumentsRoute) return null
  return (
    <>
      <BreadcrumbSeparator>
        <DotIcon />
      </BreadcrumbSeparator>
      <BreadcrumbItem>{t("documents")}</BreadcrumbItem>
    </>
  )
}

function ProjectEvaluation() {
  const { isRoute } = useIsRoute()
  const isEvaluationRoute = isRoute(RouteNames.EVALUATION)
  const { t } = useTranslation("evaluation")
  if (!isEvaluationRoute) return null
  return (
    <>
      <BreadcrumbSeparator>
        <DotIcon />
      </BreadcrumbSeparator>
      <BreadcrumbItem>{t("evaluation")}</BreadcrumbItem>
    </>
  )
}

function ProjectMemberships() {
  const { isRoute } = useIsRoute()
  const isProjectMembershipsRoute = isRoute(RouteNames.PROJECT_MEMBERSHIPS)
  const { t } = useTranslation("evaluation")
  if (!isProjectMembershipsRoute) return null
  return (
    <>
      <BreadcrumbSeparator>
        <DotIcon />
      </BreadcrumbSeparator>
      <BreadcrumbItem>{t("members")}</BreadcrumbItem>
    </>
  )
}
