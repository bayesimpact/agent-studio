import { Controller, Get, Logger, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('protected')
export class ProtectedController {
  private readonly logger = new Logger(ProtectedController.name)

  @Get('hello')
  async getHello(
    @Req() request,
  ): Promise<string> {
    this.logger.warn(`Protected route accessed by user: ${request.user.sub}`);
    return `Protected api route accessed by user: ${request.user.sub}`;
  }
}
