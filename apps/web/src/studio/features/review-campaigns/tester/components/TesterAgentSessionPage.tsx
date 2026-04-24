"use client"

import type { SubmitTesterSessionFeedbackRequestDto } from "@caseai-connect/api-contracts"
import { Badge } from "@caseai-connect/ui/shad/badge"
import { Button } from "@caseai-connect/ui/shad/button"
import { ArrowLeftIcon, CheckCircle2Icon, XCircleIcon } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import type { ConversationAgentSession } from "@/common/features/agents/agent-sessions/conversation/conversation-agent-sessions.models"
import { FormResult } from "@/common/features/agents/agent-sessions/form/components/FormResult"
import type { FormAgentSession } from "@/common/features/agents/agent-sessions/form/form-agent-sessions.models"
import type { AgentSessionMessage } from "@/common/features/agents/agent-sessions/shared/agent-session-messages/agent-session-messages.models"
import { selectCurrentMessagesData } from "@/common/features/agents/agent-sessions/shared/agent-session-messages/agent-session-messages.selectors"
import { agentSessionMessagesActions } from "@/common/features/agents/agent-sessions/shared/agent-session-messages/agent-session-messages.slice"
import { AgentSessionMessages } from "@/common/features/agents/agent-sessions/shared/agent-session-messages/components/AgentSessionMessages"
import type { Agent } from "@/common/features/agents/agents.models"
import { ADS } from "@/common/store/async-data-status"
import { useAppDispatch, useAppSelector } from "@/common/store/hooks"
import { buildTesterCampaignPath } from "@/studio/routes/helpers"
import { selectTesterContext } from "../tester.selectors"
import { reviewCampaignsTesterActions } from "../tester.slice"
import { getTesterContext, submitTesterFeedback } from "../tester.thunks"
import { TesterFeedbackModal } from "./TesterFeedbackModal"

type Params = {
  organizationId: string
  projectId: string
  reviewCampaignId: string
  agentId: string
  agentSessionId: string
}

export function TesterAgentSessionPage() {
  const dispatch = useAppDispatch()
  const params = useParams<Params>()
  const contextState = useAppSelector(selectTesterContext)
  const messagesData = useAppSelector(selectCurrentMessagesData)

  useEffect(() => {
    if (
      params.organizationId &&
      params.projectId &&
      params.reviewCampaignId &&
      !ADS.isFulfilled(contextState)
    ) {
      dispatch(
        getTesterContext({
          organizationId: params.organizationId,
          projectId: params.projectId,
          reviewCampaignId: params.reviewCampaignId,
        }),
      )
    }
    return () => {
      if (!params.reviewCampaignId) {
        dispatch(reviewCampaignsTesterActions.clearSelectedContext())
      }
    }
  }, [dispatch, params.organizationId, params.projectId, params.reviewCampaignId, contextState])

  // Reset the shared messages slice whenever the selected session changes so that
  // a fresh tester session starts with an empty chat (messages get appended by
  // the sendMessage streaming flow).
  const agentSessionId = params.agentSessionId
  useEffect(() => {
    if (!agentSessionId) return
    dispatch(agentSessionMessagesActions.reset())
  }, [dispatch, agentSessionId])

  const syntheticSession = useMemo<ConversationAgentSession | FormAgentSession | null>(() => {
    if (!params.agentId || !params.agentSessionId || !ADS.isFulfilled(contextState)) return null
    const now = Date.now()
    return {
      id: params.agentSessionId,
      agentId: params.agentId,
      type: "live",
      createdAt: now,
      updatedAt: now,
    }
  }, [params.agentId, params.agentSessionId, contextState])

  if (
    !params.organizationId ||
    !params.projectId ||
    !params.reviewCampaignId ||
    !params.agentId ||
    !params.agentSessionId
  ) {
    return null
  }

  if (ADS.isLoading(contextState) || !ADS.isFulfilled(contextState)) {
    return <p className="p-6 text-muted-foreground text-sm">Loading…</p>
  }
  if (ADS.isError(contextState)) {
    return <p className="p-6 text-destructive text-sm">{contextState.error}</p>
  }
  if (!syntheticSession) return null

  const messages: AgentSessionMessage[] = ADS.isFulfilled(messagesData) ? messagesData.value : []

  return (
    <TesterAgentSessionContent
      organizationId={params.organizationId}
      projectId={params.projectId}
      // Tester context carries a trimmed agent snapshot, not the full AgentDto.
      // Safe for the conversation branch; the form-agent `FormResult` reads
      // `outputJsonSchema`, which will need a full-agent fetch when form-agent
      // tester support lands.
      agent={contextState.value.agent as Agent}
      agentSession={syntheticSession}
      messages={messages}
      campaignName={contextState.value.name}
      perSessionQuestions={contextState.value.testerPerSessionQuestions}
      backPath={buildTesterCampaignPath({
        organizationId: params.organizationId,
        projectId: params.projectId,
        reviewCampaignId: params.reviewCampaignId,
      })}
    />
  )
}

type TesterAgentSessionContentProps = {
  organizationId: string
  projectId: string
  agent: Agent
  agentSession: ConversationAgentSession | FormAgentSession
  messages: React.ComponentProps<typeof AgentSessionMessages>["messages"]
  campaignName: string
  perSessionQuestions: React.ComponentProps<typeof TesterFeedbackModal>["questions"]
  backPath: string
}

export function TesterAgentSessionContent({
  organizationId,
  projectId,
  agent,
  agentSession,
  messages,
  campaignName,
  perSessionQuestions,
  backPath,
}: TesterAgentSessionContentProps) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [feedbackOpen, setFeedbackOpen] = useState(false)

  const handleSubmitFeedback = async (payload: SubmitTesterSessionFeedbackRequestDto) => {
    await dispatch(
      submitTesterFeedback({
        organizationId,
        projectId,
        sessionId: agentSession.id,
        fields: payload,
      }),
    ).unwrap()
    setFeedbackOpen(false)
    navigate(backPath)
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between gap-4 border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(backPath)}>
            <ArrowLeftIcon /> Back to campaign
          </Button>
          <div className="hidden md:flex items-center gap-2 text-sm">
            <Badge variant="outline">Review campaign</Badge>
            <span className="font-medium">{campaignName}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{agent.name}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate(backPath)}>
            <XCircleIcon /> Abandon
          </Button>
          <Button onClick={() => setFeedbackOpen(true)}>
            <CheckCircle2Icon /> End session & give feedback
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <AgentSessionMessages
          session={agentSession}
          messages={messages}
          rightSlot={
            agent.type === "form" ? (
              <FormResult agent={agent} agentSession={agentSession} />
            ) : undefined
          }
        />
      </div>

      <TesterFeedbackModal
        open={feedbackOpen}
        questions={perSessionQuestions}
        onSubmit={handleSubmitFeedback}
        onAbandon={() => {
          setFeedbackOpen(false)
          navigate(backPath)
        }}
      />
    </div>
  )
}
