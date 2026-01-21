import type { ChatTemplateDto } from "@caseai-connect/api-contracts"
import { toast } from "sonner"
import {
  selectChatTemplatesError,
  selectChatTemplatesStatus,
} from "@/features/chat-templates/chat-templates.selectors"
import { updateChatTemplate } from "@/features/chat-templates/chat-templates.thunks"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { ChatTemplateForm } from "./ChatTemplateForm"

interface UpdateChatTemplateFormProps {
  chatTemplate: ChatTemplateDto
  onSuccess?: () => void
}

export function UpdateChatTemplateForm({ chatTemplate, onSuccess }: UpdateChatTemplateFormProps) {
  const dispatch = useAppDispatch()
  const status = useAppSelector(selectChatTemplatesStatus)
  const error = useAppSelector(selectChatTemplatesError)

  const handleSubmit = async (data: { name: string; defaultPrompt: string }) => {
    try {
      await dispatch(
        updateChatTemplate({
          chatTemplateId: chatTemplate.id,
          payload: {
            name: data.name,
            defaultPrompt: data.defaultPrompt,
          },
        }),
      ).unwrap()
      toast.success("Chat template updated successfully!")
      onSuccess?.()
    } catch (err) {
      const errorMessage =
        (err as { message?: string })?.message || "Failed to update chat template"
      toast.error(errorMessage)
    }
  }

  const isLoading = status === "loading"

  return (
    <ChatTemplateForm
      defaultName={chatTemplate.name}
      defaultPrompt={chatTemplate.defaultPrompt}
      isLoading={isLoading}
      error={error}
      onSubmit={handleSubmit}
      submitLabelIdle="Update Chat Template"
      submitLabelLoading="Updating..."
    />
  )
}
