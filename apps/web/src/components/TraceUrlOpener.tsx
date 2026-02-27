import { Button } from "@caseai-connect/ui/shad/button"
import { ExternalLinkIcon } from "lucide-react"

export function TraceUrlOpener({
  traceUrl,
  buttonProps,
}: {
  traceUrl?: string
  buttonProps?: React.ComponentProps<typeof Button>
}) {
  if (!traceUrl) return null
  return (
    <Button asChild variant="ghost" {...buttonProps}>
      <a href={traceUrl} className="cursor-pointer" target="_blank" rel="noreferrer">
        Trace Url
        <ExternalLinkIcon className="size-4" />
      </a>
    </Button>
  )
}
