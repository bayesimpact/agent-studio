import { Injectable } from "@nestjs/common"
import { In, type Repository } from "typeorm"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { TransactionService } from "@/common/transaction/transaction.service"
import { Organization } from "./organization.entity"
import { OrganizationModel } from "./organization.model"

/** Persisted organization row, for when permissions are not resolvable yet. */
export type OrganizationRecord = {
  id: string
  name: string
  createdAt: Date
}

@Injectable()
export class OrganizationRepository {
  constructor(private readonly transactionService: TransactionService) {}

  /** Hydrates the organizations of the map keys as models carrying their permissions. */
  async findByIds(
    permissionsByOrganizationId: Map<string, string[]>,
  ): Promise<OrganizationModel[]> {
    const organizationIds = [...permissionsByOrganizationId.keys()]
    if (organizationIds.length === 0) {
      return []
    }

    const organizations = await this.organizationRepo().find({
      where: { id: In(organizationIds) },
      order: { createdAt: "DESC" },
    })

    return organizations.map((organization) =>
      OrganizationModel.fromEntity(
        organization,
        permissionsByOrganizationId.get(organization.id) ?? [],
      ),
    )
  }

  async createOrganization(name: string): Promise<OrganizationRecord> {
    const saved = await this.organizationRepo().save(this.organizationRepo().create({ name }))
    return { id: saved.id, name: saved.name, createdAt: saved.createdAt }
  }

  /** Returns false when the organization does not exist. */
  async updateName(organizationId: string, name: string): Promise<boolean> {
    const organization = await this.organizationRepo().findOne({ where: { id: organizationId } })
    if (!organization) {
      return false
    }

    organization.name = name
    await this.organizationRepo().save(organization)
    return true
  }

  private organizationRepo(): Repository<Organization> {
    return this.transactionService.getManager().getRepository(Organization)
  }
}
