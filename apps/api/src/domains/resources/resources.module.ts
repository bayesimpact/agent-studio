import { join } from "node:path"
import { Module } from "@nestjs/common"
import { ServeStaticModule } from "@nestjs/serve-static"
import { TypeOrmModule } from "@nestjs/typeorm"
import { AuthModule } from "@/domains/auth/auth.module"
import { Organization } from "@/domains/organizations/organization.entity"
import { OrganizationsModule } from "@/domains/organizations/organizations.module"
import { UserMembership } from "@/domains/organizations/user-membership.entity"
import { Project } from "@/domains/projects/project.entity"
import { ProjectsModule } from "@/domains/projects/projects.module"
import { UsersModule } from "@/domains/users/users.module"
import { Resource } from "./resource.entity"
import { ResourcesController } from "./resources.controller"
import { ResourcesService } from "./resources.service"
import { StorageModule } from "./storage/storage.module"

@Module({
  imports: [
    TypeOrmModule.forFeature([Resource, Project, Organization, UserMembership]),
    // Only serve static files in development/local environment
    ...(process.env.NODE_ENV !== "production"
      ? [
          ServeStaticModule.forRoot({
            // Expose files (e.g., 'http://localhost:API_PORT/resources/orgId/projectId/resourceId.pdf')
            serveRoot: "/resources/",
            serveStaticOptions: {
              cacheControl: true,
              maxAge: "1d",
            },
            rootPath: join(process.cwd(), "dontsave_resources"),
          }),
        ]
      : []),
    OrganizationsModule,
    ProjectsModule,
    UsersModule,
    AuthModule,
    StorageModule,
  ],
  providers: [ResourcesService],
  controllers: [ResourcesController],
  exports: [ResourcesService],
})
export class ResourcesModule {}
