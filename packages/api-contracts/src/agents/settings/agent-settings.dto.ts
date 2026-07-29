import type {
  AgentLocale,
  AgentMcpServerDto,
  AgentModel,
  AgentTemperature,
  DocumentsRagMode,
} from "../../agents/agents.dto"
import type { DocumentTagDto } from "../../document-tags/document-tag.dto"
import type { TimeType } from "../../generic"

export type AgentSettingsDto = {
  agentId: string
  createdAt: TimeType
  description?: string
  documentsRagMode: DocumentsRagMode
  documentTagIds: DocumentTagDto["id"][]
  fillFormEnabled: boolean
  greetingMessage?: string
  hasCategories?: boolean
  id: string
  instructions: string
  isArchived: boolean
  isDraft: boolean
  locale: AgentLocale
  mcpServers: AgentMcpServerDto[]
  model: AgentModel
  name?: string
  outputJsonSchema?: Record<string, unknown>
  projectAgentSessionCategoryIds: string[]
  resourceLibraryIds: string[]
  revision: number
  temperature: AgentTemperature
  updatedAt: TimeType
  usedProjectAgentSessionCategoryIds: string[]
}
