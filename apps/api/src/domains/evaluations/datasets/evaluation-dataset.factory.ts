import { randomUUID } from "node:crypto"
import { Factory } from "fishery"
import type { RequiredScopeTransientParams } from "@/common/entities/connect-required-fields"
import type { EvaluationDataset, EvaluationDatasetSchemaMapping } from "./evaluation-dataset.entity"

type EvaluationDatasetTransientParams = RequiredScopeTransientParams

class EvaluationDatasetFactory extends Factory<
  EvaluationDataset,
  EvaluationDatasetTransientParams
> {}

export const evaluationDatasetFactory = EvaluationDatasetFactory.define(
  ({ sequence, params, transientParams }) => {
    if (!transientParams.organization) {
      throw new Error("organization transient is required")
    }
    if (!transientParams.project) {
      throw new Error("project transient is required")
    }

    const now = new Date()
    const schemaMapping: EvaluationDatasetSchemaMapping = params.schemaMapping || {}

    return {
      id: params.id || randomUUID(),
      name: params.name || `Test Dataset ${sequence}`,
      schemaMapping,
      organizationId: transientParams.organization.id,
      projectId: transientParams.project.id,
      createdAt: params.createdAt || now,
      updatedAt: params.updatedAt || now,
      deletedAt: params.deletedAt || null,
      records: params.records || [],
      evaluationDatasetDocuments: params.evaluationDatasetDocuments || [],
    } satisfies EvaluationDataset
  },
)
