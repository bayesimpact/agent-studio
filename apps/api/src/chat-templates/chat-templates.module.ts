import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { OrganizationsModule } from "@/organizations/organizations.module"
import { UserMembership } from "@/organizations/user-membership.entity"
import { Project } from "@/projects/project.entity"
import { ChatTemplate } from "./chat-template.entity"
import { ChatTemplatesController } from "./chat-templates.controller"
import { ChatTemplatesService } from "./chat-templates.service"

@Module({
  imports: [TypeOrmModule.forFeature([ChatTemplate, Project, UserMembership]), OrganizationsModule],
  providers: [ChatTemplatesService],
  controllers: [ChatTemplatesController],
  exports: [ChatTemplatesService],
})
export class ChatTemplatesModule {}
