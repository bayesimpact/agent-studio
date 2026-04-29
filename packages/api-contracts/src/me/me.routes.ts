import type { ResponseData } from "../generic"
import { defineRoute } from "../helpers"
import type { MeResponseDto, PendingInvitationsResponseDto } from "./me.dto"

export const MeRoutes = {
  getMe: defineRoute<ResponseData<MeResponseDto>>({
    path: "me",
    method: "get",
  }),
  getPendingInvitations: defineRoute<ResponseData<PendingInvitationsResponseDto>>({
    path: "me/pending-invitations",
    method: "get",
  }),
}
