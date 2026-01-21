export type UpdateChatTemplateRequestDto = {
  name?: string
  defaultPrompt?: string
}

export type UpdateChatTemplateResponseDto = {
  id: string
  name: string
  defaultPrompt: string
  projectId: string
}
