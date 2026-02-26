"use client"

import { Button } from "@caseai-connect/ui/shad/button"
import { ScrollArea } from "@caseai-connect/ui/shad/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@caseai-connect/ui/shad/sheet"
import { PenLineIcon } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import type { Agent } from "@/features/agents/agents.models"
import { updateAgent } from "@/features/agents/agents.thunks"
import { useAppDispatch } from "@/store/hooks"
import type { AgentFormData } from "./agent-form.shared"
import { ConversationAgentForm } from "./ConversationAgentForm"
import { ExtractionAgentForm } from "./ExtractionAgentForm"

export function AgentEditorWithTrigger({
  organizationId,
  agent,
}: {
  organizationId: string
  agent: Agent
}) {
  const [open, setOpen] = useState(false)

  const handleSuccess = () => {
    setOpen(false)
  }

  if (!agent) return null
  return (
    <Sheet modal open={open} onOpenChange={(open: boolean) => setOpen(open)}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <PenLineIcon />
        </Button>
      </SheetTrigger>

      <Content organizationId={organizationId} agent={agent} onSuccess={handleSuccess} />
    </Sheet>
  )
}

export function AgentEditorWithoutTrigger({
  organizationId,
  agent,
  onClose,
}: {
  organizationId: string
  agent: Agent | null
  onClose: () => void
}) {
  const handleSuccess = () => {
    onClose()
  }

  if (!agent) return null
  return (
    <Sheet modal open={!!agent} onOpenChange={(open: boolean) => !open && onClose()}>
      <Content organizationId={organizationId} agent={agent} onSuccess={handleSuccess} />
    </Sheet>
  )
}

function Content({
  organizationId,
  agent,
  onSuccess,
}: {
  organizationId: string
  agent: Agent
  onSuccess: () => void
}) {
  const { t } = useTranslation("agent", { keyPrefix: "update" })
  const sheetTitle = agent.type === "extraction" ? t("titleExtraction") : t("titleConversation")
  const sheetDescription =
    agent.type === "extraction" ? t("descriptionExtraction") : t("descriptionConversation")

  return (
    <SheetContent side="bottom" className="h-dvh">
      <ScrollArea className="h-full">
        <SheetHeader>
          <SheetTitle>{sheetTitle}</SheetTitle>
          <SheetDescription>{sheetDescription}</SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-4">
          <UpdateForm organizationId={organizationId} agent={agent} onSuccess={onSuccess} />
        </div>
      </ScrollArea>
    </SheetContent>
  )
}

function UpdateForm({
  organizationId,
  agent,
  onSuccess,
}: {
  organizationId: string
  agent: Agent
  onSuccess?: () => void
}) {
  const dispatch = useAppDispatch()

  const handleSubmit = (fields: AgentFormData) => {
    const parsedOutputSchema =
      agent.type === "extraction" && fields.outputJsonSchemaText
        ? (JSON.parse(fields.outputJsonSchemaText) as Record<string, unknown>)
        : undefined

    dispatch(
      updateAgent({
        organizationId,
        projectId: agent.projectId,
        agentId: agent.id,
        fields: {
          name: fields.name,
          defaultPrompt: fields.defaultPrompt,
          model: fields.model,
          temperature: fields.temperature,
          locale: fields.locale,
          outputJsonSchema: parsedOutputSchema,
        },
      }),
    )
    onSuccess?.()
  }

  if (agent.type === "extraction") {
    return <ExtractionAgentForm editableAgent={agent} onSubmit={handleSubmit} />
  }

  return <ConversationAgentForm editableAgent={agent} onSubmit={handleSubmit} />
}
