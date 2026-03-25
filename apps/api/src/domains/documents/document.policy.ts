import { ProjectScopedPolicy } from "@/common/policies/project-scoped-policy"
import type { Document } from "./document.entity"

export class DocumentPolicy extends ProjectScopedPolicy<Document> {
  constructor(
    context: ConstructorParameters<typeof ProjectScopedPolicy<Document>>[0],
    entity?: Document,
    private readonly sourceType?: Document["sourceType"],
  ) {
    super(context, entity)
  }

  canList(): boolean {
    return this.canAccess() && this.isProjectAdminOrOwner()
  }

  canCreate(): boolean {
    if (this.sourceType === "agentSessionMessage") {
      return this.canAccess()
    }
    return this.canAccess() && this.isProjectAdminOrOwner()
  }

  canUpdate(): boolean {
    return this.canAccess() && this.isProjectAdminOrOwner() && this.doesResourceBelongToScope()
  }

  canDelete(): boolean {
    return this.canUpdate()
  }
}
