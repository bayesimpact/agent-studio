import { Button } from "@caseai-connect/ui/shad/button"
import { Item, ItemTitle } from "@caseai-connect/ui/shad/item"
import { Label } from "@caseai-connect/ui/shad/label"
import { Popover, PopoverContent, PopoverTrigger } from "@caseai-connect/ui/shad/popover"
import { useTranslation } from "react-i18next"
import type { AgentSessionMessage as AgentSessionMessageType } from "@/common/features/agents/agent-sessions/shared/agent-session-messages/agent-session-messages.models"

export function SourcesTool({
  toolCall,
}: {
  toolCall: NonNullable<AgentSessionMessageType["toolCalls"]>[number]
}) {
  const { t } = useTranslation()
  const sources = toolCall.arguments.sources as unknown as {
    documentId: string
    chunks: {
      chunkId: string
      partialContent: string
    }[]
  }[]

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground text-xs">
          {t("agent:source", { count: sources.length })}: ({sources.length})
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start" sideOffset={-4}>
        <Label className="text-base font-semibold">
          {t("agent:source", { count: sources.length })}: ({sources.length})
        </Label>

        {sources.map((source) => (
          <div key={source.documentId} className="grid grid-cols-1 gap-4">
            {source.chunks.map((chunk) => (
              <Item variant="muted" className="mt-2" key={chunk.chunkId}>
                <ItemTitle>{chunk.partialContent}</ItemTitle>
              </Item>
            ))}
          </div>
        ))}
      </PopoverContent>
    </Popover>
  )
}
