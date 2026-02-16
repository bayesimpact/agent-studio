import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { AuthModule } from "@/domains/auth/auth.module"
import { Organization } from "@/domains/organizations/organization.entity"
import { OrganizationsModule } from "@/domains/organizations/organizations.module"
import { UserMembership } from "@/domains/organizations/user-membership.entity"
import { User } from "@/domains/users/user.entity"
import { UsersModule } from "@/domains/users/users.module"
import { InvitationsController } from "./memberships/invitations.controller"
import { ProjectMembership } from "./memberships/project-membership.entity"
import { ProjectMembershipsController } from "./memberships/project-memberships.controller"
import { ProjectMembershipsService } from "./memberships/project-memberships.service"
import { Project } from "./project.entity"
import { ProjectsController } from "./projects.controller"
import { ProjectsService } from "./projects.service"

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, Organization, UserMembership, ProjectMembership, User]),
    OrganizationsModule,
    UsersModule,
    AuthModule,
  ],
  providers: [ProjectsService, ProjectMembershipsService],
  controllers: [ProjectsController, ProjectMembershipsController, InvitationsController],
  exports: [ProjectsService, ProjectMembershipsService],
})
export class ProjectsModule {}
