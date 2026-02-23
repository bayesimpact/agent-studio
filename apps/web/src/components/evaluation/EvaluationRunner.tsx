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
import type { Agent } from "@/features/agents/agents.models"

export function EvaluationRunner({
  ids,
  modalHandler,
  agents,
}: {
  ids: string[]
  modalHandler: { open: boolean; setOpen: (open: boolean) => void }
  agents: Agent[]
}) {
  const { t: tCommon } = useTranslation("common")
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>()

  const handleRun = () => {
    if (!selectedAgentId) return
    const agent = agents.find((a) => a.id === selectedAgentId)
    if (!agent) return
    console.warn("AJ: agent", agent)
    console.warn("AJ: ids", ids)
  }
  return (
    <Dialog open={modalHandler.open} onOpenChange={modalHandler.setOpen}>
      <DialogContent>
        <Label className="text-base">{tCommon("selectAgent")}</Label>
        <Select value={selectedAgentId} onValueChange={(value) => setSelectedAgentId(value)}>
          <SelectTrigger id="evaluation-agent" className="w-full">
            <SelectValue placeholder={tCommon("selectAgent")} />
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
          <Button onClick={handleRun}>{tCommon("run")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AgentInfo({ agent }: { agent: Agent }) {
  const { t } = useTranslation("agent", { keyPrefix: "form" })
  const { t: tCommon } = useTranslation("common")
  return (
    <Item variant="muted">
      <ItemHeader>
        <ItemTitle className="text-base">{tCommon("settings")}</ItemTitle>
      </ItemHeader>
      <ItemContent>
        <div className="flex flex-col gap-1">
          <div className="flex gap-2">
            <Label>{t("labelLocale")}</Label>
            <span className="italic">{agent.locale}</span>
          </div>
          <div className="flex gap-2">
            <Label>{t("labelModel")}</Label>
            <span className="italic">{agent.model}</span>
          </div>
          <div className="flex gap-2">
            <Label>{t("labelTemperature")}</Label>
            <span className="italic">{agent.temperature}</span>
          </div>
        </div>
      </ItemContent>
    </Item>
  )
}
