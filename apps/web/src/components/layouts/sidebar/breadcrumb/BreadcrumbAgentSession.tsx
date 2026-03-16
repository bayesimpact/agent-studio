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
import { CheckIcon, ChevronDownIcon, DotIcon } from "lucide-react"
import { Link } from "react-router-dom"
import { selectCurrentAgentData } from "@/features/agents/agents.selectors"
import type { ConversationAgentSession } from "@/features/agents/conversation-agent-sessions/conversation-agent-sessions.models"
import {
  selectCurrentConversationAgentSessionData,
  selectCurrentConversationAgentSessionsData,
} from "@/features/agents/conversation-agent-sessions/conversation-agent-sessions.selectors"
import type { FormAgentSession } from "@/features/agents/form-agent-sessions/form-agent-sessions.models"
import {
  selectCurrentFormAgentSessionData,
  selectCurrentFormAgentSessionsData,
} from "@/features/agents/form-agent-sessions/form-agent-sessions.selectors"
import { selectCurrentProjectId } from "@/features/projects/projects.selectors"
import { useBuildPath } from "@/hooks/use-build-path"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { buildDate } from "@/utils/build-date"

export function BreadcrumbAgentSession({ organizationId }: { organizationId: string }) {
  const agent = useAppSelector(selectCurrentAgentData)
  if (!ADS.isFulfilled(agent)) return null

  switch (agent.value.type) {
    case "conversation":
      return <ConversationAgentSessionList organizationId={organizationId} />
    case "form":
      return <FormAgentSessionList organizationId={organizationId} />
    default:
      return null
  }
}

function ConversationAgentSessionList({ organizationId }: { organizationId: string }) {
  const sessions = useAppSelector(selectCurrentConversationAgentSessionsData)
  const currentSession = useAppSelector(selectCurrentConversationAgentSessionData)
  if (!ADS.isFulfilled(sessions) || !ADS.isFulfilled(currentSession)) return null

  return (
    <WithData
      organizationId={organizationId}
      currentSession={currentSession.value}
      sessions={sessions.value}
    />
  )
}

function FormAgentSessionList({ organizationId }: { organizationId: string }) {
  const sessions = useAppSelector(selectCurrentFormAgentSessionsData)
  const currentSession = useAppSelector(selectCurrentFormAgentSessionData)
  if (!ADS.isFulfilled(sessions) || !ADS.isFulfilled(currentSession)) return null

  return (
    <WithData
      organizationId={organizationId}
      currentSession={currentSession.value}
      sessions={sessions.value}
    />
  )
}

function WithData({
  organizationId,
  currentSession,
  sessions,
}: {
  organizationId: string
  currentSession: ConversationAgentSession | FormAgentSession
  sessions: (ConversationAgentSession | FormAgentSession)[]
}) {
  const projectId = useAppSelector(selectCurrentProjectId)
  const { buildPath } = useBuildPath()

  const currentSessionName = buildDate(currentSession.createdAt)
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
            {sessions.map((s) => (
              <DropdownMenuItem
                key={s.id}
                className={cn("justify-between", s.id === currentSession.id && "font-semibold")}
                onClick={handleClick({ agentId: s.agentId, agentSessionId: s.id })}
              >
                {buildDate(s.createdAt)}{" "}
                {s.id === currentSession.id && <CheckIcon className="size-4" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
