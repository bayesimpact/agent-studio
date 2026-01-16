import { Module } from "@nestjs/common"
import { ProtectedController } from "./protected.controller"

@Module({
  imports: [],
  controllers: [ProtectedController],
})
export class ProtectedModule {}
