import { toast } from "sonner"
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

  const handleSubmit = async (data: { name: string; defaultPrompt: string }) => {
    try {
      await dispatch(
        createChatBot({
          name: data.name,
          defaultPrompt: data.defaultPrompt,
          projectId,
        }),
      ).unwrap()
      toast.success("Chat template created successfully!")
      onSuccess?.()
    } catch (err) {
      const errorMessage =
        (err as { message?: string })?.message || "Failed to create chat template"
      toast.error(errorMessage)
    }
  }

  const isLoading = status === "loading"

  return (
    <ChatBotForm
      defaultName=""
      defaultPrompt=""
      isLoading={isLoading}
      error={error}
      onSubmit={handleSubmit}
      submitLabelIdle="Create Chat Template"
      submitLabelLoading="Creating..."
    />
  )
}
