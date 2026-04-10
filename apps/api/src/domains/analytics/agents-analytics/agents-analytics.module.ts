import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { ConversationAgentSession } from "@/domains/agents/conversation-agent-sessions/conversation-agent-session.entity"
import { AgentMessage } from "@/domains/agents/shared/agent-session-messages/agent-message.entity"
import { AgentsAnalyticsService } from "./agents-analytics.service"

@Module({
  imports: [TypeOrmModule.forFeature([ConversationAgentSession, AgentMessage])],
  providers: [AgentsAnalyticsService],
  exports: [AgentsAnalyticsService],
})
export class AgentsAnalyticsModule {}
