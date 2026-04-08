import { Button } from "@caseai-connect/ui/shad/button"
import { Item, ItemTitle } from "@caseai-connect/ui/shad/item"
import { Label } from "@caseai-connect/ui/shad/label"
import { Popover, PopoverContent, PopoverTrigger } from "@caseai-connect/ui/shad/popover"
import type { AgentSessionMessage as AgentSessionMessageType } from "@/features/agents/agent-sessions/shared/agent-session-messages/agent-session-messages.models"

export function SourcesTool({
  toolCall,
}: {
  toolCall: NonNullable<AgentSessionMessageType["toolCalls"]>[number]
}) {
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
        <Button
          variant="link"
          size="sm"
          className="text-muted-foreground text-xs p-0 font-normal hover:text-inherit data-[state=open]:text-inherit data-[state=open]:font-medium data-[state=open]:underline"
        >
          ({sources.length})
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start" sideOffset={-4}>
        {sources.length > 1 && <Label className="text-base font-semibold">Sources</Label>}
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
