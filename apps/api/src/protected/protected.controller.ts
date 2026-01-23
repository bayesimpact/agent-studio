import { ProtectedRoutes } from "@caseai-connect/api-contracts"
import { Controller, Get, HttpCode, HttpStatus, Logger, Req, UseGuards } from "@nestjs/common"
import { JwtAuthGuard } from "../auth/jwt-auth.guard"

@UseGuards(JwtAuthGuard)
@Controller()
export class ProtectedController {
  private readonly logger = new Logger(ProtectedController.name)

  @Get(ProtectedRoutes.getHello.path)
  @HttpCode(HttpStatus.OK)
  async getHello(@Req() request): Promise<typeof ProtectedRoutes.getHello.response> {
    this.logger.warn(`Protected route accessed by user: ${request.user.sub}`)
    return { data: `Protected api route accessed by user: ${request.user.sub}` }
  }
}
