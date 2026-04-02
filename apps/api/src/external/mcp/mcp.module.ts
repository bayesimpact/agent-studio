import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { McpClientService } from "./mcp-client.service"

@Module({
  imports: [ConfigModule],
  providers: [McpClientService],
  exports: [McpClientService],
})
export class McpModule {}
