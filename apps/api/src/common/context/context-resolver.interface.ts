import type { EndpointRequest } from "./request.interface"
import type { ContextResource } from "./require-context.decorator"

export type ResolvableRequest = EndpointRequest & {
  params?: Record<string, string | undefined>
  organizationId?: string
}

export interface ContextResolver {
  readonly resource: ContextResource
  resolve(request: ResolvableRequest): Promise<void>
}
