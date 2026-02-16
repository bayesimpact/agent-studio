export const INVITATION_SENDER = Symbol("INVITATION_SENDER")

export interface SendInvitationParams {
  inviteeEmail: string
  inviterName: string
}

export interface SendInvitationResult {
  ticketId: string
}

export interface InvitationSender {
  sendInvitation(params: SendInvitationParams): Promise<SendInvitationResult>
}
