import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { AuthModule } from "@/domains/auth/auth.module"
import { Organization } from "@/domains/organizations/organization.entity"
import { OrganizationsModule } from "@/domains/organizations/organizations.module"
import { UserMembership } from "@/domains/organizations/user-membership.entity"
import { UsersModule } from "@/domains/users/users.module"
import { Project } from "./project.entity"
import { ProjectsController } from "./projects.controller"
import { ProjectsService } from "./projects.service"

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, Organization, UserMembership]),
    OrganizationsModule,
    UsersModule,
    AuthModule,
  ],
  providers: [ProjectsService],
  controllers: [ProjectsController],
  exports: [ProjectsService],
})
export class ProjectsModule {}
