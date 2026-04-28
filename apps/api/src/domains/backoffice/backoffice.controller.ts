import { BackofficeRoutes, type FeatureFlagKey, FeatureFlags } from "@caseai-connect/api-contracts"
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common"
import { JwtAuthGuard } from "@/domains/auth/jwt-auth.guard"
import { UserGuard } from "@/domains/users/user.guard"
import { TrackActivity } from "../activities/track-activity.decorator"
import { BackofficeGuard } from "./backoffice.guard"
import {
  toBackofficeOrganizationDto,
  toBackofficeProjectAgentCategoryDto,
  toBackofficeUserDto,
} from "./backoffice.helpers"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { BackofficeService } from "./backoffice.service"

const VALID_FEATURE_FLAG_KEYS = new Set<string>(FeatureFlags.map((flag) => flag.key))

function assertValidFeatureFlagKey(value: string): FeatureFlagKey {
  if (!VALID_FEATURE_FLAG_KEYS.has(value)) {
    throw new BadRequestException(`Unknown feature flag key: ${value}`)
  }
  return value as FeatureFlagKey
}

@UseGuards(JwtAuthGuard, UserGuard, BackofficeGuard)
@Controller()
export class BackofficeController {
  constructor(private readonly backofficeService: BackofficeService) {}

  @Get(BackofficeRoutes.listOrganizations.path)
  async listOrganizations(): Promise<typeof BackofficeRoutes.listOrganizations.response> {
    const organizations = await this.backofficeService.listOrganizationsWithProjects()
    return {
      data: organizations.map((organization) =>
        toBackofficeOrganizationDto({ ...organization, projects: organization.projects ?? [] }),
      ),
    }
  }

  @Get(BackofficeRoutes.listUsers.path)
  async listUsers(): Promise<typeof BackofficeRoutes.listUsers.response> {
    const users = await this.backofficeService.listUsersWithMemberships()
    return { data: users.map(toBackofficeUserDto) }
  }

  @Post(BackofficeRoutes.addFeatureFlag.path)
  @TrackActivity({ action: "add_feature_flag", entityFrom: "project" })
  async addFeatureFlag(
    @Param("projectId") projectId: string,
    @Body() body: typeof BackofficeRoutes.addFeatureFlag.request,
  ): Promise<typeof BackofficeRoutes.addFeatureFlag.response> {
    const featureFlagKey = assertValidFeatureFlagKey(body.payload.featureFlagKey)
    await this.backofficeService.addFeatureFlag({ projectId, featureFlagKey })
    return { data: { success: true } }
  }

  @Delete(BackofficeRoutes.removeFeatureFlag.path)
  @TrackActivity({ action: "add_feature_flag", entityFrom: "project" })
  async removeFeatureFlag(
    @Param("projectId") projectId: string,
    @Param("featureFlagKey") featureFlagKey: string,
  ): Promise<typeof BackofficeRoutes.removeFeatureFlag.response> {
    const validatedKey = assertValidFeatureFlagKey(featureFlagKey)
    await this.backofficeService.removeFeatureFlag({ projectId, featureFlagKey: validatedKey })
    return { data: { success: true } }
  }

  @Patch(BackofficeRoutes.replaceProjectAgentCategories.path)
  @TrackActivity({ action: "replace_project_agent_categories", entityFrom: "project" })
  async replaceProjectAgentCategories(
    @Param("projectId") projectId: string,
    @Body() body: typeof BackofficeRoutes.replaceProjectAgentCategories.request,
  ): Promise<typeof BackofficeRoutes.replaceProjectAgentCategories.response> {
    const categories = await this.backofficeService.replaceProjectAgentCategories({
      projectId,
      categoryNames: body.payload.categoryNames,
    })
    return { data: categories.map(toBackofficeProjectAgentCategoryDto) }
  }
}
