import { useTranslation } from "react-i18next"
import type { Agent } from "@/features/agents/agents.models"
import { selectAgentsError, selectAgentsStatus } from "@/features/agents/agents.selectors"
import { updateAgent } from "@/features/agents/agents.thunks"
import { ADS } from "@/store/async-data-status"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { AgentForm } from "./AgentForm"

interface UpdateAgentFormProps {
  agent: Agent
  onSuccess?: () => void
}

export function UpdateAgentForm({ agent, onSuccess }: UpdateAgentFormProps) {
  const { t } = useTranslation("agent", { keyPrefix: "update" })
  const dispatch = useAppDispatch()
  const status = useAppSelector(selectAgentsStatus)
  const error = useAppSelector(selectAgentsError)

  const handleSubmit = (
    fields: Partial<Pick<Agent, "name" | "defaultPrompt" | "model" | "temperature" | "locale">>,
  ) => {
    dispatch(
      updateAgent({
        projectId: agent.projectId,
        agentId: agent.id,
        fields,
      }),
    )
    onSuccess?.()
  }

  const isLoading = ADS.isLoading(status)

  return (
    <AgentForm
      defaultValues={{
        name: agent.name,
        defaultPrompt: agent.defaultPrompt,
        model: agent.model,
        temperature: agent.temperature,
        locale: agent.locale,
      }}
      isLoading={isLoading}
      error={error}
      onSubmit={handleSubmit}
      submitLabelIdle={t("submit")}
      submitLabelLoading={t("submitting")}
    />
  )
}
