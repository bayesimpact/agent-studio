import { type MiddlewareConsumer, Module, type NestModule } from "@nestjs/common"
import { ConfigModule, ConfigService } from "@nestjs/config"
import { TypeOrmModule } from "@nestjs/typeorm"
import { RequestLoggerMiddleware } from "./common/middleware/request-logger.middleware"
import typeorm from "./config/typeorm"
import { AgentsModule } from "./domains/agents/agents.module"
import { ConversationAgentSessionsModule } from "./domains/agents/conversation-agent-sessions/conversation-agent-sessions.module"
import { AgentMessageFeedbackModule } from "./domains/agents/shared/agent-session-messages/feedback/agent-message-feedback.module"
import { AuthModule } from "./domains/auth/auth.module"
import { DocumentsModule } from "./domains/documents/documents.module"
import { StorageModule } from "./domains/documents/storage/storage.module"
import { DocumentTagsModule } from "./domains/documents/tags/document-tags.module"
import { EvaluationsModule } from "./domains/evaluations/evaluations.module"
import { MeModule } from "./domains/me/me.module"
import { OrganizationsModule } from "./domains/organizations/organizations.module"
import { ProjectsModule } from "./domains/projects/projects.module"
import { UsersModule } from "./domains/users/users.module"

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [typeorm],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => configService.get("typeorm")(),
    }),
    AuthModule,
    UsersModule,
    OrganizationsModule,
    ProjectsModule,
    AgentsModule,
    ConversationAgentSessionsModule,
    AgentMessageFeedbackModule,
    MeModule,
    EvaluationsModule,
    OrganizationsModule,
    ProjectsModule,
    DocumentsModule,
    DocumentTagsModule,
    StorageModule,
    UsersModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes("*")
  }
}
