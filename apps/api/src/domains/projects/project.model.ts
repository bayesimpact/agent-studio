import { ModelWithPermissions } from "@/common/models/model-with-permissions"
import type { Project } from "./project.entity"

export class ProjectModel extends ModelWithPermissions {
  readonly id: string
  readonly organizationId: string
  readonly name: string
  readonly featureFlags: string[]

  constructor(
    props: { id: string; organizationId: string; name: string; featureFlags: string[] },
    permissions: readonly string[],
  ) {
    super(permissions)
    this.id = props.id
    this.organizationId = props.organizationId
    this.name = props.name
    this.featureFlags = props.featureFlags
  }

  static fromEntity(project: Project, permissions: readonly string[]): ProjectModel {
    return new ProjectModel(
      {
        id: project.id,
        organizationId: project.organizationId,
        name: project.name,
        featureFlags: (project.featureFlags ?? []).map((featureFlag) => featureFlag.featureFlagKey),
      },
      permissions,
    )
  }
}
