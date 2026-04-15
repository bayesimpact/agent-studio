import { Column, Entity, JoinColumn, ManyToOne, OneToMany, Unique } from "typeorm"
import { Base4AllEntity } from "@/common/entities/base4all.entity"
import { Project } from "@/domains/projects/project.entity"
import { AgentMcpServer } from "./agent-mcp-server.entity"

@Entity("mcp_server")
@Unique(["presetSlug"])
export class McpServer extends Base4AllEntity {
  @Column({ type: "varchar" })
  name!: string

  @Column({ type: "varchar", name: "preset_slug", nullable: true })
  presetSlug!: string | null

  @Column({ type: "uuid", name: "project_id", nullable: true })
  projectId!: string | null

  @ManyToOne(() => Project, { nullable: true })
  @JoinColumn({ name: "project_id" })
  project!: Project | null

  @Column({ type: "text", name: "encrypted_config" })
  encryptedConfig!: string

  @OneToMany(
    () => AgentMcpServer,
    (agentMcpServer) => agentMcpServer.mcpServer,
  )
  agentMcpServers!: AgentMcpServer[]
}
