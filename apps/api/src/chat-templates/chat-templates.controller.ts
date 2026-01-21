import type {
  CreateChatTemplateRequestDto,
  TimeType,
  UpdateChatTemplateRequestDto,
} from "@caseai-connect/api-contracts"
import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common"
import { JwtAuthGuard } from "@/auth/jwt-auth.guard"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { UserBootstrapService } from "@/organizations/user-bootstrap.service"
import type { User } from "@/users/user.entity"
import { ChatTemplatesRoutes } from "./chat-templates.routes"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { ChatTemplatesService } from "./chat-templates.service"

interface Auth0JwtPayload {
  sub: string
  email?: string
  name?: string
  picture?: string
}

@UseGuards(JwtAuthGuard)
@Controller()
export class ChatTemplatesController {
  constructor(
    private readonly userBootstrapService: UserBootstrapService,
    private readonly chatTemplatesService: ChatTemplatesService,
  ) {}

  @Post(ChatTemplatesRoutes.createChatTemplate.path)
  async createChatTemplate(
    @Req() request: { user: Auth0JwtPayload },
    @Body() body: { payload: CreateChatTemplateRequestDto },
  ): Promise<typeof ChatTemplatesRoutes.createChatTemplate.response> {
    const user = await this.ensureUserFromRequest(request)

    // Create chat template
    const chatTemplate = await this.chatTemplatesService.createChatTemplate(
      user.id,
      body.payload.projectId,
      body.payload.name,
      body.payload.defaultPrompt,
    )

    return {
      data: {
        id: chatTemplate.id,
        name: chatTemplate.name,
        defaultPrompt: chatTemplate.defaultPrompt,
        projectId: chatTemplate.projectId,
      },
    }
  }

  @Get(ChatTemplatesRoutes.listChatTemplates.path)
  async listChatTemplates(
    @Req() request: { user: Auth0JwtPayload },
    @Param("projectId") projectId: string,
  ): Promise<typeof ChatTemplatesRoutes.listChatTemplates.response> {
    const user = await this.ensureUserFromRequest(request)

    // List chat templates for the project
    const chatTemplates = await this.chatTemplatesService.listChatTemplates(user.id, projectId)

    return {
      data: {
        chatTemplates: chatTemplates.map((chatTemplate) => ({
          id: chatTemplate.id,
          name: chatTemplate.name,
          defaultPrompt: chatTemplate.defaultPrompt,
          projectId: chatTemplate.projectId,
          createdAt: chatTemplate.createdAt.getTime() as TimeType,
          updatedAt: chatTemplate.updatedAt.getTime() as TimeType,
        })),
      },
    }
  }

  @Patch(ChatTemplatesRoutes.updateChatTemplate.path)
  async updateChatTemplate(
    @Req() request: { user: Auth0JwtPayload },
    @Param("chatTemplateId") chatTemplateId: string,
    @Body() body: { payload: UpdateChatTemplateRequestDto },
  ): Promise<typeof ChatTemplatesRoutes.updateChatTemplate.response> {
    const user = await this.ensureUserFromRequest(request)

    // Update chat template
    const chatTemplate = await this.chatTemplatesService.updateChatTemplate(
      user.id,
      chatTemplateId,
      body.payload.name,
      body.payload.defaultPrompt,
    )

    return {
      data: {
        id: chatTemplate.id,
        name: chatTemplate.name,
        defaultPrompt: chatTemplate.defaultPrompt,
        projectId: chatTemplate.projectId,
      },
    }
  }

  @Delete(ChatTemplatesRoutes.deleteChatTemplate.path)
  async deleteChatTemplate(
    @Req() request: { user: Auth0JwtPayload },
    @Param("chatTemplateId") chatTemplateId: string,
  ): Promise<typeof ChatTemplatesRoutes.deleteChatTemplate.response> {
    const user = await this.ensureUserFromRequest(request)

    // Delete chat template
    await this.chatTemplatesService.deleteChatTemplate(user.id, chatTemplateId)

    return {
      data: {
        success: true,
      },
    }
  }

  /**
   * Extracts Auth0 user info from JWT payload and ensures the user exists locally.
   * Returns the local User entity.
   */
  private async ensureUserFromRequest(request: { user: Auth0JwtPayload }): Promise<User> {
    const auth0UserInfo = {
      sub: request.user.sub,
      email: request.user.email,
      name: request.user.name,
      picture: request.user.picture,
    }

    return this.userBootstrapService.ensureUser(auth0UserInfo)
  }
}
