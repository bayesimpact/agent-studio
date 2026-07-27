import { Injectable } from "@nestjs/common"
import { In, type Repository } from "typeorm"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { TransactionService } from "@/common/transaction/transaction.service"
import { Organization } from "./organization.entity"
import { OrganizationModel } from "./organization.model"

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

  private organizationRepo(): Repository<Organization> {
    return this.transactionService.getManager().getRepository(Organization)
  }
}
