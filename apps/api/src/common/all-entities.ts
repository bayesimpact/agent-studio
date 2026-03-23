// Registering all entities in one place is convenient because it makes TypeORM metadata
// deterministic across app variants (API, workers, tests) and avoids
// "hidden"  runtime failures from missing relation targets.

import { Agent } from "@/domains/agents/agent.entity"
import { ConversationAgentSession } from "@/domains/agents/conversation-agent-sessions/conversation-agent-session.entity"
import { ExtractionAgentSession } from "@/domains/agents/extraction-agent-sessions/extraction-agent-session.entity"
import { FormAgentSession } from "@/domains/agents/form-agent-sessions/form-agent-session.entity"
import { AgentMessage } from "@/domains/agents/shared/agent-session-messages/agent-message.entity"
import { AgentMessageFeedback } from "@/domains/agents/shared/agent-session-messages/feedback/agent-message-feedback.entity"
import { Document } from "@/domains/documents/document.entity"
import { DocumentTag } from "@/domains/documents/tags/document-tag.entity"
import { Evaluation } from "@/domains/evaluations/evaluation.entity"
import { EvaluationReport } from "@/domains/evaluations/reports/evaluation-report.entity"
import { FeatureFlag } from "@/domains/feature-flags/feature-flag.entity"
import { OrganizationMembership } from "@/domains/organizations/memberships/organization-membership.entity"
import { Organization } from "@/domains/organizations/organization.entity"
import { ProjectMembership } from "@/domains/projects/memberships/project-membership.entity"
import { Project } from "@/domains/projects/project.entity"
import { User } from "@/domains/users/user.entity"

export const ALL_ENTITIES = [
  Agent,
  AgentMessage,
  AgentMessageFeedback,
  ConversationAgentSession,
  Document,
  DocumentTag,
  Evaluation,
  EvaluationReport,
  ExtractionAgentSession,
  FeatureFlag,
  FormAgentSession,
  Organization,
  Project,
  ProjectMembership,
  User,
  OrganizationMembership,
]
