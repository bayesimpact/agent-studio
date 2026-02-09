import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { AgentSessionsModule } from "@/domains/agent-sessions/agent-sessions.module"
import { AuthModule } from "@/domains/auth/auth.module"
import { OrganizationsModule } from "@/domains/organizations/organizations.module"
import { UserMembership } from "@/domains/organizations/user-membership.entity"
import { Project } from "@/domains/projects/project.entity"
import { UsersModule } from "@/domains/users/users.module"
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
