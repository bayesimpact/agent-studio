import { toast } from "sonner"
import {
  selectChatTemplatesError,
  selectChatTemplatesStatus,
} from "@/features/chat-templates/chat-templates.selectors"
import { createChatTemplate } from "@/features/chat-templates/chat-templates.thunks"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { ChatTemplateForm } from "./ChatTemplateForm"

interface CreateChatTemplateFormProps {
  projectId: string
  onSuccess?: () => void
}

export function CreateChatTemplateForm({ projectId, onSuccess }: CreateChatTemplateFormProps) {
  const dispatch = useAppDispatch()
  const status = useAppSelector(selectChatTemplatesStatus)
  const error = useAppSelector(selectChatTemplatesError)

  const handleSubmit = async (data: { name: string; defaultPrompt: string }) => {
    try {
      await dispatch(
        createChatTemplate({
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
    <ChatTemplateForm
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
