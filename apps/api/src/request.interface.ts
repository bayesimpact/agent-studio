import type { Document } from "./domains/documents/document.entity"
import type { UserMembership } from "./domains/organizations/user-membership.entity"
import type { Project } from "./domains/projects/project.entity"
import type { User } from "./domains/users/user.entity"
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
  jwtPayload: JwtPayload
  user: User
}

export interface EndpointRequestWithUserMembership extends EndpointRequest {
  userMembership: UserMembership
  organizationId: string
}

export interface EndpointRequestWithProject extends EndpointRequestWithUserMembership {
  project: Project
}

export interface EndpointRequestWithDocument extends EndpointRequestWithProject {
  document: Document
}
