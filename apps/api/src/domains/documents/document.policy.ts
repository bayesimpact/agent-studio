import { ProjectScopedPolicy } from "@/common/policies/project-scoped-policy"
import type { Document } from "./document.entity"

export class DocumentPolicy extends ProjectScopedPolicy<Document> {
  // we don't need any additional logic here, the default project-scoped policy is enough
}
