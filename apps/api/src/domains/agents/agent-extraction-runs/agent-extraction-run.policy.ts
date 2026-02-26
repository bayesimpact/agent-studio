import { ProjectScopedPolicy } from "@/common/policies/project-scoped-policy"
import type { AgentExtractionRun } from "./agent-extraction-run.entity"

export class AgentExtractionRunPolicy extends ProjectScopedPolicy<AgentExtractionRun> {
  // same authorization semantics as other project-scoped resources

  canList(): boolean {
    return this.canAccessProject()
  }

  canCreate(): boolean {
    return this.canAccessProject()
  }
}
