import type { RequestPayload, ResponseData, SuccessResponseDTO } from "../generic"
import { defineRoute } from "../helpers"

export const InvitationsRoutes = {
  acceptProjectOne: defineRoute<
    ResponseData<SuccessResponseDTO>,
    RequestPayload<{ ticketId: string }>
  >({
    method: "post",
    path: "invitations/accept",
  }),
  acceptAgentOne: defineRoute<
    ResponseData<SuccessResponseDTO>,
    RequestPayload<{ ticketId: string }>
  >({
    method: "post",
    path: "agent-invitations/accept",
  }),
}
