import type {
  AgentLocale,
  AgentModel,
  AgentTemperature,
  AgentType,
} from "@caseai-connect/api-contracts"
import { Column, JoinColumn, ManyToOne, OneToMany } from "typeorm"
import { ConnectEntity, ConnectEntityBase } from "@/common/entities/connect-entity"
import { AgentSession } from "@/domains/agent-sessions/agent-session.entity"
import { Project } from "@/domains/projects/project.entity"
import { EvaluationReport } from "../evaluations/reports/evaluation-report.entity"
import { ExtractionAgentSession } from "./extraction-agent-sessions/extraction-agent-session.entity"

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

  @Column({ type: "varchar", default: "conversation" })
  type!: AgentType

  @Column({ type: "text", nullable: true, name: "instruction_prompt" })
  instructionPrompt!: string | null

  @Column({ type: "jsonb", nullable: true, name: "output_json_schema" })
  outputJsonSchema!: Record<string, unknown> | null

  @OneToMany(
    () => AgentSession,
    (agentSession) => agentSession.agent,
  )
  agentSessions!: AgentSession[]

  @OneToMany(
    () => EvaluationReport,
    (evaluationReport) => evaluationReport.agent,
  )
  evaluationReports!: EvaluationReport[]

  @OneToMany(
    () => ExtractionAgentSession,
    (extractionAgentSession) => extractionAgentSession.agent,
  )
  extractionSessions!: ExtractionAgentSession[]
}
