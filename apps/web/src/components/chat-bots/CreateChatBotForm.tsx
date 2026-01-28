import { selectChatBotsError, selectChatBotsStatus } from "@/features/chat-bots/chat-bots.selectors"
import { createChatBot } from "@/features/chat-bots/chat-bots.thunks"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { ChatBotForm } from "./ChatBotForm"

interface CreateChatBotFormProps {
  projectId: string
  onSuccess?: () => void
}

export function CreateChatBotForm({ projectId, onSuccess }: CreateChatBotFormProps) {
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

  const isLoading = status === "loading"

  return (
    <ChatBotForm
      isLoading={isLoading}
      error={error}
      onSubmit={handleSubmit}
      submitLabelIdle="Create ChatBot"
      submitLabelLoading="Creating..."
    />
  )
}
