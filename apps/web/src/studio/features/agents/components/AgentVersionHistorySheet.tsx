import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@caseai-connect/ui/shad/sheet"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import type { Agent } from "@/common/features/agents/agents.models"
import { AsyncRoute } from "@/common/routes/AsyncRoute"
import { useAppSelector } from "@/common/store/hooks"
import { selectAgentHistoryData } from "../agent-history.selectors"
import { AgentVersionExplorer } from "./AgentVersionExplorer"

/**
 * Side sheet holding the revision timeline, per-field diffs and restore. Shared by the
 * editor's history button and the revision badges in the playground, which open it
 * preselected on the revision they label.
 *
 * Two ways to open it: pass a `trigger` element (uncontrolled), or own the state with
 * `open`/`onOpenChange` and render your own button (controlled). The trigger must be a
 * single element that forwards props to a DOM node — wrappers like a Radix `Tooltip`
 * root swallow the injected click handler, so tooltips go around the trigger's button,
 * or the caller uses the controlled mode instead.
 */
export function AgentVersionHistorySheet({
  agent,
  trigger,
  initialRevision,
  open,
  onOpenChange,
}: {
  agent: Agent
  trigger?: React.ReactElement
  initialRevision?: number
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const [internalOpen, setInternalOpen] = useState(false)
  const history = useAppSelector(selectAgentHistoryData)

  return (
    <Sheet open={open ?? internalOpen} onOpenChange={onOpenChange ?? setInternalOpen}>
      {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
      <SheetContent side="right" className="w-full gap-0 sm:max-w-4xl">
        <SheetHeader className="border-b">
          <SheetTitle>{t("agent:history.title")}</SheetTitle>
          <SheetDescription>
            {t("agent:history.description", { name: agent.name })}
          </SheetDescription>
        </SheetHeader>

        <AsyncRoute data={[history]}>
          <AgentVersionExplorer initialRevision={initialRevision} />
        </AsyncRoute>
      </SheetContent>
    </Sheet>
  )
}
