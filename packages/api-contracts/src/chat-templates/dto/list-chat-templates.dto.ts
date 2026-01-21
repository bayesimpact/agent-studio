import type { TimeType } from "../../generic"

export type ChatTemplateDto = {
  id: string
  name: string
  defaultPrompt: string
  projectId: string
  createdAt: TimeType
  updatedAt: TimeType
}

export type ListChatTemplatesResponseDto = {
  chatTemplates: ChatTemplateDto[]
}
