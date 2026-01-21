export type CreateChatTemplateRequestDto = {
  name: string
  defaultPrompt: string
  projectId: string
}

export type CreateChatTemplateResponseDto = {
  id: string
  name: string
  defaultPrompt: string
  projectId: string
}
