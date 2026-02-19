import type { FindManyOptions, Repository, SelectQueryBuilder } from "typeorm"
import type { DeepPartial } from "typeorm/common/DeepPartial"
import type { ConnectEntityBase } from "@/common/entities/connect-entity"
import type { RequiredConnectScope } from "@/common/entities/connect-required-fields"

export class ConnectRepository<T extends ConnectEntityBase> {
  private repository: Repository<T>
  private alias: string

  constructor(repository: Repository<T>, alias: string) {
    this.repository = repository
    this.alias = alias
  }

  public async find(
    connectScope: RequiredConnectScope,
    options: FindManyOptions<Pick<RequiredConnectScope, never> & T>,
  ): Promise<T[]> {
    return await this.repository.find(this.addConnectScopeWhere(connectScope, options))
  }

  addConnectScopeWhere<T extends RequiredConnectScope>(
    connectScope: RequiredConnectScope,
    options: FindManyOptions<T>,
  ): FindManyOptions<T> {
    let extended = this.addWhere(options, {
      organizationId: connectScope.organizationId,
    })

    extended = this.addWhere(extended, {
      projectId: connectScope.projectId,
    })

    return extended
  }

  addWhere<T>(options: FindManyOptions<T>, extra: Record<string, string>): FindManyOptions<T> {
    const where = options.where
    if (Array.isArray(where)) {
      return {
        ...options,
        where: where.map((w) => ({ ...w, ...extra })),
      }
    }
    return {
      ...options,
      where: { ...(where ?? {}), ...extra },
    }
  }

  public async getMany(connectScope: RequiredConnectScope): Promise<T[]> {
    return await this.newQueryBuilderWithConnectScope(connectScope).getMany()
  }

  public async getOneById(connectScope: RequiredConnectScope, id: string): Promise<T | null> {
    return await this.newQueryBuilderWithConnectScope(connectScope)
      .andWhere(`${this.alias}.id = :id`, { id })
      .getOne()
  }

  public newQueryBuilderWithConnectScope(
    connectScope: RequiredConnectScope,
  ): SelectQueryBuilder<T> {
    const query = this.repository
      .createQueryBuilder(this.alias)
      .andWhere(`${this.alias}.organization_id = :organizationId`, {
        organizationId: connectScope.organizationId,
      })
      .andWhere(`${this.alias}.project_id = :projectId`, {
        projectId: connectScope.projectId,
      })

    // If the connectScope.userId is provided, we need to filter the entities of projects the user is a member of.
    // It's an extra security measure to prevent users from accessing projects they are not a member BECAUSE we already do the check in the guards / policies.
    // Important: owners and admins of the organization don't have a project membership.
    if (connectScope.userId) {
      query.andWhere(
        `${this.alias}.project_id IN (SELECT project_id FROM project_membership WHERE user_id = :userId AND organization_id = :organizationId)`,
        {
          userId: connectScope.userId,
          organizationId: connectScope.organizationId,
        },
      )
    }

    return query
  }

  public async deleteOneById({
    connectScope,
    id,
  }: {
    connectScope: RequiredConnectScope
    id: string
  }): Promise<boolean> {
    const query = this.repository
      .createQueryBuilder()
      .softDelete()
      .andWhere(`organization_id = :organizationId`, {
        organizationId: connectScope.organizationId,
      })
      .andWhere(`project_id = :projectId`, {
        projectId: connectScope.projectId,
      })
      .andWhere(`id = :id`, { id })
    const res = await query.execute()
    return res?.affected === 1
  }

  public async createAndSave(
    connectScope: RequiredConnectScope,
    entity: Pick<RequiredConnectScope, never> & DeepPartial<T>,
  ): Promise<T> {
    return this.repository.save(this.repository.create({ ...connectScope, ...entity }))
  }

  public async saveOne(entity: T): Promise<T> {
    return this.repository.save(entity)
  }
}
