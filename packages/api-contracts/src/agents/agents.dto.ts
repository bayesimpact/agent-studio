import type { TimeType } from "../generic"

export type AgentDto = {
  createdAt: TimeType
  defaultPrompt: string
  id: string
  locale: AgentLocale
  model: AgentModel
  name: string
  projectId: string
  temperature: AgentTemperature
  updatedAt: TimeType
}

export type ListAgentsResponseDto = {
  agents: AgentDto[]
}

export enum AgentModel {
  Gemini25Flash = "gemini-2.5-flash",
  Gemini25Pro = "gemini-2.5-pro",
}

export enum AgentLocale {
  EN = "en",
  FR = "fr",
}

export type AgentTemperature = number // e.g., 0.7 float value
