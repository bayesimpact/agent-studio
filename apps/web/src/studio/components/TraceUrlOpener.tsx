import { Button } from "@caseai-connect/ui/shad/button"
import { ExternalLinkIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { useAbility } from "@/hooks/use-ability"

export function TraceUrlOpener({
  traceUrl,
  buttonProps,
}: {
  traceUrl?: string
  buttonProps?: React.ComponentProps<typeof Button>
}) {
  const { isPremiumMember } = useAbility()
  const [isShown, setIsShown] = useState(false)

  useEffect(() => {
    if (!isPremiumMember) return

    function keyDownHandler(e: globalThis.KeyboardEvent) {
      if (traceUrl && e.key === "Control") {
        e.preventDefault()
        setIsShown((state) => !state)
      }
    }
    // Remove any existing listener before adding a new one
    document.removeEventListener("keydown", keyDownHandler)
    document.addEventListener("keydown", keyDownHandler)
    return () => document.removeEventListener("keydown", keyDownHandler)
  }, [traceUrl, isPremiumMember])

  if (!traceUrl || !isPremiumMember || !isShown) return null
  return (
    <Button asChild variant="ghost" {...buttonProps}>
      <a href={traceUrl} className="cursor-pointer" target="_blank" rel="noreferrer">
        Trace Url
        <ExternalLinkIcon className="size-4" />
      </a>
    </Button>
  )
}
