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
import { Document } from "./document.entity"
import { DocumentsController } from "./documents.controller"
import { DocumentsService } from "./documents.service"
import { StorageModule } from "./storage/storage.module"

@Module({
  imports: [
    TypeOrmModule.forFeature([Document, Project, Organization, UserMembership]),
    // Only serve static files in development/local environment
    ...(process.env.NODE_ENV !== "production"
      ? [
          ServeStaticModule.forRoot({
            // Expose files (e.g., 'http://localhost:API_PORT/documents/orgId/projectId/documentId.pdf')
            serveRoot: "/documents/",
            serveStaticOptions: {
              cacheControl: true,
              maxAge: "1d",
            },
            rootPath: join(process.cwd(), "dontsave_documents"),
          }),
        ]
      : []),
    OrganizationsModule,
    ProjectsModule,
    UsersModule,
    AuthModule,
    StorageModule,
  ],
  providers: [DocumentsService],
  controllers: [DocumentsController],
  exports: [DocumentsService],
})
export class DocumentsModule {}
