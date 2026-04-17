import { Button } from "@caseai-connect/ui/shad/button"
import { Dialog, DialogContent, DialogFooter } from "@caseai-connect/ui/shad/dialog"
import { Item, ItemContent, ItemHeader, ItemTitle } from "@caseai-connect/ui/shad/item"
import { Label } from "@caseai-connect/ui/shad/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@caseai-connect/ui/shad/select"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import type { Agent } from "@/common/features/agents/agents.models"
import { useAppDispatch } from "@/common/store/hooks"
import { createEvaluationReport } from "@/studio/features/evaluation-reports/evaluation-reports.thunks"

export function EvaluationExtractionRunner({
  ids,
  modalHandler,
  agents,
}: {
  ids: string[]
  modalHandler: { open: boolean; setOpen: (open: boolean) => void }
  agents: Agent[]
}) {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>()

  const handleRun = () => {
    if (!selectedAgentId) return
    ids.map((evaluationId) =>
      dispatch(createEvaluationReport({ agentId: selectedAgentId, evaluationId })),
    )
    modalHandler.setOpen(false)
  }
  return (
    <Dialog open={modalHandler.open} onOpenChange={modalHandler.setOpen}>
      <DialogContent>
        <Label className="text-base">{t("agent:selectAgent")}</Label>
        <Select value={selectedAgentId} onValueChange={(value) => setSelectedAgentId(value)}>
          <SelectTrigger id="evaluation-agent" className="w-full">
            <SelectValue placeholder={t("agent:selectAgent")} />
          </SelectTrigger>
          <SelectContent>
            {agents.map((agent) => (
              <SelectItem key={agent.id} value={agent.id}>
                {agent.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedAgentId && <AgentInfo agent={agents.find((a) => a.id === selectedAgentId)!} />}

        <DialogFooter>
          <Button onClick={handleRun}>{t("evaluation:run")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AgentInfo({ agent }: { agent: Agent }) {
  const { t } = useTranslation("agent")
  return (
    <Item variant="muted">
      <ItemHeader>
        <ItemTitle className="text-base">{t("settings")}</ItemTitle>
      </ItemHeader>
      <ItemContent>
        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            <Label>{t("props.locale", { colon: true })}</Label>
            <span>{agent.locale}</span>
          </div>
          <div className="flex gap-1">
            <Label>{t("props.model", { colon: true })}</Label>
            <span>{agent.model}</span>
          </div>
          <div className="flex gap-1">
            <Label>{t("props.temperature", { colon: true })}</Label>
            <span>{agent.temperature}</span>
          </div>
        </div>
      </ItemContent>
    </Item>
  )
}
