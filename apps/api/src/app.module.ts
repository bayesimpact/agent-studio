import { Module } from "@nestjs/common"
import { ConfigModule, ConfigService } from "@nestjs/config"
import { TypeOrmModule } from "@nestjs/typeorm"
import typeorm from "./config/typeorm"
import { AgentMessageFeedbackModule } from "./domains/agent-message-feedback/agent-message-feedback.module"
import { AgentSessionsModule } from "./domains/agent-sessions/agent-sessions.module"
import { AgentsModule } from "./domains/agents/agents.module"
import { AuthModule } from "./domains/auth/auth.module"
import { DocumentsModule } from "./domains/documents/documents.module"
import { StorageModule } from "./domains/documents/storage/storage.module"
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
    AgentSessionsModule,
    AgentMessageFeedbackModule,
    MeModule,
    OrganizationsModule,
    ProjectsModule,
    DocumentsModule,
    StorageModule,
    UsersModule,
  ],
})
export class AppModule {}
