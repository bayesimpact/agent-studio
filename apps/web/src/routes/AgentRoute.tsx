import { Button } from "@caseai-connect/ui/shad/button"
import { Item, ItemActions, ItemContent, ItemTitle } from "@caseai-connect/ui/shad/item"
import { ScrollArea } from "@caseai-connect/ui/shad/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@caseai-connect/ui/shad/sheet"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Outlet, useNavigate, useOutlet, useParams } from "react-router-dom"
import { DeleteAgentDialogWithTrigger } from "@/components/agents/DeleteAgentDialog"
import { EditAgentDialogWithTrigger } from "@/components/agents/EditAgentDialog"
import { MarkdownWrapper } from "@/components/chat/MarkdownWrapper"
import { FullPageCenterLayout } from "@/components/layouts/FullPageCenterLayout"
import { useSidebarLayout } from "@/components/layouts/sidebar/context"
import { CreateAgentSession } from "@/components/sidebar/projects/agent-sessions/CreateAgentSession"
import type { AgentSession } from "@/features/agent-sessions/agent-sessions.models"
import { selectCurrentAgentSessionsData } from "@/features/agent-sessions/agent-sessions.selectors"
import type { Agent } from "@/features/agents/agents.models"
import { selectAgentData, selectCurrentAgentId } from "@/features/agents/agents.selectors"
import { selectCurrentOrganizationId } from "@/features/organizations/organizations.selectors"
import { selectCurrentProjectId } from "@/features/projects/projects.selectors"
import { useAbility } from "@/hooks/use-ability"
import { useBuildPath } from "@/hooks/use-build-path"
import { useIsRoute } from "@/hooks/use-is-route"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { buildDate } from "@/utils/build-date"
import { ErrorRoute } from "./ErrorRoute"
import { RouteNames } from "./helpers"
import { LoadingRoute } from "./LoadingRoute"

export function AgentRoute() {
  const organizationId = useAppSelector(selectCurrentOrganizationId)
  const projectId = useAppSelector(selectCurrentProjectId)
  const agentId = useAppSelector(selectCurrentAgentId)
  const agent = useAppSelector(selectAgentData)
  const agentSessions = useAppSelector(selectCurrentAgentSessionsData)

  if (ADS.isError(agent) || ADS.isError(agentSessions) || !organizationId || !projectId)
    return <ErrorRoute error={agent.error || agentSessions.error || "Unknown error"} />

  if (ADS.isFulfilled(agent) && ADS.isFulfilled(agentSessions)) {
    return (
      <WithData
        key={agentId}
        projectId={projectId}
        agent={agent.value}
        agentSessions={agentSessions.value}
        organizationId={organizationId}
      />
    )
  }

  return <LoadingRoute />
}

function WithData({
  agent,
  agentSessions,
  organizationId,
  projectId,
}: {
  agent: Agent
  agentSessions: AgentSession[]
  organizationId: string
  projectId: string
}) {
  const outlet = useOutlet()

  useHandleHeader(agent)

  if (outlet) return <Outlet />

  return (
    <AgentSessionList
      organizationId={organizationId}
      projectId={projectId}
      agentId={agent.id}
      agentSessions={agentSessions}
    />
  )
}

function AgentSessionList({
  organizationId,
  projectId,
  agentId,
  agentSessions,
}: {
  organizationId: string
  projectId: string
  agentId: string
  agentSessions: AgentSession[]
}) {
  const { t } = useTranslation("common")
  return (
    <FullPageCenterLayout>
      <div className="flex flex-col gap-4">
        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">{t("chatSessions")}</h4>
        {agentSessions.map((agentSession) => (
          <AgentSessionItem
            key={agentSession.id}
            organizationId={organizationId}
            projectId={projectId}
            agentId={agentId}
            agentSession={agentSession}
          />
        ))}

        <CreateAgentSession
          type="button"
          organizationId={organizationId}
          projectId={projectId}
          agentId={agentId}
        />
      </div>
    </FullPageCenterLayout>
  )
}

function AgentSessionItem({
  agentSession,
  organizationId,
  projectId,
  agentId,
}: {
  agentSession: AgentSession
  organizationId: string
  projectId: string
  agentId: string
}) {
  const navigate = useNavigate()
  const { t } = useTranslation("common")
  const { buildPath } = useBuildPath()
  const handleClick = () => {
    const path = buildPath("agentSession", {
      organizationId,
      projectId,
      agentId,
      agentSessionId: agentSession.id,
    })
    navigate(path)
  }
  return (
    <Item variant="outline" className="min-w-96 w-fit">
      <ItemContent>
        <ItemTitle>{buildDate(agentSession.updatedAt)}</ItemTitle>
      </ItemContent>
      <ItemActions>
        <Button onClick={handleClick}>{t("open")}</Button>
      </ItemActions>
    </Item>
  )
}

function useHandleHeader(agent: Agent) {
  const { isAdminInterface } = useAbility()
  const { setHeaderRightSlot } = useSidebarLayout()
  const { isRoute } = useIsRoute()
  const isAgentRoute = isRoute(RouteNames.AGENT)
  const isAgentSessionRoute = isRoute(RouteNames.AGENT_SESSION)

  useEffect(() => {
    if (!isAgentRoute && !isAgentSessionRoute) return
    if (isAdminInterface) setHeaderRightSlot(<HeaderRightSlot agent={agent} />)
    return () => {
      setHeaderRightSlot(undefined)
    }
  }, [agent, setHeaderRightSlot, isAdminInterface, isAgentRoute, isAgentSessionRoute])
}

function HeaderRightSlot({ agent }: { agent: Agent }) {
  const { organizationId } = useParams()
  if (!organizationId) return null
  return (
    <div className="flex items-center gap-2">
      <DefaultPromptDialog prompt={agent.defaultPrompt} />
      <EditAgentDialogWithTrigger organizationId={organizationId} agent={agent} />
      <DeleteAgentDialogWithTrigger organizationId={organizationId} agent={agent} />
    </div>
  )
}

function DefaultPromptDialog({ prompt }: { prompt: string }) {
  const { t } = useTranslation("agent", { keyPrefix: "detail" })
  return (
    <Sheet modal>
      <SheetTrigger asChild>
        <Button variant="outline">{t("viewPrompt")}</Button>
      </SheetTrigger>
      <SheetContent className="h-dvh min-w-[40vw]">
        <ScrollArea className="h-full">
          <SheetHeader>
            <SheetTitle>{t("defaultPromptTitle")}</SheetTitle>
          </SheetHeader>
          <Item>
            <ItemContent>
              <MarkdownWrapper content={prompt} />
            </ItemContent>
          </Item>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
