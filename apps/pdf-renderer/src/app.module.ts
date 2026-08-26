import { Module } from "@nestjs/common"
import { RenderController } from "./render/render.controller"
import { RenderService } from "./render/render.service"

// No app-level auth: in production the service sits behind Cloud Run invoker
// IAM (only identities with roles/run.invoker reach the container), and
// locally it is only bound on the developer's machine.
@Module({
  controllers: [RenderController],
  providers: [RenderService],
})
export class AppModule {}
