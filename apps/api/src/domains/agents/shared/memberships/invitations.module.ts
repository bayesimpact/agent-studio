import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { AgentMembership } from "@/domains/agents/memberships/agent-membership.entity"
import { AgentMembershipsService } from "@/domains/agents/memberships/agent-memberships.service"
import { AuthModule } from "@/domains/auth/auth.module"
import { ProjectMembership } from "@/domains/projects/memberships/project-membership.entity"
import { ProjectMembershipsService } from "@/domains/projects/memberships/project-memberships.service"
import { UsersModule } from "@/domains/users/users.module"
import { LlmModule } from "@/external/llm/llm.module"
import { InvitationsController } from "./invitations.controller"
import { InvitationsService } from "./invitations.service"

@Module({
  imports: [
    TypeOrmModule.forFeature([AgentMembership, ProjectMembership]),
    LlmModule,
    UsersModule,
    AuthModule,
  ],
  providers: [AgentMembershipsService, ProjectMembershipsService, InvitationsService],
  controllers: [InvitationsController],
  exports: [],
})
export class InvitationsModule {}
