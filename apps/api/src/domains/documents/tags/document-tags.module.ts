import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { DocumentTagContextResolver } from "@/common/context/resolvers/document-tag-context.resolver"
import { OrganizationContextResolver } from "@/common/context/resolvers/organization-context.resolver"
import { ProjectContextResolver } from "@/common/context/resolvers/project-context.resolver"
import { ResourceContextGuard } from "@/common/context/resource-context.guard"
import { AuthModule } from "@/domains/auth/auth.module"
import { OrganizationsModule } from "@/domains/organizations/organizations.module"
import { UserMembership } from "@/domains/organizations/user-membership.entity"
import { ProjectMembership } from "@/domains/projects/memberships/project-membership.entity"
import { Project } from "@/domains/projects/project.entity"
import { ProjectsModule } from "@/domains/projects/projects.module"
import { UsersModule } from "@/domains/users/users.module"
import { DocumentTag } from "./document-tag.entity"
import { DocumentTagGuard } from "./document-tag.guard"
import { DocumentTagsController } from "./document-tags.controller"
import { DocumentTagsService } from "./document-tags.service"

@Module({
  imports: [
    TypeOrmModule.forFeature([DocumentTag, Project, UserMembership, ProjectMembership]),
    OrganizationsModule,
    ProjectsModule,
    UsersModule,
    AuthModule,
  ],
  providers: [
    DocumentTagsService,
    DocumentTagGuard,
    ResourceContextGuard,
    OrganizationContextResolver,
    ProjectContextResolver,
    DocumentTagContextResolver,
  ],
  controllers: [DocumentTagsController],
  exports: [DocumentTagsService],
})
export class DocumentTagsModule {}
