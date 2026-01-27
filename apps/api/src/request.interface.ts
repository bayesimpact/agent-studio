import type { TimeType } from "@caseai-connect/api-contracts"

export interface JwtPayload {
  sub: string
  iss: string
  aud: string[]
  iat: number
  exp: number
  azp: string
  scope: string
}

export interface EndpointRequest {
  user: JwtPayload & {
    id: string
    auth0Id: string
    email: string
    name: string
    pictureUrl?: string
    createdAt: TimeType
    updatedAt: TimeType
    memberships?: []
  }
}
