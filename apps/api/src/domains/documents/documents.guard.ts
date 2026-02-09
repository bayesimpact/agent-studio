import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { Reflector } from "@nestjs/core"
import { AUTH_ERRORS } from "@/common/errors/auth-errors"
import { CHECK_POLICY_KEY, type PolicyHandler } from "@/common/policies/check-policy.decorator"
import type { EndpointRequestWithDocument } from "@/request.interface"
import type { Document } from "./document.entity"
import { DocumentPolicy } from "./document.policy"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { DocumentsService } from "./documents.service"

@Injectable()
export class DocumentsGuard implements CanActivate {
  constructor(
    readonly documentsService: DocumentsService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // since DocumentsGuard is called after UserGuard, we can access the enhanced request object storing the user
    const request = context.switchToHttp().getRequest() as EndpointRequestWithDocument & {
      params: { documentId: string }
    }

    // fetch the document from the database if documentId is provided
    let document: Document | undefined
    const documentId = request.params.documentId

    // the caller didn't provide a documentId and our route mechanism uses the :documentId placeholder instead
    if (documentId === ":documentId") throw new NotFoundException()

    // ok, we have a documentId (UPDATE, DELETE routes), fetch the document from the database
    if (documentId) {
      document = (await this.documentsService.findById(documentId)) ?? undefined
      if (!document) throw new NotFoundException()

      // enhance the request object with the document
      request.document = document
    }

    const policy = new DocumentPolicy(request.userMembership, request.project, document)

    const policyHandler = this.reflector.getAllAndOverride<PolicyHandler>(CHECK_POLICY_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (!policyHandler || !policyHandler(policy)) {
      throw new ForbiddenException(AUTH_ERRORS.UNAUTHORIZED_RESOURCE)
    }

    return true
  }
}
