import { Injectable } from "@nestjs/common"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { ConfigService } from "@nestjs/config"

export interface Auth0UserInfoResponse {
  sub: string
  email?: string
  name?: string
  picture?: string
  email_verified?: boolean
  nickname?: string
  given_name?: string
  family_name?: string
}

@Injectable()
export class Auth0UserInfoService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Fetches user information from Auth0's UserInfo endpoint
   * @param accessToken The JWT access token from the request
   * @returns User information from Auth0
   */
  async getUserInfo(accessToken: string): Promise<Auth0UserInfoResponse> {
    const issuerUrl = this.configService.get<string>("AUTH0_ISSUER_URL")
    if (!issuerUrl) {
      throw new Error("AUTH0_ISSUER_URL is not configured")
    }

    // Remove trailing slash if present
    const baseUrl = issuerUrl.replace(/\/$/, "")
    const userInfoUrl = `${baseUrl}/userinfo`
    const response = await fetch(userInfoUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to fetch user info from Auth0: ${response.status} ${errorText}`)
    }

    const userInfo = (await response.json()) as Auth0UserInfoResponse
    return userInfo
  }
}
