import { randomBytes } from "node:crypto"
import { Injectable, InternalServerErrorException } from "@nestjs/common"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { ConfigService } from "@nestjs/config"

export type Auth0ProvisionedUser = {
  email: string
  userId: string
}

type Auth0UserByEmail = {
  email: string
  user_id: string
}

type Auth0CreateUserResponse = {
  email: string
  user_id: string
}

@Injectable()
export class Auth0UserProvisioningService {
  private cachedToken: { token: string; expiresAt: number } | null = null

  constructor(private readonly configService: ConfigService) {}

  async findOrCreateUserByEmail(params: {
    email: string
    fullName?: string | null
  }): Promise<Auth0ProvisionedUser> {
    const normalizedEmail = params.email.trim().toLowerCase()
    const existingUser = await this.findUserByEmail(normalizedEmail)
    if (existingUser) {
      return { userId: existingUser.user_id, email: existingUser.email.toLowerCase() }
    }

    const createdUser = await this.createUser({
      email: normalizedEmail,
      fullName: params.fullName,
    })
    return { userId: createdUser.user_id, email: createdUser.email.toLowerCase() }
  }

  async ensureUserInDefaultOrganization(auth0UserId: string): Promise<void> {
    const domain = this.getDomain()
    const orgId = this.configService.getOrThrow<string>("AUTH0_ORGANIZATION_ID")
    const managementToken = await this.getManagementToken()

    const response = await fetch(`https://${domain}/api/v2/organizations/${orgId}/members`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${managementToken}`,
      },
      body: JSON.stringify({
        members: [auth0UserId],
      }),
    })

    if (response.ok || response.status === 409) {
      return
    }

    const errorBody = await response.text()
    throw new InternalServerErrorException(
      `Failed to add Auth0 user to default organization: ${response.status} ${errorBody}`,
    )
  }

  async sendPasswordResetEmail(email: string): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase()
    const domain = this.getDomain()
    const clientId = this.configService.getOrThrow<string>("AUTH0_CLIENT_ID")
    const connection = this.configService.getOrThrow<string>("AUTH0_DB_CONNECTION_NAME")

    const response = await fetch(`https://${domain}/dbconnections/change_password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        email: normalizedEmail,
        connection,
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      throw new InternalServerErrorException(
        `Failed to trigger password reset email: ${response.status} ${errorBody}`,
      )
    }
  }

  private async findUserByEmail(email: string): Promise<Auth0UserByEmail | null> {
    const domain = this.getDomain()
    const managementToken = await this.getManagementToken()
    const usersByEmailEndpoint = new URL(`https://${domain}/api/v2/users-by-email`)
    usersByEmailEndpoint.searchParams.set("email", email)

    const response = await fetch(usersByEmailEndpoint.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${managementToken}`,
      },
    })

    if (!response.ok) {
      const errorBody = await response.text()
      throw new InternalServerErrorException(
        `Failed to find Auth0 user by email: ${response.status} ${errorBody}`,
      )
    }

    const users = (await response.json()) as Auth0UserByEmail[]
    return users.find((user) => user.email.toLowerCase() === email) ?? null
  }

  private async createUser(params: {
    email: string
    fullName?: string | null
  }): Promise<Auth0CreateUserResponse> {
    const domain = this.getDomain()
    const managementToken = await this.getManagementToken()
    const connection = this.configService.getOrThrow<string>("AUTH0_DB_CONNECTION_NAME")
    const temporaryPassword = this.generateTemporaryPassword()

    const response = await fetch(`https://${domain}/api/v2/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${managementToken}`,
      },
      body: JSON.stringify({
        connection,
        email: params.email,
        password: temporaryPassword,
        email_verified: false,
        verify_email: false,
        app_metadata: {
          needsInvitation: true,
        },
        ...(params.fullName && { name: params.fullName }),
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      throw new InternalServerErrorException(
        `Failed to create Auth0 user: ${response.status} ${errorBody}`,
      )
    }

    return (await response.json()) as Auth0CreateUserResponse
  }

  private generateTemporaryPassword(): string {
    return `Temp-${randomBytes(8).toString("hex")}!A9`
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
    return Date.now() >= this.cachedToken.expiresAt - 60_000
  }
}
