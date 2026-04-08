import {
  BreadcrumbItem,
  BreadcrumbLink,
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
import { CheckIcon, ChevronDownIcon, GitCommitHorizontalIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { ADS } from "@/common/store/async-data-status"
import { useAppSelector } from "@/common/store/hooks"
import { buildSince } from "@/common/utils/build-date"
import type { ConversationAgentSession } from "@/features/agents/agent-sessions/conversation/conversation-agent-sessions.models"
import {
  selectCurrentConversationAgentSessionData,
  selectCurrentConversationAgentSessionsData,
} from "@/features/agents/agent-sessions/conversation/conversation-agent-sessions.selectors"
import type { FormAgentSession } from "@/features/agents/agent-sessions/form/form-agent-sessions.models"
import {
  selectCurrentFormAgentSessionData,
  selectCurrentFormAgentSessionsData,
} from "@/features/agents/agent-sessions/form/form-agent-sessions.selectors"
import type { Agent } from "@/features/agents/agents.models"
import { selectCurrentAgentData } from "@/features/agents/agents.selectors"
import { getAgentIcon } from "@/features/agents/components/AgentIcon"
import { selectCurrentProjectId } from "@/features/projects/projects.selectors"
import { useBuildPath } from "@/hooks/use-build-path"

export function BreadcrumbAgentSession({ organizationId }: { organizationId: string }) {
  const agent = useAppSelector(selectCurrentAgentData)
  if (!ADS.isFulfilled(agent)) return null

  switch (agent.value.type) {
    case "conversation":
      return <ConversationAgentSessionList organizationId={organizationId} agent={agent.value} />
    case "form":
      return <FormAgentSessionList organizationId={organizationId} agent={agent.value} />
    default:
      return null
  }
}

function ConversationAgentSessionList({
  organizationId,
  agent,
}: {
  organizationId: string
  agent: Agent
}) {
  const sessions = useAppSelector(selectCurrentConversationAgentSessionsData)
  const currentSession = useAppSelector(selectCurrentConversationAgentSessionData)
  if (!ADS.isFulfilled(sessions) || !ADS.isFulfilled(currentSession)) return null

  return (
    <WithData
      organizationId={organizationId}
      currentSession={currentSession.value}
      sessions={sessions.value}
      agent={agent}
    />
  )
}

function FormAgentSessionList({ organizationId, agent }: { organizationId: string; agent: Agent }) {
  const sessions = useAppSelector(selectCurrentFormAgentSessionsData)
  const currentSession = useAppSelector(selectCurrentFormAgentSessionData)
  if (!ADS.isFulfilled(sessions) || !ADS.isFulfilled(currentSession)) return null

  return (
    <WithData
      organizationId={organizationId}
      currentSession={currentSession.value}
      sessions={sessions.value}
      agent={agent}
    />
  )
}

function WithData({
  organizationId,
  currentSession,
  sessions,
  agent,
}: {
  organizationId: string
  currentSession: ConversationAgentSession | FormAgentSession
  sessions: (ConversationAgentSession | FormAgentSession)[]
  agent: Agent
}) {
  const { t } = useTranslation()
  const projectId = useAppSelector(selectCurrentProjectId)
  const { buildPath } = useBuildPath()
  const Icon = getAgentIcon(agent.type)
  const currentSessionName = buildSince(currentSession.createdAt)
  const currentSessionPath = buildPath("agentSession", {
    organizationId,
    projectId: projectId!,
    agentId: currentSession.agentId,
    agentSessionId: currentSession.id,
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
  if (sessions.length === 1)
    return (
      <>
        <BreadcrumbSeparator>
          <GitCommitHorizontalIcon />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to={currentSessionPath}>
              {t(`agent:create.typeDialog.${agent.type}`)} <Icon />
              {currentSessionName}
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
      </>
    )
  return (
    <>
      <BreadcrumbSeparator>
        <GitCommitHorizontalIcon />
      </BreadcrumbSeparator>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            {t(`agent:create.typeDialog.${agent.type}`)} <Icon />
            {currentSessionName}
            <ChevronDownIcon className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuGroup>
            {sessions.map((s) => (
              <DropdownMenuItem
                key={s.id}
                className={cn("justify-between", s.id === currentSession.id && "font-semibold")}
                onClick={handleClick({ agentId: s.agentId, agentSessionId: s.id })}
              >
                {buildSince(s.createdAt)}{" "}
                {s.id === currentSession.id && <CheckIcon className="size-4" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
