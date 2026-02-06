import { useTranslation } from "react-i18next"
import type { Agent } from "@/features/agents/agents.models"
import { selectAgentsError, selectAgentsStatus } from "@/features/agents/agents.selectors"
import { createAgent } from "@/features/agents/agents.thunks"
import { ADS } from "@/store/async-data-status"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { AgentForm } from "./AgentForm"

interface CreateagentFormProps {
  projectId: string
  onSuccess: (agentId: string) => void
}

export function CreateAgentForm({ projectId, onSuccess }: CreateagentFormProps) {
  const { t } = useTranslation("agent", { keyPrefix: "create" })
  const dispatch = useAppDispatch()
  const status = useAppSelector(selectAgentsStatus)
  const error = useAppSelector(selectAgentsError)

  const handleSubmit = (
    fields: Pick<Agent, "defaultPrompt" | "name" | "model" | "temperature" | "locale">,
  ) => {
    dispatch(createAgent({ projectId, fields, onSuccess }))
  }

  const isLoading = ADS.isLoading(status)

  return (
    <AgentForm
      isLoading={isLoading}
      error={error}
      onSubmit={handleSubmit}
      submitLabelIdle={t("submit")}
      submitLabelLoading={t("submitting")}
    />
  )
}
