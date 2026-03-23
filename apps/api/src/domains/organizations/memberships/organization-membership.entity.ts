import { Column, Entity, JoinColumn, ManyToOne, Unique } from "typeorm"
import { Base4AllEntity } from "@/common/entities/base4all.entity"
import { User } from "@/domains/users/user.entity"
import { Organization } from "../organization.entity"

export type OrganizationMembershipRole = "owner" | "admin"

@Entity("organization_membership")
@Unique(["userId", "organizationId"])
export class OrganizationMembership extends Base4AllEntity {
  @Column({ type: "uuid", name: "user_id" })
  userId!: string

  @Column({ type: "uuid", name: "organization_id" })
  organizationId!: string

  @Column({ type: "varchar" })
  role!: OrganizationMembershipRole

  @ManyToOne(
    () => User,
    (user) => user.memberships,
  )
  @JoinColumn({ name: "user_id" })
  user!: User

  @ManyToOne(
    () => Organization,
    (organization) => organization.memberships,
  )
  @JoinColumn({ name: "organization_id" })
  organization!: Organization
}
