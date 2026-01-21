export type CreateChatBotRequestDto = {
  name: string
  defaultPrompt: string
  projectId: string
}

export type CreateChatBotResponseDto = {
  id: string
  name: string
  defaultPrompt: string
  projectId: string
}
