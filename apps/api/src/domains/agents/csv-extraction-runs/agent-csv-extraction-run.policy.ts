import type { BaseAgentSessionTypeDto } from "@caseai-connect/api-contracts"
import { ProjectScopedPolicy } from "@/common/policies/project-scoped-policy"
import type { AgentCsvExtractionRun } from "./agent-csv-extraction-run.entity"

export class AgentCsvExtractionRunPolicy extends ProjectScopedPolicy<AgentCsvExtractionRun> {
  constructor(
    context: ConstructorParameters<typeof ProjectScopedPolicy>[0],
    entity?: AgentCsvExtractionRun,
    private readonly type?: BaseAgentSessionTypeDto,
  ) {
    super(context, entity)
  }

  canList(): boolean {
    return this.canAccess() && this.canActOnType()
  }

  canCreate(): boolean {
    return this.canAccess() && this.canActOnType()
  }

  canUpdate(): boolean {
    return this.canAccess() && this.doesResourceBelongToScope() && this.canActOnType()
  }

  canDelete(): boolean {
    return this.canUpdate()
  }

  /**
   * Playground runs belong to the Studio surface, which only project admins and owners operate —
   * same gating as BaseAgentSessionPolicy. Routes that are not type-scoped (status stream, file
   * columns) carry no type and stay open to every project member.
   */
  private canActOnType(): boolean {
    return this.type !== "playground" || this.isProjectAdminOrOwner()
  }
}
