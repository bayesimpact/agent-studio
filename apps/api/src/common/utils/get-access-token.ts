import { NotFoundException } from "@nestjs/common/exceptions"

export function getAccessToken(authorization?: string) {
  const accessToken = authorization?.replace(/^Bearer /i, "")
  if (!accessToken) throw new NotFoundException("No access token provided")
  return accessToken
}
