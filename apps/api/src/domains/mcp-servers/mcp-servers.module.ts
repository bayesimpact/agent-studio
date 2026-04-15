import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { TypeOrmModule } from "@nestjs/typeorm"
import { AgentMcpServer } from "./agent-mcp-server.entity"
import { EncryptionService } from "./encryption.service"
import { McpServer } from "./mcp-server.entity"
import { McpServersService } from "./mcp-servers.service"

@Module({
  imports: [TypeOrmModule.forFeature([McpServer, AgentMcpServer]), ConfigModule],
  providers: [McpServersService, EncryptionService],
  exports: [McpServersService],
})
export class McpServersModule {}
