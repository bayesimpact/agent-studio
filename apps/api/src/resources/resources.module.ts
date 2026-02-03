import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { AuthModule } from "@/auth/auth.module"
import { Organization } from "@/organizations/organization.entity"
import { OrganizationsModule } from "@/organizations/organizations.module"
import { UserMembership } from "@/organizations/user-membership.entity"
import { Project } from "@/projects/project.entity"
import { UsersModule } from "@/users/users.module"
import { ResourcesController } from "./resources.controller"
import { ResourcesService } from "./resources.service"

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, Organization, UserMembership]),
    OrganizationsModule,
    UsersModule,
    AuthModule,
  ],
  providers: [ResourcesService],
  controllers: [ResourcesController],
  exports: [ResourcesService],
})
export class ResourcesModule {}
