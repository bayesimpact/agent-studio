import { Column, Entity, JoinColumn, ManyToOne, Unique } from "typeorm"
import { Base4AllEntity } from "@/common/entities/base4all.entity"
import { User } from "@/domains/users/user.entity"
import { Organization } from "../organization.entity"

export type MembershipRole = "owner" | "admin" | "member"

@Entity("organization_membership")
@Unique("UQ_ca24d6d1a91810c7decccf091c3", ["userId", "organizationId"])
export class OrganizationMembership extends Base4AllEntity {
  @Column({ type: "uuid", name: "user_id" })
  userId!: string

  @Column({ type: "uuid", name: "organization_id" })
  organizationId!: string

  @Column({ type: "varchar" })
  role!: MembershipRole

  @ManyToOne(
    () => User,
    (user) => user.memberships,
  )
  @JoinColumn({ name: "user_id", foreignKeyConstraintName: "FK_13c0b9b73e272c78393908bfe31" })
  user!: User

  @ManyToOne(
    () => Organization,
    (organization) => organization.memberships,
  )
  @JoinColumn({
    name: "organization_id",
    foreignKeyConstraintName: "FK_1e9b66eae483a290addd3d0d657",
  })
  organization!: Organization
}
