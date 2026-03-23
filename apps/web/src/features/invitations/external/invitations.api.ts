import { InvitationsRoutes } from "@caseai-connect/api-contracts"
import { getAxiosInstance } from "@/external/axios"
import type { IInvitationsSpi } from "../invitations.spi"

export default {
  acceptProjectInvitation: async (ticketId: string) => {
    const axios = getAxiosInstance()
    await axios.post(InvitationsRoutes.acceptProjectOne.getPath(), {
      payload: { ticketId },
    })
  },
  acceptAgentInvitation: async (ticketId: string) => {
    const axios = getAxiosInstance()
    await axios.post(InvitationsRoutes.acceptAgentOne.getPath(), {
      payload: { ticketId },
    })
  },
} satisfies IInvitationsSpi
