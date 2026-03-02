import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm"
import { Base4AllEntity } from "@/common/entities/base4all.entity"
import { Organization } from "../organizations/organization.entity"

@Entity({ name: "feature_flag" })
@Index("feature_flag_UNIQUE", ["featureFlagKey", "organizationId"], {
  unique: true,
})
export class FeatureFlag extends Base4AllEntity {
  @Column({ type: "uuid", name: "organization_id", nullable: false })
  organizationId!: string
  @ManyToOne(
    () => Organization,
    (organization) => organization.featureFlags,
  )
  @JoinColumn({ name: "organization_id" })
  organization!: Organization

  @Column({ name: "enabled", default: true, nullable: false })
  enabled!: boolean

  @Column({ name: "feature_flag_key", nullable: false })
  featureFlagKey!: string
}
