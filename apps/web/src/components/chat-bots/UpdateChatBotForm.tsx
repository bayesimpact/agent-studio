import { useTranslation } from "react-i18next"
import type { ChatBot } from "@/features/chat-bots/chat-bots.models"
import { selectChatBotsError, selectChatBotsStatus } from "@/features/chat-bots/chat-bots.selectors"
import { updateChatBot } from "@/features/chat-bots/chat-bots.thunks"
import { ADS } from "@/store/async-data-status"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { ChatBotForm } from "./ChatBotForm"

interface UpdateChatBotFormProps {
  chatBot: ChatBot
  onSuccess?: () => void
}

export function UpdateChatBotForm({ chatBot, onSuccess }: UpdateChatBotFormProps) {
  const { t } = useTranslation("chatBot", { keyPrefix: "update" })
  const dispatch = useAppDispatch()
  const status = useAppSelector(selectChatBotsStatus)
  const error = useAppSelector(selectChatBotsError)

  const handleSubmit = (
    fields: Partial<Pick<ChatBot, "name" | "defaultPrompt" | "model" | "temperature" | "locale">>,
  ) => {
    dispatch(
      updateChatBot({
        projectId: chatBot.projectId,
        chatBotId: chatBot.id,
        fields,
      }),
    )
    onSuccess?.()
  }

  const isLoading = ADS.isLoading(status)

  return (
    <ChatBotForm
      defaultValues={{
        name: chatBot.name,
        defaultPrompt: chatBot.defaultPrompt,
        model: chatBot.model,
        temperature: chatBot.temperature,
        locale: chatBot.locale,
      }}
      isLoading={isLoading}
      error={error}
      onSubmit={handleSubmit}
      submitLabelIdle={t("submit")}
      submitLabelLoading={t("submitting")}
    />
  )
}
