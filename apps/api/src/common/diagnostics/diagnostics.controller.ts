import { Controller, Get, NotFoundException, Param } from "@nestjs/common"

@Controller("diagnostics")
export class DiagnosticsController {
  private readonly secret = process.env.DIAGNOSTICS_SECRET

  @Get(":secret/test-error")
  testError(@Param("secret") secret: string): never {
    if (!this.secret || secret !== this.secret) throw new NotFoundException()
    throw new Error("Diagnostics test error — verifying error reporting pipeline")
  }
}
