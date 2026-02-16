import { InvitationsRoutes } from "@caseai-connect/api-contracts"
import { getAxiosInstance } from "@/external/axios"
import type { IInvitationsSpi } from "../invitations.spi"

export default {
  acceptInvitation: async (ticketId: string) => {
    const axios = getAxiosInstance()
    await axios.post(InvitationsRoutes.acceptOne.getPath(), {
      payload: { ticketId },
    })
  },
} satisfies IInvitationsSpi
