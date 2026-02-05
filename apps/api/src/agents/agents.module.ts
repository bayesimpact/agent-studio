import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { AgentSessionsModule } from "@/agent-sessions/agent-sessions.module"
import { AuthModule } from "@/auth/auth.module"
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
    AgentSessionsModule,
  ],
  providers: [AgentsService],
  controllers: [AgentsController],
  exports: [AgentsService],
})
export class AgentsModule {}
