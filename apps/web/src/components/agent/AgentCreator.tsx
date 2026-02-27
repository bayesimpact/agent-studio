"use client"

import { ScrollArea } from "@caseai-connect/ui/shad/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@caseai-connect/ui/shad/sheet"
import { SidebarMenuButton } from "@caseai-connect/ui/shad/sidebar"
import { PlusIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import type { Agent } from "@/features/agents/agents.models"
import { createAgent } from "@/features/agents/agents.thunks"
import type { Project } from "@/features/projects/projects.models"
import { useBuildPath } from "@/hooks/use-build-path"
import { useAppDispatch } from "@/store/hooks"
import { AgentTypeDialog } from "./AgentTypeDialog"
import type { AgentFormData } from "./agent-form.shared"
import { ConversationAgentForm } from "./ConversationAgentForm"
import { ExtractionAgentForm } from "./ExtractionAgentForm"

export function AgentCreatorWithTrigger({ project }: { project: Project }) {
  const navigate = useNavigate()
  const { buildPath } = useBuildPath()
  const { t } = useTranslation("agent", { keyPrefix: "create" })
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false)
  const [isFormSheetOpen, setIsFormSheetOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<Agent["type"]>("conversation")

  const handleSuccess = (agent: Agent) => {
    const path =
      agent.type === "extraction"
        ? buildPath("extractionAgent", {
            organizationId: project.organizationId,
            projectId: project.id,
            agentId: agent.id,
          })
        : buildPath("agent", {
            organizationId: project.organizationId,
            projectId: project.id,
            agentId: agent.id,
          })
    navigate(path)
    setIsFormSheetOpen(false)
    setSelectedType("conversation")
  }

  const handleSelectType = (agentType: Agent["type"]) => {
    setSelectedType(agentType)
    setIsTypeDialogOpen(false)
    setIsFormSheetOpen(true)
  }

  const handleTypeDialogOpenChange = (open: boolean) => {
    setIsTypeDialogOpen(open)
    if (!open) {
      setSelectedType("conversation")
    }
  }

  const handleFormSheetOpenChange = (open: boolean) => {
    setIsFormSheetOpen(open)
    if (!open) {
      setSelectedType("conversation")
    }
  }

  const sheetTitle = selectedType === "extraction" ? t("titleExtraction") : t("titleConversation")
  const sheetDescription =
    selectedType === "extraction"
      ? t("descriptionExtraction", { projectName: project.name })
      : t("descriptionConversation", { projectName: project.name })

  return (
    <div>
      <AgentTypeDialog
        open={isTypeDialogOpen}
        onOpenChange={handleTypeDialogOpenChange}
        onSelectType={handleSelectType}
      />
      <SidebarMenuButton className="cursor-pointer" onClick={() => setIsTypeDialogOpen(true)}>
        <PlusIcon />
        <span>{t("title")}</span>
      </SidebarMenuButton>
      <Sheet modal open={isFormSheetOpen} onOpenChange={handleFormSheetOpenChange}>
        <SheetContent side="bottom" className="h-dvh">
          <ScrollArea className="h-full">
            <SheetHeader>
              <SheetTitle>{sheetTitle}</SheetTitle>
              <SheetDescription>{sheetDescription}</SheetDescription>
            </SheetHeader>
            <div className="px-4 pb-4">
              <CreateForm agentType={selectedType} onSuccess={handleSuccess} />
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  )
}

export function AgentCreatorWithoutTrigger({
  project,
  isOpen,
  onOpenChange,
}: {
  project: Project
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation("agent", { keyPrefix: "create" })
  const navigate = useNavigate()
  const { buildPath } = useBuildPath()
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false)
  const [isFormSheetOpen, setIsFormSheetOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<Agent["type"]>("conversation")

  const handleSelectType = (agentType: Agent["type"]) => {
    setSelectedType(agentType)
    setIsTypeDialogOpen(false)
    setIsFormSheetOpen(true)
  }

  const handleSuccess = (agent: Agent) => {
    const path =
      agent.type === "extraction"
        ? buildPath("extractionAgent", {
            organizationId: project.organizationId,
            projectId: project.id,
            agentId: agent.id,
          })
        : buildPath("agent", {
            organizationId: project.organizationId,
            projectId: project.id,
            agentId: agent.id,
          })
    navigate(path)
    onOpenChange(false)
    setIsFormSheetOpen(false)
    setIsTypeDialogOpen(false)
    setSelectedType("conversation")
  }

  const handleTypeDialogOpenChange = (open: boolean) => {
    setIsTypeDialogOpen(open)
    if (!open && !isFormSheetOpen) {
      onOpenChange(false)
    }
  }

  const handleSheetOpenChange = (open: boolean) => {
    setIsFormSheetOpen(open)
    if (!open) {
      onOpenChange(false)
      setSelectedType("conversation")
    }
  }

  useEffect(() => {
    if (isOpen && !isTypeDialogOpen && !isFormSheetOpen) {
      setIsTypeDialogOpen(true)
    }
  }, [isFormSheetOpen, isOpen, isTypeDialogOpen])

  const sheetTitle = selectedType === "extraction" ? t("titleExtraction") : t("titleConversation")
  const sheetDescription =
    selectedType === "extraction"
      ? t("descriptionExtraction", { projectName: project.name })
      : t("descriptionConversation", { projectName: project.name })

  return (
    <>
      <AgentTypeDialog
        open={isTypeDialogOpen}
        onOpenChange={handleTypeDialogOpenChange}
        onSelectType={handleSelectType}
      />
      <Sheet modal open={isFormSheetOpen} onOpenChange={handleSheetOpenChange}>
        <SheetContent side="bottom" className="h-dvh">
          <ScrollArea className="h-full">
            <SheetHeader>
              <SheetTitle>{sheetTitle}</SheetTitle>
              <SheetDescription>{sheetDescription}</SheetDescription>
            </SheetHeader>
            <div className="px-4 pb-4">
              <CreateForm agentType={selectedType} onSuccess={handleSuccess} />
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  )
}

function CreateForm({
  agentType,
  onSuccess,
}: {
  agentType: Agent["type"]
  onSuccess: (agent: Agent) => void
}) {
  const dispatch = useAppDispatch()

  const handleCreate = async (fields: AgentFormData) => {
    const parsedOutputSchema =
      agentType === "extraction" && fields.outputJsonSchemaText
        ? (JSON.parse(fields.outputJsonSchemaText) as Record<string, unknown>)
        : undefined

    const createdAgent = await dispatch(
      createAgent({
        fields: {
          name: fields.name,
          defaultPrompt: fields.defaultPrompt,
          model: fields.model,
          temperature: fields.temperature,
          locale: fields.locale,
          type: agentType,
          outputJsonSchema: parsedOutputSchema,
        },
      }),
    ).unwrap()
    onSuccess(createdAgent)
  }

  if (agentType === "extraction") {
    return <ExtractionAgentForm onSubmit={handleCreate} />
  }

  return <ConversationAgentForm onSubmit={handleCreate} />
}
