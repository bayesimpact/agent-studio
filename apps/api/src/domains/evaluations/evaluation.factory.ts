import { randomUUID } from "node:crypto"
import { Factory } from "fishery"
import type { Repository } from "typeorm"
import type { RequiredScopeTransientParams } from "@/common/entities/connect-required-fields"
import type { Organization } from "@/domains/organizations/organization.entity"
import type { Project } from "@/domains/projects/project.entity"
import type { Evaluation } from "./evaluation.entity"

type EvaluationTransientParams = RequiredScopeTransientParams

class EvaluationFactory extends Factory<Evaluation, EvaluationTransientParams> {}

export const evaluationFactory = EvaluationFactory.define(
  ({ sequence, params, transientParams }) => {
    if (!transientParams.organization) {
      throw new Error("organization transient is required")
    }
    if (!transientParams.project) {
      throw new Error("project transient is required")
    }

    const now = new Date()
    return {
      id: params.id || randomUUID(),
      createdAt: params.createdAt || now,
      updatedAt: params.updatedAt || now,
      deletedAt: params.deletedAt ?? null,
      organizationId: transientParams.organization.id,
      projectId: transientParams.project.id,
      project: transientParams.project,

      input: params.input || `Evaluation input ${sequence}`,
      expectedOutput: params.expectedOutput || `Expected output ${sequence}`,
      reports: params.reports || [],
    } satisfies Evaluation
  },
)

type CreateEvaluationForProjectParams = {
  evaluation?: Partial<Evaluation>
}

type CreateEvaluationForProjectRepositories = {
  evaluationRepository: Repository<Evaluation>
}

export async function createEvaluationForProject({
  repositories,
  organization,
  project,
  params = {},
}: {
  repositories: CreateEvaluationForProjectRepositories
  organization: Organization
  project: Project
  params?: CreateEvaluationForProjectParams
}): Promise<Evaluation> {
  const evaluation = evaluationFactory.transient({ organization, project }).build(params.evaluation)
  await repositories.evaluationRepository.save(evaluation)
  return evaluation
}
