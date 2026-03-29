import { forwardRef, Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import {
  moduleFeatures,
  moduleImports,
  moduleProviders,
} from "../base-agent-sessions/base-agent-sessions-module.helpers"
import { AgentMessagesController } from "../shared/agent-session-messages/agent-messages.controller"
import { StreamingModule } from "../shared/agent-session-messages/streaming/streaming.module"
import { ConversationAgentSessionsController } from "./conversation-agent-sessions.controller"
import { ConversationAgentSessionsService } from "./conversation-agent-sessions.service"

@Module({
  imports: [
    TypeOrmModule.forFeature([...moduleFeatures]),
    ...moduleImports,
    forwardRef(() => StreamingModule),
  ],
  providers: [...moduleProviders, ConversationAgentSessionsService],
  controllers: [AgentMessagesController, ConversationAgentSessionsController],
  exports: [ConversationAgentSessionsService],
})
export class ConversationAgentSessionsModule {}
