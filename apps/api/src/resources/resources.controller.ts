import { type ResourcesDto, ResourcesRoutes } from "@caseai-connect/api-contracts"
import {
  Controller,
  FileTypeValidator,
  HttpCode,
  HttpStatus,
  Inject,
  MaxFileSizeValidator,
  NotFoundException,
  Param,
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
import type { MulterFile } from "@/common/types"
import { UserGuard } from "@/guards/user.guard"
import type { EndpointRequest } from "@/request.interface"
import type { Resource } from "./resource.entity"
import type { ResourcesService } from "./resources.service"
import { FILE_STORAGE_SERVICE, type IFileStorage } from "./storage/file-storage.interface"

const mega = 1024
@UseGuards(JwtAuthGuard, UserGuard)
@Controller()
export class ResourcesController {
  constructor(
    @Inject(FILE_STORAGE_SERVICE)
    private readonly fileStorageService: IFileStorage,
    private readonly resourcesService: ResourcesService,
  ) {}

  @Post(ResourcesRoutes.uploadOne.path)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor("file"))
  async uploadOne(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * mega * mega }), // 10 MB
          new FileTypeValidator({
            fileType: ".(png|jpeg|jpg|pdf|docx|doc|xlsx|xls|pptx|ppt|txt|csv)",
          }),
        ],
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      }),
    )
    file: MulterFile,
    @Request() req: EndpointRequest,
    @Param("organizationId") organizationId: string,
    @Param("projectId") projectId: string,
  ): Promise<typeof ResourcesRoutes.uploadOne.response> {
    // TODO: check ability to upload resources to the project

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
}

function toResourceDto(entity: Resource): ResourcesDto {
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
    mimeType: entity.mimeType,
    size: entity.size,
    storageRelativePath: entity.storageRelativePath,
  }
}
