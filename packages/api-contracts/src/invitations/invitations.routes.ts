import type { RequestPayload, ResponseData, SuccessResponseDTO } from "../generic"
import { defineRoute } from "../helpers"

export const InvitationsRoutes = {
  acceptOne: defineRoute<ResponseData<SuccessResponseDTO>, RequestPayload<{ ticketId: string }>>({
    method: "post",
    path: "invitations/accept",
  }),
}
