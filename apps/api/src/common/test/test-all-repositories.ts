import type { ObjectLiteral, Repository } from "typeorm"
import { Activity } from "@/domains/activities/activity.entity"
import { Agent } from "@/domains/agents/agent.entity"
import { ConversationAgentSession } from "@/domains/agents/conversation-agent-sessions/conversation-agent-session.entity"
import { ExtractionAgentSession } from "@/domains/agents/extraction-agent-sessions/extraction-agent-session.entity"
import { FormAgentSession } from "@/domains/agents/form-agent-sessions/form-agent-session.entity"
import { AgentMembership } from "@/domains/agents/memberships/agent-membership.entity"
import { AgentMessage } from "@/domains/agents/shared/agent-session-messages/agent-message.entity"
import { AgentMessageFeedback } from "@/domains/agents/shared/agent-session-messages/feedback/agent-message-feedback.entity"
import { Document } from "@/domains/documents/document.entity"
import { Evaluation } from "@/domains/evaluations/evaluation.entity"
import { EvaluationReport } from "@/domains/evaluations/reports/evaluation-report.entity"
import { FeatureFlag } from "@/domains/feature-flags/feature-flag.entity"
import { OrganizationMembership } from "@/domains/organizations/memberships/organization-membership.entity"
import { Organization } from "@/domains/organizations/organization.entity"
import { ProjectMembership } from "@/domains/projects/memberships/project-membership.entity"
import { Project } from "@/domains/projects/project.entity"
import { User } from "@/domains/users/user.entity"

export type AllRepositories = {
  activityRepository: Repository<Activity>
  agentMessageFeedbackRepository: Repository<AgentMessageFeedback>
  agentMessageRepository: Repository<AgentMessage>
  agentRepository: Repository<Agent>
  agentMembershipRepository: Repository<AgentMembership>
  extractionAgentSessionRepository: Repository<ExtractionAgentSession>
  conversationAgentSessionRepository: Repository<ConversationAgentSession>
  formAgentSessionRepository: Repository<FormAgentSession>
  documentRepository: Repository<Document>
  evaluationReportRepository: Repository<EvaluationReport>
  evaluationRepository: Repository<Evaluation>
  organizationMembershipRepository: Repository<OrganizationMembership>
  organizationRepository: Repository<Organization>
  projectMembershipRepository: Repository<ProjectMembership>
  projectRepository: Repository<Project>
  userRepository: Repository<User>
  featureFlagRepository: Repository<FeatureFlag>
}

export function buildAllRepositories(
  getRepository: <T extends ObjectLiteral>(entity: new () => T) => Repository<T>,
): AllRepositories {
  return {
    activityRepository: getRepository(Activity),
    userRepository: getRepository(User),
    organizationRepository: getRepository(Organization),
    organizationMembershipRepository: getRepository(OrganizationMembership),
    projectRepository: getRepository(Project),
    projectMembershipRepository: getRepository(ProjectMembership),
    agentRepository: getRepository(Agent),
    extractionAgentSessionRepository: getRepository(ExtractionAgentSession),
    conversationAgentSessionRepository: getRepository(ConversationAgentSession),
    formAgentSessionRepository: getRepository(FormAgentSession),
    agentMessageRepository: getRepository(AgentMessage),
    agentMessageFeedbackRepository: getRepository(AgentMessageFeedback),
    documentRepository: getRepository(Document),
    evaluationRepository: getRepository(Evaluation),
    evaluationReportRepository: getRepository(EvaluationReport),
    agentMembershipRepository: getRepository(AgentMembership),
    featureFlagRepository: getRepository(FeatureFlag),
  }
}
