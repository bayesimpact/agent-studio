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
    return this.isAdminOrOwner()
  }

  canCreate(): boolean {
    if (this.sourceType === "project") {
      return this.isAdminOrOwner()
    }
    return true
  }

  canUpdate(): boolean {
    return this.isAdminOrOwner()
  }

  canDelete(): boolean {
    return this.isAdminOrOwner()
  }
}
