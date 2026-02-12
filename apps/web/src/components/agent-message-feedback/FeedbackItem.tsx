import { Button } from "@caseai-connect/ui/shad/button"
import { Item, ItemContent, ItemFooter, ItemHeader, ItemTitle } from "@caseai-connect/ui/shad/item"
import { ExternalLinkIcon } from "lucide-react"
import type { AgentMessageFeedback } from "@/features/agent-message-feedback/agent-message-feedback.models"
import { buildDate } from "@/utils/build-date"
import { MarkdownWrapper } from "../chat/MarkdownWrapper"

export function FeedbackItem({ feedback }: { feedback: AgentMessageFeedback }) {
  const { agentSessionId, agentMessageId } = feedback
  const createdAt = buildDate(feedback.createdAt)
  return (
    <div className="py-6 flex flex-col gap-4">
      <Item variant="outline">
        <ItemContent className="text-sm">
          <MarkdownWrapper content={feedback.agentMessageContent} />
          <div className="flex gap-2 text-xs text-muted-foreground mt-2">
            <div>Session ID: {agentSessionId}</div>
            <div>Message ID: {agentMessageId}</div>
          </div>
        </ItemContent>
      </Item>

      <Item variant="muted">
        <ItemHeader>
          <ItemTitle className="text-muted-foreground">{createdAt}</ItemTitle>
        </ItemHeader>
        <ItemContent className="text-base">{feedback.content}</ItemContent>
        <ItemFooter>
          {feedback.traceUrl && (
            <Button asChild variant="outline" size="sm" className="w-fit">
              <a href={feedback.traceUrl} className="cursor-pointer" target="_blank">
                Trace Url
                <ExternalLinkIcon className="size-4" />
              </a>
            </Button>
          )}
        </ItemFooter>
      </Item>
    </div>
  )
}
