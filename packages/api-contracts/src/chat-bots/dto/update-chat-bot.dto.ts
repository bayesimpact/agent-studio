export type UpdateChatBotRequestDto = {
  name?: string
  defaultPrompt?: string
}

export type UpdateChatBotResponseDto = {
  id: string
  name: string
  defaultPrompt: string
  projectId: string
}
