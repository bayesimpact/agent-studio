import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { AgentContextResolver } from "@/common/context/resolvers/agent-context.resolver"
import { OrganizationContextResolver } from "@/common/context/resolvers/organization-context.resolver"
import { ProjectContextResolver } from "@/common/context/resolvers/project-context.resolver"
import { ResourceContextGuard } from "@/common/context/resource-context.guard"
import { AgentSessionsModule } from "@/domains/agent-sessions/agent-sessions.module"
import { AuthModule } from "@/domains/auth/auth.module"
import { OrganizationsModule } from "@/domains/organizations/organizations.module"
import { UserMembership } from "@/domains/organizations/user-membership.entity"
import { Project } from "@/domains/projects/project.entity"
import { UsersModule } from "@/domains/users/users.module"
import { ProjectsModule } from "../projects/projects.module"
import { Agent } from "./agent.entity"
import { AgentGuard } from "./agent.guard"
import { AgentsController } from "./agents.controller"
import { AgentsService } from "./agents.service"

@Module({
  imports: [
    TypeOrmModule.forFeature([Agent, Project, UserMembership]),
    OrganizationsModule,
    ProjectsModule,
    UsersModule,
    AuthModule,
    AgentSessionsModule,
  ],
  providers: [
    AgentsService,
    AgentGuard,
    ResourceContextGuard,
    OrganizationContextResolver,
    ProjectContextResolver,
    AgentContextResolver,
  ],
  controllers: [AgentsController],
  exports: [AgentsService],
})
export class AgentsModule {}
