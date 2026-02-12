export const INVITATION_SENDER = Symbol("INVITATION_SENDER")

export interface SendInvitationParams {
  inviteeEmail: string
  inviterName: string
  metadata?: Record<string, string>
}

export interface InvitationSender {
  sendInvitation(params: SendInvitationParams): Promise<void>
}
