import { join } from "node:path"
import { Module } from "@nestjs/common"
import { ServeStaticModule } from "@nestjs/serve-static"
import { TypeOrmModule } from "@nestjs/typeorm"
import { DocumentContextResolver } from "@/common/context/resolvers/document-context.resolver"
import { OrganizationContextResolver } from "@/common/context/resolvers/organization-context.resolver"
import { ProjectContextResolver } from "@/common/context/resolvers/project-context.resolver"
import { ResourceContextGuard } from "@/common/context/resource-context.guard"
import { AuthModule } from "@/domains/auth/auth.module"
import { Organization } from "@/domains/organizations/organization.entity"
import { OrganizationsModule } from "@/domains/organizations/organizations.module"
import { UserMembership } from "@/domains/organizations/user-membership.entity"
import { ProjectMembership } from "@/domains/projects/memberships/project-membership.entity"
import { Project } from "@/domains/projects/project.entity"
import { ProjectsModule } from "@/domains/projects/projects.module"
import { UsersModule } from "@/domains/users/users.module"
import { Document } from "./document.entity"
import { DocumentsController } from "./documents.controller"
import { DocumentsGuard } from "./documents.guard"
import { DocumentsService } from "./documents.service"
import { DocumentChunkRetrievalService } from "./embeddings/document-chunk-retrieval.service"
import { DocumentEmbeddingsBatchModule } from "./embeddings/document-embeddings-batch.module"
import { StorageModule } from "./storage/storage.module"
import { DocumentTag } from "./tags/document-tag.entity"

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Document,
      DocumentTag,
      Project,
      Organization,
      UserMembership,
      ProjectMembership,
    ]),
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
    DocumentEmbeddingsBatchModule,
  ],
  providers: [
    DocumentsService,
    DocumentChunkRetrievalService,
    DocumentsGuard,
    ResourceContextGuard,
    OrganizationContextResolver,
    ProjectContextResolver,
    DocumentContextResolver,
  ],
  controllers: [DocumentsController],
  exports: [DocumentsService, DocumentChunkRetrievalService],
})
export class DocumentsModule {}
