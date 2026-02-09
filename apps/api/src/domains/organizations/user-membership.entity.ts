import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm"
import { User } from "@/domains/users/user.entity"
import { Organization } from "./organization.entity"

export type MembershipRole = "owner" | "admin" | "member"

@Entity("user_membership")
@Unique(["userId", "organizationId"])
export class UserMembership {
  @PrimaryGeneratedColumn("uuid")
  id!: string

  @Column({ type: "uuid", name: "user_id" })
  userId!: string

  @Column({ type: "uuid", name: "organization_id" })
  organizationId!: string

  @Column({ type: "varchar" })
  role!: MembershipRole

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date

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
