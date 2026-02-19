import { type DocumentDto, DocumentsRoutes, type MimeTypes } from "@caseai-connect/api-contracts"
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
import type {
  EndpointRequestWithDocument,
  EndpointRequestWithProject,
} from "@/common/context/request.interface"
import { getRequiredConnectScope } from "@/common/context/request-context.helpers"
import { AddContext, RequireContext } from "@/common/context/require-context.decorator"
import { ResourceContextGuard } from "@/common/context/resource-context.guard"
import { CheckPolicy } from "@/common/policies/check-policy.decorator"
import type { MulterFile } from "@/common/types"
import { JwtAuthGuard } from "@/domains/auth/jwt-auth.guard"
import { UserGuard } from "@/domains/users/user.guard"
import type { Document } from "./document.entity"
import { DocumentsGuard } from "./documents.guard"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { DocumentsService } from "./documents.service"
import { FILE_STORAGE_SERVICE, type IFileStorage } from "./storage/file-storage.interface"

const mega = 1024
@UseGuards(JwtAuthGuard, UserGuard, ResourceContextGuard, DocumentsGuard)
@RequireContext("organization", "project")
@Controller()
export class DocumentsController {
  constructor(
    @Inject(FILE_STORAGE_SERVICE)
    private readonly fileStorageService: IFileStorage,
    private readonly documentsService: DocumentsService,
  ) {}

  @CheckPolicy((policy) => policy.canCreate())
  @Post(DocumentsRoutes.uploadOne.path)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor("file"))
  async uploadOne(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * mega * mega }), // 10 MB
          new FileTypeValidator({
            fileType: ".(png|jpeg|jpg|pdf|txt|csv)", //".(png|jpeg|jpg|pdf|docx|doc|xlsx|xls|pptx|ppt|txt|csv)",
          }),
        ],
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      }),
    )
    file: MulterFile,
    @Request() req: EndpointRequestWithProject,
    @Param("sourceType") sourceType: "project" | "agentSessionMessage",
  ): Promise<typeof DocumentsRoutes.uploadOne.response> {
    if (!sourceType) {
      throw new UnprocessableEntityException("Source type is required.")
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
    const connectScope = getRequiredConnectScope(req)
    const fileInfo = await this.fileStorageService.save({
      file,
      pathPrefix: `${connectScope.organizationId}/${connectScope.projectId}`,
      extension,
    })

    const document = await this.documentsService.createDocumentFromFile({
      connectScope,
      documentId: fileInfo.fileId,
      fields: {
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        storageRelativePath: fileInfo.storageRelativePath,
        title: file.originalname,
        sourceType,
      },
    })

    if (!document) {
      throw new NotFoundException("Document not found or you do not have permission to access it.")
    }
    return { data: toDocumentDto(document) }
  }

  @CheckPolicy((policy) => policy.canList())
  @Get(DocumentsRoutes.getAll.path)
  async getAll(
    @Request() req: EndpointRequestWithProject,
  ): Promise<typeof DocumentsRoutes.getAll.response> {
    const documents = await this.documentsService.listDocuments(getRequiredConnectScope(req))
    return { data: documents.map(toDocumentDto) }
  }

  @CheckPolicy((policy) => policy.canDelete())
  @AddContext("document")
  @Delete(DocumentsRoutes.deleteOne.path)
  async deleteOne(
    @Request() req: EndpointRequestWithDocument,
  ): Promise<typeof DocumentsRoutes.deleteOne.response> {
    const documentId = req.document.id

    await this.documentsService.deleteDocument({
      connectScope: getRequiredConnectScope(req),
      documentId,
    })

    return { data: { success: true } }
  }

  @CheckPolicy((policy) => policy.canUpdate())
  @AddContext("document")
  @Get(DocumentsRoutes.getTemporaryUrl.path)
  @HttpCode(HttpStatus.CREATED)
  async getTemporaryUrl(
    @Request() req: EndpointRequestWithDocument,
  ): Promise<typeof DocumentsRoutes.getTemporaryUrl.response> {
    const document = req.document

    const url = await this.fileStorageService.getTemporaryUrl(document.storageRelativePath)
    if (!url) {
      throw new NotFoundException("Temporary URL not found for the document.")
    }
    return { data: { url } }
  }
}

function toDocumentDto(entity: Document): DocumentDto {
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
