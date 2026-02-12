import { Button } from "@caseai-connect/ui/shad/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@caseai-connect/ui/shad/card"
import { Item, ItemContent } from "@caseai-connect/ui/shad/item"
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
import { Outlet, useOutlet, useParams } from "react-router-dom"
import { DeleteAgentDialogWithTrigger } from "@/components/agents/DeleteAgentDialog"
import { EditAgentDialogWithTrigger } from "@/components/agents/EditAgentDialog"
import { MarkdownWrapper } from "@/components/chat/MarkdownWrapper"
import { useSidebarLayout } from "@/components/layouts/sidebar/context"
import { CreateAgentSession } from "@/components/sidebar/projects/agent-sessions/CreateAgentSession"
import { selectAgentSessionsFromAgentId } from "@/features/agent-sessions/agent-sessions.selectors"
import type { Agent } from "@/features/agents/agents.models"
import { selectAgentData, selectCurrentAgentId } from "@/features/agents/agents.selectors"
import { selectCurrentOrganizationId } from "@/features/organizations/organizations.selectors"
import { selectCurrentProjectId } from "@/features/projects/projects.selectors"
import { useAbility } from "@/hooks/use-ability"
import { useIsRoute } from "@/hooks/use-is-route"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { RouteNames } from "./helpers"
import { LoadingRoute } from "./LoadingRoute"
import { NotFoundRoute } from "./NotFoundRoute"

export function AgentRoute() {
  const agentId = useAppSelector(selectCurrentAgentId)
  const agent = useAppSelector(selectAgentData)
  const agentSessions = useAppSelector(selectAgentSessionsFromAgentId(agentId))

  if (ADS.isError(agent) || ADS.isError(agentSessions)) return <NotFoundRoute />

  if (ADS.isFulfilled(agent) && ADS.isFulfilled(agentSessions)) {
    return <WithData key={agentId} agent={agent.value} />
  }

  return <LoadingRoute />
}

function WithData({ agent }: { agent: Agent }) {
  const outlet = useOutlet()

  useHandleHeader(agent)

  if (outlet) return <Outlet />

  return <NoagentSession agentId={agent.id} />
}

function NoagentSession({ agentId }: { agentId: string }) {
  const { t } = useTranslation("agentSession", { keyPrefix: "list" })
  const organizationId = useAppSelector(selectCurrentOrganizationId)
  const projectId = useAppSelector(selectCurrentProjectId)
  if (!organizationId || !projectId) return null
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("empty.title")}</CardTitle>
          <CardDescription>{t("empty.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateAgentSession
            type="button"
            organizationId={organizationId}
            projectId={projectId}
            agentId={agentId}
          />
        </CardContent>
      </Card>
    </div>
  )
}

function useHandleHeader(agent: Agent) {
  const { isAdminInterface } = useAbility()
  const { setHeaderTitle, setHeaderRightSlot } = useSidebarLayout()
  const headerTitle = agent && isAdminInterface ? `${agent.name} - Playground` : "Agent"
  const { isRoute } = useIsRoute()
  const isAgentRoute = isRoute(RouteNames.AGENT)
  const isAgentSessionRoute = isRoute(RouteNames.AGENT_SESSION)

  useEffect(() => {
    if (!isAgentRoute && !isAgentSessionRoute) return
    setHeaderTitle(headerTitle)
    if (isAdminInterface) setHeaderRightSlot(<HeaderRightSlot agent={agent} />)
    return () => {
      setHeaderTitle("")
      setHeaderRightSlot(undefined)
    }
  }, [
    headerTitle,
    setHeaderTitle,
    agent,
    setHeaderRightSlot,
    isAdminInterface,
    isAgentRoute,
    isAgentSessionRoute,
  ])
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
