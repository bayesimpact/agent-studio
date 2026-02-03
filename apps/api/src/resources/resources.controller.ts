import { Controller, UseGuards } from "@nestjs/common"
import { JwtAuthGuard } from "@/auth/jwt-auth.guard"
import { UserGuard } from "@/guards/user.guard"
import type { ResourcesService } from "./resources.service"

@UseGuards(JwtAuthGuard, UserGuard)
@Controller()
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}
}
