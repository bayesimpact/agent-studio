import { forwardRef, Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { AgentSettingsModule } from "@/domains/agents/settings/agent-settings.module"
import { PdfPagesModule } from "@/domains/documents/pdf-pages/pdf-pages.module"
import { McpServersModule } from "@/domains/mcp-servers/mcp-servers.module"
import { McpModule } from "@/external/mcp"
import {
  moduleFeatures,
  moduleImports,
  moduleProviders,
} from "../base-agent-sessions/base-agent-sessions-module.helpers"
import { AgentMessageAttachmentDocumentsService } from "../shared/agent-session-messages/agent-message-attachment-documents.service"
import { AgentMessagesController } from "../shared/agent-session-messages/agent-messages.controller"
import { McpAppHtmlService } from "../shared/agent-session-messages/mcp-app-html.service"
import { StreamingModule } from "../shared/agent-session-messages/streaming/streaming.module"
import { ConversationAgentSessionsController } from "./conversation-agent-sessions.controller"
import { ConversationAgentSessionsService } from "./conversation-agent-sessions.service"

@Module({
  imports: [
    TypeOrmModule.forFeature([...moduleFeatures]),
    ...moduleImports,
    forwardRef(() => AgentSettingsModule),
    forwardRef(() => StreamingModule),
    McpModule,
    McpServersModule,
    PdfPagesModule,
  ],
  providers: [
    ...moduleProviders,
    AgentMessageAttachmentDocumentsService,
    ConversationAgentSessionsService,
    McpAppHtmlService,
  ],
  controllers: [AgentMessagesController, ConversationAgentSessionsController],
  exports: [ConversationAgentSessionsService],
})
export class ConversationAgentSessionsModule {}
