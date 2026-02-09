import type { AgentLocale, AgentModel, AgentTemperature } from "@caseai-connect/api-contracts"
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm"
import { Base4AllEntity } from "@/common/entities/base4all.entity"
import { AgentSession } from "@/domains/agent-sessions/agent-session.entity"
import { Project } from "@/domains/projects/project.entity"

@Entity("agent")
export class Agent extends Base4AllEntity {
  @Column({ type: "uuid", name: "project_id" })
  projectId!: string

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
