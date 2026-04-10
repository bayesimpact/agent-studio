import { type EvaluationDto, EvaluationsRoutes } from "@caseai-connect/api-contracts"
import { Body, Controller, Delete, Get, Patch, Post, Req, UseGuards } from "@nestjs/common"
import type {
  EndpointRequestWithEvaluation,
  EndpointRequestWithProject,
} from "@/common/context/request.interface"
import { getRequiredConnectScope } from "@/common/context/request-context.helpers"
import { AddContext, RequireContext } from "@/common/context/require-context.decorator"
import { ResourceContextGuard } from "@/common/context/resource-context.guard"
import { CheckPolicy } from "@/common/policies/check-policy.decorator"
import { TrackActivity } from "@/domains/activities/track-activity.decorator"
import { JwtAuthGuard } from "@/domains/auth/jwt-auth.guard"
import { UserGuard } from "@/domains/users/user.guard"
import type { Evaluation } from "./evaluation.entity"
import { EvaluationGuard } from "./evaluation.guard"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { EvaluationsService } from "./evaluations.service"

@UseGuards(JwtAuthGuard, UserGuard, ResourceContextGuard, EvaluationGuard)
@RequireContext("organization", "project")
@Controller()
export class EvaluationsController {
  constructor(private readonly evaluationsService: EvaluationsService) {}

  @Post(EvaluationsRoutes.createOne.path)
  @CheckPolicy((policy) => policy.canCreate())
  @TrackActivity({ action: "evaluation.create" })
  async createOne(
    @Req() request: EndpointRequestWithProject,
    @Body() { payload }: typeof EvaluationsRoutes.createOne.request,
  ): Promise<typeof EvaluationsRoutes.createOne.response> {
    const evaluation = await this.evaluationsService.createEvaluation({
      connectScope: getRequiredConnectScope(request),
      fields: payload,
    })

    return { data: toEvaluationDto(evaluation) }
  }

  @Get(EvaluationsRoutes.getAll.path)
  @CheckPolicy((policy) => policy.canList())
  async getAll(
    @Req() request: EndpointRequestWithProject,
  ): Promise<typeof EvaluationsRoutes.getAll.response> {
    const evaluations = await this.evaluationsService.listEvaluations(
      getRequiredConnectScope(request),
    )

    return { data: { evaluations: evaluations.map(toEvaluationDto) } }
  }

  @Patch(EvaluationsRoutes.updateOne.path)
  @CheckPolicy((policy) => policy.canUpdate())
  @AddContext("evaluation")
  @TrackActivity({ action: "evaluation.update", entityFrom: "evaluation" })
  async updateOne(
    @Req() request: EndpointRequestWithEvaluation,
    @Body() { payload }: typeof EvaluationsRoutes.updateOne.request,
  ): Promise<typeof EvaluationsRoutes.updateOne.response> {
    const evaluationId = request.evaluation.id

    await this.evaluationsService.updateEvaluation({
      connectScope: getRequiredConnectScope(request),
      required: { evaluationId },
      fieldsToUpdate: payload,
    })

    return { data: { success: true } }
  }

  @Delete(EvaluationsRoutes.deleteOne.path)
  @CheckPolicy((policy) => policy.canDelete())
  @AddContext("evaluation")
  @TrackActivity({ action: "evaluation.delete", entityFrom: "evaluation" })
  async deleteOne(
    @Req() request: EndpointRequestWithEvaluation,
  ): Promise<typeof EvaluationsRoutes.deleteOne.response> {
    await this.evaluationsService.deleteEvaluation({
      connectScope: getRequiredConnectScope(request),
      evaluationId: request.evaluation.id,
    })

    return { data: { success: true } }
  }
}

function toEvaluationDto(entity: Evaluation): EvaluationDto {
  return {
    createdAt: entity.createdAt.getTime(),
    expectedOutput: entity.expectedOutput,
    id: entity.id,
    input: entity.input,
    projectId: entity.projectId,
    updatedAt: entity.updatedAt.getTime(),
  }
}
