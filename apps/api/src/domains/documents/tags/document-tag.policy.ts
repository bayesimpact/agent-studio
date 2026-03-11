import { ProjectScopedPolicy } from "@/common/policies/project-scoped-policy"
import type { DocumentTag } from "./document-tag.entity"

export class DocumentTagPolicy extends ProjectScopedPolicy<DocumentTag> {
  // The default project-scoped policy is sufficient for document tags
}
