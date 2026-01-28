import { useTranslation } from "react-i18next"
import { selectChatBotsError, selectChatBotsStatus } from "@/features/chat-bots/chat-bots.selectors"
import { createChatBot } from "@/features/chat-bots/chat-bots.thunks"
import { ADS } from "@/store/async-data-status"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { ChatBotForm } from "./ChatBotForm"

interface CreateChatBotFormProps {
  projectId: string
  onSuccess?: () => void
}

export function CreateChatBotForm({ projectId, onSuccess }: CreateChatBotFormProps) {
  const { t } = useTranslation("chatBot", { keyPrefix: "create" })
  const dispatch = useAppDispatch()
  const status = useAppSelector(selectChatBotsStatus)
  const error = useAppSelector(selectChatBotsError)

  const handleSubmit = (data: { name: string; defaultPrompt: string }) => {
    dispatch(
      createChatBot({
        name: data.name,
        defaultPrompt: data.defaultPrompt,
        projectId,
      }),
    )
    onSuccess?.()
  }

  const isLoading = ADS.isLoading(status)

  return (
    <ChatBotForm
      isLoading={isLoading}
      error={error}
      onSubmit={handleSubmit}
      submitLabelIdle={t("submit")}
      submitLabelLoading={t("submitting")}
    />
  )
}
