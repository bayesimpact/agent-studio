import type { RequestPayload, ResponseData } from "../generic"
import { defineRoute } from "../helpers"
import type { AcceptInvitationRequestDto, AcceptInvitationResponseDto } from "./invitations.dto"

export const InvitationsRoutes = {
  acceptOne: defineRoute<
    ResponseData<AcceptInvitationResponseDto>,
    RequestPayload<AcceptInvitationRequestDto>
  >({
    method: "post",
    path: "invitations/accept",
  }),
}
