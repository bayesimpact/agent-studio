import { Injectable, InternalServerErrorException } from "@nestjs/common"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { ConfigService } from "@nestjs/config"
import type { InvitationSender, SendInvitationParams } from "./invitation-sender.interface"

@Injectable()
export class Auth0InvitationSenderService implements InvitationSender {
  private cachedToken: { token: string; expiresAt: number } | null = null

  constructor(private readonly configService: ConfigService) {}

  async sendInvitation(params: SendInvitationParams): Promise<void> {
    const domain = this.getDomain()
    const orgId = this.configService.getOrThrow<string>("AUTH0_ORGANIZATION_ID")
    const clientId = this.configService.getOrThrow<string>("AUTH0_CLIENT_ID")
    const accessToken = await this.getManagementToken()

    const response = await fetch(`https://${domain}/api/v2/organizations/${orgId}/invitations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        inviter: { name: params.inviterName },
        invitee: { email: params.inviteeEmail },
        client_id: clientId,
        send_invitation_email: true,
        ...(params.metadata && { user_metadata: params.metadata }),
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      throw new InternalServerErrorException(
        `Failed to send Auth0 invitation: ${response.status} ${errorBody}`,
      )
    }
  }

  private async getManagementToken(): Promise<string> {
    if (!this.isTokenExpired()) {
      return this.cachedToken!.token
    }

    const domain = this.getDomain()
    const clientId = this.configService.getOrThrow<string>("AUTH0_M2M_CLIENT_ID")
    const clientSecret = this.configService.getOrThrow<string>("AUTH0_M2M_CLIENT_SECRET")

    const response = await fetch(`https://${domain}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        audience: `https://${domain}/api/v2/`,
        grant_type: "client_credentials",
      }),
    })

    if (!response.ok) {
      throw new InternalServerErrorException("Failed to obtain Auth0 Management API token")
    }

    const data = (await response.json()) as { access_token: string; expires_in: number }
    this.cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    }

    return this.cachedToken.token
  }

  private getDomain(): string {
    const issuerUrl = this.configService.getOrThrow<string>("AUTH0_ISSUER_URL")
    return issuerUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")
  }

  private isTokenExpired(): boolean {
    if (!this.cachedToken) return true
    // Refresh 60 seconds before actual expiry
    return Date.now() >= this.cachedToken.expiresAt - 60_000
  }
}
