import { Agent } from "@/domains/agents/agent.entity"
import { ExtractionAgentSession } from "@/domains/agents/extraction-agent-sessions/extraction-agent-session.entity"
import { ConversationAgentSession } from "@/domains/conversation-agent-sessions/conversation-agent-session.entity"
import { AgentMessage } from "@/domains/conversation-agent-sessions/messages/agent-message.entity"
import { AgentMessageFeedback } from "@/domains/conversation-agent-sessions/messages/feedback/agent-message-feedback.entity"
import { Document } from "@/domains/documents/document.entity"
import { Evaluation } from "@/domains/evaluations/evaluation.entity"
import { EvaluationReport } from "@/domains/evaluations/reports/evaluation-report.entity"
import { FeatureFlag } from "@/domains/feature-flags/feature-flag.entity"
import { Organization } from "@/domains/organizations/organization.entity"
import { UserMembership } from "@/domains/organizations/user-membership.entity"
import { ProjectMembership } from "@/domains/projects/memberships/project-membership.entity"
import { Project } from "@/domains/projects/project.entity"
import { User } from "@/domains/users/user.entity"

export const TEST_ENTITIES = [
  Agent,
  AgentMessage,
  AgentMessageFeedback,
  ConversationAgentSession,
  ExtractionAgentSession,
  Document,
  Evaluation,
  EvaluationReport,
  Organization,
  Project,
  ProjectMembership,
  FeatureFlag,
  User,
  UserMembership,
]
