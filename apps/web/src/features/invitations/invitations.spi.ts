export interface IInvitationsSpi {
  acceptInvitation: (ticketId: string) => Promise<void>
}
