import { Module } from "@nestjs/common"
import { AuthTokenGuard } from "./render/auth-token.guard"
import { RenderController } from "./render/render.controller"
import { RenderService } from "./render/render.service"

@Module({
  controllers: [RenderController],
  providers: [RenderService, AuthTokenGuard],
})
export class AppModule {}
