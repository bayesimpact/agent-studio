import type { Agent } from "@/domains/agents/agent.entity"
import type { ConversationAgentSession } from "@/domains/agents/conversation-agent-sessions/conversation-agent-session.entity"
import type { FormAgentSession } from "@/domains/agents/form-agent-sessions/form-agent-session.entity"
import type { Document } from "@/domains/documents/document.entity"
import type { DocumentTag } from "@/domains/documents/tags/document-tag.entity"
import type { Evaluation } from "@/domains/evaluations/evaluation.entity"
import type { EvaluationReport } from "@/domains/evaluations/reports/evaluation-report.entity"
import type { UserMembership } from "@/domains/organizations/user-membership.entity"
import type { ProjectMembership } from "@/domains/projects/memberships/project-membership.entity"
import type { Project } from "@/domains/projects/project.entity"
import type { User } from "@/domains/users/user.entity"

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
  projectMembership: ProjectMembership | undefined
}

export interface EndpointRequestWithDocument extends EndpointRequestWithProject {
  document: Document
}

export interface EndpointRequestWithDocumentTag extends EndpointRequestWithProject {
  documentTag: DocumentTag
}

export interface EndpointRequestWithProjectMembership extends EndpointRequestWithProject {
  projectMembership: ProjectMembership
}

export interface EndpointRequestWithAgent extends EndpointRequestWithProject {
  agent: Agent
}
export interface EndpointRequestWithAgentSession extends EndpointRequestWithAgent {
  agentSession: ConversationAgentSession | FormAgentSession
}

export interface EndpointRequestWithEvaluation extends EndpointRequestWithProject {
  evaluation: Evaluation
}

export interface EndpointRequestWithEvaluationReport extends EndpointRequestWithEvaluation {
  evaluationReport: EvaluationReport
}
