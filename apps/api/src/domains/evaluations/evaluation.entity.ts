import { Column, JoinColumn, ManyToOne, OneToMany } from "typeorm"
import { ConnectEntity, ConnectEntityBase } from "@/common/entities/connect-entity"
import { Project } from "@/domains/projects/project.entity"
import { EvaluationReport } from "./reports/evaluation-report.entity"

@ConnectEntity("evaluation")
export class Evaluation extends ConnectEntityBase {
  @ManyToOne(
    () => Project,
    (project) => project.evaluations,
  )
  @JoinColumn({ name: "project_id" })
  project!: Project

  @Column({ name: "input", nullable: false })
  input!: string

  @Column({ name: "expected_output", nullable: false })
  expectedOutput!: string

  @OneToMany(
    () => EvaluationReport,
    (report) => report.evaluation,
  )
  reports!: EvaluationReport[]
}
