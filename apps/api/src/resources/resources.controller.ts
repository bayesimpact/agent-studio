import { type MimeTypes, type ResourceDto, ResourcesRoutes } from "@caseai-connect/api-contracts"
import {
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  MaxFileSizeValidator,
  NotFoundException,
  ParseFilePipe,
  Post,
  Request,
  UnprocessableEntityException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common"
import { FileInterceptor } from "@nestjs/platform-express/multer"
import { JwtAuthGuard } from "@/auth/jwt-auth.guard"
import { CheckPolicy } from "@/common/policies/check-policy.decorator"
import type { MulterFile } from "@/common/types"
import { UserGuard } from "@/guards/user.guard"
import { OrganizationGuard } from "@/organizations/organization.guard"
import { ProjectsGuard } from "@/projects/projects.guard"
import type { EndpointRequestWithProject, EndpointRequestWithResource } from "@/request.interface"
import type { Resource } from "./resource.entity"
import { ResourcesGuard } from "./resources.guard"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { ResourcesService } from "./resources.service"
import { FILE_STORAGE_SERVICE, type IFileStorage } from "./storage/file-storage.interface"

const mega = 1024
@UseGuards(JwtAuthGuard, UserGuard, OrganizationGuard, ProjectsGuard, ResourcesGuard)
@Controller()
export class ResourcesController {
  constructor(
    @Inject(FILE_STORAGE_SERVICE)
    private readonly fileStorageService: IFileStorage,
    private readonly resourcesService: ResourcesService,
  ) {}

  @CheckPolicy((policy) => policy.canCreate())
  @Post(ResourcesRoutes.uploadOne.path)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor("file"))
  async uploadOne(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * mega * mega }), // 10 MB
          new FileTypeValidator({
            fileType: ".pdf", //".(png|jpeg|jpg|pdf|docx|doc|xlsx|xls|pptx|ppt|txt|csv)",
          }),
        ],
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      }),
    )
    file: MulterFile,
    @Request() req: EndpointRequestWithProject,
  ): Promise<typeof ResourcesRoutes.uploadOne.response> {
    const organizationId = req.organizationId
    const projectId = req.project?.id

    if (!projectId) {
      throw new UnprocessableEntityException("Project ID is required.")
    }

    if (!file) {
      throw new UnprocessableEntityException("File is required.")
    }
    if (!file.mimetype) {
      throw new UnprocessableEntityException("File MIME type is required.")
    }

    // Validate MIME type
    // Note: This is a simplified check. In production, you might want to use a more robust MIME type validation library.
    const isImage =
      file.mimetype === "image/png" ||
      file.mimetype === "image/jpeg" ||
      file.mimetype === "image/jpg"
    const isPdf = file.mimetype === "application/pdf"
    const isMicrosoftDocument =
      file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
      file.mimetype === "application/msword" ||
      file.mimetype === "application/vnd.ms-excel" ||
      file.mimetype === "application/vnd.ms-powerpoint"
    const isCsv = file.mimetype === "text/csv"
    const isText = file.mimetype === "text/plain"
    if (!isImage && !isPdf && !isMicrosoftDocument && !isCsv && !isText) {
      throw new UnprocessableEntityException(
        `Invalid file type: ${file.mimetype}. Only images, PDFs, CSV, text, and Microsoft documents are allowed.`,
      )
    }

    const extension = file.originalname.split(".").pop() || ""
    if (extension.trim().length === 0) {
      throw new UnprocessableEntityException("File extension is required.", extension)
    }

    const fileInfo = await this.fileStorageService.save({
      file,
      pathPrefix: `${organizationId}/${projectId}`,
      extension,
    })

    const resource = await this.resourcesService.createResourceFromFile({
      projectId,
      resourceId: fileInfo.fileId,
      fields: {
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        storageRelativePath: fileInfo.storageRelativePath,
        title: file.originalname,
      },
    })

    if (!resource) {
      throw new NotFoundException("Resource not found or you do not have permission to access it.")
    }
    return { data: toResourceDto(resource) }
  }

  @CheckPolicy((policy) => policy.canList())
  @Get(ResourcesRoutes.getAll.path)
  async getAll(
    @Request() req: EndpointRequestWithProject,
  ): Promise<typeof ResourcesRoutes.getAll.response> {
    const projectId = req.project?.id

    if (!projectId) {
      throw new UnprocessableEntityException("Project ID is required.")
    }

    const resources = await this.resourcesService.listResources({
      projectId,
    })

    return { data: resources.map(toResourceDto) }
  }

  @CheckPolicy((policy) => policy.canDelete())
  @Delete(ResourcesRoutes.deleteOne.path)
  async deleteOne(
    @Request() req: EndpointRequestWithResource,
  ): Promise<typeof ResourcesRoutes.deleteOne.response> {
    const projectId = req.project?.id
    const resourceId = req.resource?.id

    if (!projectId) {
      throw new UnprocessableEntityException("Project ID is required.")
    }
    if (!resourceId) {
      throw new UnprocessableEntityException("Resource ID is required.")
    }

    await this.resourcesService.deleteResource({
      resourceId,
    })

    return { data: { success: true } }
  }
}

function toResourceDto(entity: Resource): ResourceDto {
  return {
    id: entity.id,
    projectId: entity.projectId,
    title: entity.title,
    content: entity.content,
    fileName: entity.fileName,
    createdAt: entity.createdAt.getTime(),
    updatedAt: entity.updatedAt.getTime(),
    deletedAt: entity.deletedAt?.getTime() || undefined,
    language: entity.language === "fr" ? "fr" : "en",
    mimeType: entity.mimeType as MimeTypes,
    size: entity.size,
    storageRelativePath: entity.storageRelativePath,
  }
}
