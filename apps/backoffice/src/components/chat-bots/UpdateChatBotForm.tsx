import type { ChatBotDto } from "@caseai-connect/api-contracts"
import { toast } from "sonner"
import { selectChatBotsError, selectChatBotsStatus } from "@/features/chat-bots/chat-bots.selectors"
import { updateChatBot } from "@/features/chat-bots/chat-bots.thunks"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { ChatBotForm } from "./ChatBotForm"

interface UpdateChatBotFormProps {
  chatBot: ChatBotDto
  onSuccess?: () => void
}

export function UpdateChatBotForm({ chatBot, onSuccess }: UpdateChatBotFormProps) {
  const dispatch = useAppDispatch()
  const status = useAppSelector(selectChatBotsStatus)
  const error = useAppSelector(selectChatBotsError)

  const handleSubmit = async (data: { name: string; defaultPrompt: string }) => {
    try {
      await dispatch(
        updateChatBot({
          chatBotId: chatBot.id,
          payload: {
            name: data.name,
            defaultPrompt: data.defaultPrompt,
          },
        }),
      ).unwrap()
      toast.success("ChatBot updated successfully!")
      onSuccess?.()
    } catch (err) {
      const errorMessage = (err as { message?: string })?.message || "Failed to update chat bot"
      toast.error(errorMessage)
    }
  }

  const isLoading = status === "loading"

  return (
    <ChatBotForm
      defaultValues={{
        name: chatBot.name,
        defaultPrompt: chatBot.defaultPrompt,
      }}
      isLoading={isLoading}
      error={error}
      onSubmit={handleSubmit}
      submitLabelIdle="Update ChatBot"
      submitLabelLoading="Updating..."
    />
  )
}
