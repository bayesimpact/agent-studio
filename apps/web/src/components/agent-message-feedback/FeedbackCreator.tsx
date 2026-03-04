"use client"

import { Button } from "@caseai-connect/ui/shad/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTrigger,
} from "@caseai-connect/ui/shad/dialog"
import { Field, FieldGroup, FieldLabel, FieldSet } from "@caseai-connect/ui/shad/field"
import { Item, ItemContent } from "@caseai-connect/ui/shad/item"
import { SheetTitle } from "@caseai-connect/ui/shad/sheet"
import { Textarea } from "@caseai-connect/ui/shad/textarea"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { createAgentMessageFeedback } from "@/features/agent-message-feedback/agent-message-feedback.thunks"
import type { AgentSessionMessage } from "@/features/agents/shared/agent-session-messages/agent-session-messages.models"
import { useAppDispatch } from "@/store/hooks"
import { MarkdownWrapper } from "../chat/MarkdownWrapper"

export function FeedbackCreator({ message }: { message: AgentSessionMessage }) {
  const { t } = useTranslation("agentMessageFeedback", { keyPrefix: "create" })
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
          {t("button")}
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

        <CreateForm agentMessageId={message.id} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  )
}

function CreateForm({
  agentMessageId,
  onSuccess,
}: {
  agentMessageId: string
  onSuccess: () => void
}) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const [value, setValue] = useState("")
  const disabled = !value.trim()
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSuccess()
    dispatch(createAgentMessageFeedback({ agentMessageId, content: value }))
  }
  return (
    <div className="flex flex-col gap-2">
      <FieldGroup>
        <FieldSet>
          <Field>
            <FieldLabel htmlFor="description">{t("agentMessageFeedback:props.content")}</FieldLabel>
            <Textarea
              placeholder={t("agentMessageFeedback:props.placeholders.content")}
              value={value}
              // biome-ignore lint/suspicious/noExplicitAny: This is a React change event, which is always an any type
              onChange={(e: any) => setValue(e.target.value)}
            />
          </Field>

          <Field orientation="horizontal" className="justify-end">
            <Button disabled={disabled} onClick={handleSubmit}>
              <span className="capitalize-first">{t("actions:send")}</span>
            </Button>
          </Field>
        </FieldSet>
      </FieldGroup>
    </div>
  )
}
