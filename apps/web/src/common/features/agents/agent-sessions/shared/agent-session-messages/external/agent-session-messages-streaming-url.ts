import { AgentSessionMessagesRoutes } from "@caseai-connect/api-contracts"

/**
 * The stream is a GET, so its payload travels JSON-encoded in `?q=`.
 *
 * `agentSettingsRevision` is omitted rather than sent as `undefined` when the caller has no
 * choice to express: the API rejects the field outright on a live session, so the absent-vs-null
 * distinction is load-bearing, not cosmetic.
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
