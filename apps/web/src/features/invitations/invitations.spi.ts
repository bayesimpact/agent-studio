export interface IInvitationsSpi {
  acceptProjectInvitation: (ticketId: string) => Promise<void>
  acceptAgentInvitation: (ticketId: string) => Promise<void>
}
