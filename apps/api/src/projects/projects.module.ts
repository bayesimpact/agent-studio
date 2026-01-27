import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { AuthModule } from "@/auth/auth.module"
import { Organization } from "@/organizations/organization.entity"
import { OrganizationsModule } from "@/organizations/organizations.module"
import { UserMembership } from "@/organizations/user-membership.entity"
import { UsersModule } from "@/users/users.module"
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
