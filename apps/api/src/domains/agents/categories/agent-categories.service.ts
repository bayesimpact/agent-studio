import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { AgentCategory } from "./agent-category.entity"

export type ReplaceAgentCategoriesResult = {
  createdCount: number
  restoredCount: number
  deletedCount: number
}

@Injectable()
export class AgentCategoriesService {
  constructor(
    @InjectRepository(AgentCategory)
    private readonly agentCategoryRepository: Repository<AgentCategory>,
  ) {}

  async listActiveCategoryNamesForAgent(agentId: string): Promise<string[]> {
    const activeCategories = await this.agentCategoryRepository.find({
      where: { agentId },
      order: { name: "ASC" },
    })
    return activeCategories.map((agentCategory) => agentCategory.name)
  }

  /**
   * Sets the active category set for an agent: creates missing rows, restores soft-deleted
   * matches, and soft-deletes active rows not in `categoryNames`.
   */
  async replaceActiveCategoriesForAgent(
    agentId: string,
    categoryNames: string[],
  ): Promise<ReplaceAgentCategoriesResult> {
    const existingAgentCategories = await this.agentCategoryRepository.find({
      where: { agentId },
      withDeleted: true,
      order: { name: "ASC" },
    })

    const desiredCategoryNames = new Set(categoryNames)
    const existingCategoryByName = new Map(
      existingAgentCategories.map((existingAgentCategory) => [
        existingAgentCategory.name,
        existingAgentCategory,
      ]),
    )

    let createdCount = 0
    let restoredCount = 0
    let deletedCount = 0

    for (const categoryName of categoryNames) {
      const existingAgentCategory = existingCategoryByName.get(categoryName)
      if (!existingAgentCategory) {
        const createdAgentCategory = this.agentCategoryRepository.create({
          agentId,
          name: categoryName,
        })
        await this.agentCategoryRepository.save(createdAgentCategory)
        createdCount += 1
        continue
      }

      if (existingAgentCategory.deletedAt !== null) {
        await this.agentCategoryRepository.recover(existingAgentCategory)
        restoredCount += 1
      }
    }

    for (const existingAgentCategory of existingAgentCategories) {
      const shouldStayActive = desiredCategoryNames.has(existingAgentCategory.name)
      const isCurrentlyActive = existingAgentCategory.deletedAt === null
      if (!shouldStayActive && isCurrentlyActive) {
        await this.agentCategoryRepository.softDelete(existingAgentCategory.id)
        deletedCount += 1
      }
    }

    return {
      createdCount,
      restoredCount,
      deletedCount,
    }
  }
}
