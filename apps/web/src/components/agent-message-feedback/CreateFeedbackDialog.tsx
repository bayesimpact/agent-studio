"use client"

import { Button } from "@caseai-connect/ui/shad/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTrigger,
} from "@caseai-connect/ui/shad/dialog"
import { Item, ItemContent } from "@caseai-connect/ui/shad/item"
import { SheetTitle } from "@caseai-connect/ui/shad/sheet"
import { Textarea } from "@caseai-connect/ui/shad/textarea"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { createAgentMessageFeedback } from "@/features/agent-message-feedback/agent-message-feedback.thunks"
import type { AgentSessionMessage } from "@/features/agent-sessions/agent-sessions.models"
import { selectCurrentOrganizationId } from "@/features/organizations/organizations.selectors"
import { selectCurrentProjectId } from "@/features/projects/projects.selectors"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { MarkdownWrapper } from "../chat/MarkdownWrapper"

export function CreateFeedbackDialog({ message }: { message: AgentSessionMessage }) {
  const { t } = useTranslation("feedbacks", { keyPrefix: "create" })
  const [open, setOpen] = useState(false)
  const handleSuccess = () => {
    setOpen(false)
  }
  return (
    <Dialog modal open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="link"
          className={
            "absolute bottom-2 text-muted-foreground text-xs font-normal hover:text-inherit"
          }
        >
          {t("report")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <SheetTitle>{t("title")}</SheetTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <Item variant="muted">
          <ItemContent>
            <MarkdownWrapper content={message.content} />
          </ItemContent>
        </Item>

        <CreateFeedbackForm agentMessageId={message.id} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  )
}

function CreateFeedbackForm({
  agentMessageId,
  onSuccess,
}: {
  agentMessageId: string
  onSuccess: () => void
}) {
  const organizationId = useAppSelector(selectCurrentOrganizationId)
  const projectId = useAppSelector(selectCurrentProjectId)

  const { t } = useTranslation("common")
  const dispatch = useAppDispatch()
  const [value, setValue] = useState("")
  const disabled = !value.trim()
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSuccess()

    if (!organizationId || !projectId) return

    dispatch(
      createAgentMessageFeedback({ organizationId, projectId, agentMessageId, content: value }),
    )
  }
  return (
    <div className="flex flex-col gap-2">
      <Textarea
        placeholder={t("description", { cfl: true })}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <Button className="mt-2" disabled={disabled} onClick={handleSubmit}>
        {t("send", { cfl: true })}
      </Button>
    </div>
  )
}
