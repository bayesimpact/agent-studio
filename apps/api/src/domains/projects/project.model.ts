import { ModelWithPermissions } from "@/common/models/model-with-permissions"
import type { Project } from "./project.entity"

type ProjectAgentSessionCategory = { id: string; name: string }

type ProjectModelProps = {
  id: string
  organizationId: string
  name: string
  createdAt: Date
  updatedAt: Date
  featureFlags: string[]
  agentSessionCategories: ProjectAgentSessionCategory[]
}

export class ProjectModel extends ModelWithPermissions {
  readonly id: string
  readonly organizationId: string
  readonly name: string
  readonly createdAt: Date
  readonly updatedAt: Date
  /** Keys of the enabled feature flags. */
  readonly featureFlags: string[]
  readonly agentSessionCategories: ProjectAgentSessionCategory[]

  constructor(props: ProjectModelProps, permissions: readonly string[]) {
    super(permissions)
    this.id = props.id
    this.organizationId = props.organizationId
    this.name = props.name
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt
    this.featureFlags = props.featureFlags
    this.agentSessionCategories = props.agentSessionCategories
  }

  static fromEntity(project: Project, permissions: readonly string[]): ProjectModel {
    return new ProjectModel(
      {
        id: project.id,
        organizationId: project.organizationId,
        name: project.name,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        featureFlags: (project.featureFlags ?? [])
          .filter((featureFlag) => featureFlag.enabled)
          .map((featureFlag) => featureFlag.featureFlagKey),
        agentSessionCategories: (project.projectAgentSessionCategories ?? []).map((category) => ({
          id: category.id,
          name: category.name,
        })),
      },
      permissions,
    )
  }
}
