import { ProjectScopedPolicy } from "@/common/policies/project-scoped-policy"
import type { ExtractionAgentSession } from "./extraction-agent-session.entity"

export class ExtractionAgentSessionPolicy extends ProjectScopedPolicy<ExtractionAgentSession> {
  // same authorization semantics as other project-scoped resources

  canList(): boolean {
    return this.canAccessProject()
  }

  canCreate(): boolean {
    return this.canAccessProject()
  }
}
