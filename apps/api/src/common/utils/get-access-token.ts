import { UnauthorizedException } from "@nestjs/common/exceptions"

export function getAccessToken(authorization?: string) {
  const accessToken = authorization?.replace(/^Bearer /i, "")
  if (!accessToken) throw new UnauthorizedException("No access token provided")
  return accessToken
}
