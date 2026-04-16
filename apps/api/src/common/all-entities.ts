// Registering all entities in one place is convenient because it makes TypeORM metadata
// deterministic across app variants (API, workers, tests) and avoids
// "hidden"  runtime failures from missing relation targets.

import { Activity } from "@/domains/activities/activity.entity"
import { Agent } from "@/domains/agents/agent.entity"
import { ConversationAgentSession } from "@/domains/agents/conversation-agent-sessions/conversation-agent-session.entity"
import { ExtractionAgentSession } from "@/domains/agents/extraction-agent-sessions/extraction-agent-session.entity"
import { FormAgentSession } from "@/domains/agents/form-agent-sessions/form-agent-session.entity"
import { AgentMembership } from "@/domains/agents/memberships/agent-membership.entity"
import { AgentMessage } from "@/domains/agents/shared/agent-session-messages/agent-message.entity"
import { AgentMessageFeedback } from "@/domains/agents/shared/agent-session-messages/feedback/agent-message-feedback.entity"
import { Document } from "@/domains/documents/document.entity"
import { DocumentTag } from "@/domains/documents/tags/document-tag.entity"
import { Evaluation } from "@/domains/evaluations/evaluation.entity"
import { EvaluationExtractionDataset } from "@/domains/evaluations/extraction/datasets/evaluation-extraction-dataset.entity"
import { EvaluationExtractionDatasetDocument } from "@/domains/evaluations/extraction/datasets/evaluation-extraction-dataset-document.entity"
import { EvaluationExtractionDatasetRecord } from "@/domains/evaluations/extraction/datasets/records/evaluation-extraction-dataset-record.entity"
import { EvaluationExtractionRun } from "@/domains/evaluations/extraction/runs/evaluation-extraction-run.entity"
import { EvaluationExtractionRunRecord } from "@/domains/evaluations/extraction/runs/records/evaluation-extraction-run-record.entity"
import { EvaluationReport } from "@/domains/evaluations/reports/evaluation-report.entity"
import { FeatureFlag } from "@/domains/feature-flags/feature-flag.entity"
import { AgentMcpServer } from "@/domains/mcp-servers/agent-mcp-server.entity"
import { McpServer } from "@/domains/mcp-servers/mcp-server.entity"
import { OrganizationMembership } from "@/domains/organizations/memberships/organization-membership.entity"
import { Organization } from "@/domains/organizations/organization.entity"
import { ProjectMembership } from "@/domains/projects/memberships/project-membership.entity"
import { Project } from "@/domains/projects/project.entity"
import { User } from "@/domains/users/user.entity"

export const ALL_ENTITIES = [
  Activity,
  Agent,
  AgentMcpServer,
  AgentMembership,
  AgentMessage,
  AgentMessageFeedback,
  ConversationAgentSession,
  Document,
  DocumentTag,
  Evaluation,
  EvaluationExtractionDataset,
  EvaluationExtractionDatasetRecord,
  EvaluationExtractionDatasetDocument,
  EvaluationReport,
  EvaluationExtractionRun,
  EvaluationExtractionRunRecord,
  ExtractionAgentSession,
  FeatureFlag,
  FormAgentSession,
  McpServer,
  Organization,
  OrganizationMembership,
  Project,
  ProjectMembership,
  User,
]
