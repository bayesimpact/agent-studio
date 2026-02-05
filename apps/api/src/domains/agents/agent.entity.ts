import type { AgentLocale, AgentModel, AgentTemperature } from "@caseai-connect/api-contracts"
import { Column, JoinColumn, ManyToOne, OneToMany } from "typeorm"
import { ConnectEntity, ConnectEntityBase } from "@/common/entities/connect-entity"
import { AgentSession } from "@/domains/agent-sessions/agent-session.entity"
import { Project } from "@/domains/projects/project.entity"

@ConnectEntity("agent")
export class Agent extends ConnectEntityBase {
  @ManyToOne(
    () => Project,
    (project) => project.agents,
  )
  @JoinColumn({ name: "project_id" })
  project!: Project

  @Column({ type: "varchar" })
  name!: string

  @Column({ type: "text", name: "default_prompt" })
  defaultPrompt!: string

  @Column({ type: "varchar" })
  model!: AgentModel

  @Column({ type: "decimal", precision: 3, scale: 2, default: 0 })
  temperature!: AgentTemperature

  @Column({ type: "varchar" })
  locale!: AgentLocale

  @OneToMany(
    () => AgentSession,
    (agentSession) => agentSession.agent,
  )
  agentSessions!: AgentSession[]
}
