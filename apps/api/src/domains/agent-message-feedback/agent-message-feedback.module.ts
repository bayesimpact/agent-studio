import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { AgentMessage } from "@/domains/agent-sessions/agent-message.entity"
import { AuthModule } from "@/domains/auth/auth.module"
import { Organization } from "@/domains/organizations/organization.entity"
import { OrganizationsModule } from "@/domains/organizations/organizations.module"
import { Project } from "@/domains/projects/project.entity"
import { ProjectsModule } from "@/domains/projects/projects.module"
import { UsersModule } from "@/domains/users/users.module"
import { AgentMessageFeedbackController } from "./agent-message-feedback.controller"
import { AgentMessageFeedback } from "./agent-message-feedback.entity"
import { AgentMessageFeedbackService } from "./agent-message-feedback.service"

@Module({
  imports: [
    TypeOrmModule.forFeature([AgentMessageFeedback, AgentMessage, Organization, Project]),
    AuthModule,
    UsersModule,
    OrganizationsModule,
    ProjectsModule,
  ],
  providers: [AgentMessageFeedbackService],
  controllers: [AgentMessageFeedbackController],
  exports: [AgentMessageFeedbackService],
})
export class AgentMessageFeedbackModule {}
