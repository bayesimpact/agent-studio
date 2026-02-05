import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { AuthModule } from "@/auth/auth.module"
import { ChatSessionsModule } from "@/chat-sessions/chat-sessions.module"
import { OrganizationsModule } from "@/organizations/organizations.module"
import { UserMembership } from "@/organizations/user-membership.entity"
import { Project } from "@/projects/project.entity"
import { UsersModule } from "@/users/users.module"
import { Agent } from "./agent.entity"
import { AgentsController } from "./agents.controller"
import { AgentsService } from "./agents.service"

@Module({
  imports: [
    TypeOrmModule.forFeature([Agent, Project, UserMembership]),
    OrganizationsModule,
    UsersModule,
    AuthModule,
    ChatSessionsModule,
  ],
  providers: [AgentsService],
  controllers: [AgentsController],
  exports: [AgentsService],
})
export class AgentsModule {}
