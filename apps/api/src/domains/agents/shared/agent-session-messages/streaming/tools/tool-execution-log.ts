export enum ToolName {
  FillForm = "fillForm",
  RetrieveProjectDocumentChunks = "retrieveProjectDocumentChunks",
  Sources = "sources",
}

export type ToolExecutionLog = {
  toolName: ToolName
  arguments: Record<string, unknown>
}
