import { AgentSessionMessagesRoutes } from "@caseai-connect/api-contracts"

/**
 * The stream is a GET, so its payload travels JSON-encoded in `?q=`.
 *
 * The conditional spread on `agentSettingsRevision` keeps the object honest for anything reading
 * it here; it makes no difference on the wire, since `JSON.stringify` drops `undefined` values
 * either way and the API cannot tell an omitted field from one explicitly set to `undefined`.
 */
export function buildStreamUrl({
  baseURL,
  organizationId,
  projectId,
  agentId,
  agentSessionId,
  content,
  attachmentDocumentId,
  agentSettingsRevision,
}: {
  baseURL: string
  organizationId: string
  projectId: string
  agentId: string
  agentSessionId: string
  content: string
  attachmentDocumentId?: string
  agentSettingsRevision?: number
}): string {
  const body = {
    payload: {
      content,
      attachmentDocumentId,
      ...(agentSettingsRevision !== undefined && { agentSettingsRevision }),
    },
  } satisfies typeof AgentSessionMessagesRoutes.stream.request
  const path = AgentSessionMessagesRoutes.stream.getPath({
    organizationId,
    projectId,
    agentId,
    agentSessionId,
  })
  return `${baseURL}${path}?q=${encodeURIComponent(JSON.stringify(body))}`
}
