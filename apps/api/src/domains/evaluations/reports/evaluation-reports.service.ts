import { AgentModel, type AgentTemperature } from "@caseai-connect/api-contracts"
import {
  Inject,
  Injectable,
  NotFoundException,
  NotImplementedException,
  UnprocessableEntityException,
} from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { ConnectRepository } from "@/common/entities/connect-repository"
import type { RequiredConnectScope } from "@/common/entities/connect-required-fields"
import type {
  LLMConfig,
  LLMMetadata,
  LLMProvider,
} from "@/common/interfaces/llm-provider.interface"
import type { Agent } from "@/domains/agents/agent.entity"
import { Evaluation } from "@/domains/evaluations/evaluation.entity"
import { AgentModelToAgentProvider, AgentProvider } from "@/external/llm/agent-provider"
import { EvaluationReport } from "./evaluation-report.entity"

@Injectable()
export class EvaluationReportsService {
  constructor(
    @InjectRepository(Evaluation)
    evaluationRepository: Repository<Evaluation>,
    @InjectRepository(EvaluationReport)
    reportRepository: Repository<EvaluationReport>,
    @Inject("_MockLLMProvider")
    private readonly _mockLlmProvider: LLMProvider,
    @Inject("VertexLLMProvider")
    private readonly vertexLlmProvider: LLMProvider,
  ) {
    this.evaluationConnectRepository = new ConnectRepository(evaluationRepository, "evaluations")
    this.reportConnectRepository = new ConnectRepository(reportRepository, "evaluation_reports")
  }
  private readonly reportConnectRepository: ConnectRepository<EvaluationReport>

  async createReport({
    connectScope,
    evaluationId,
    fields,
  }: {
    connectScope: RequiredConnectScope
    evaluationId: string
    fields: Pick<EvaluationReport, "agentId" | "traceId" | "output" | "score">
  }): Promise<EvaluationReport> {
    return await this.reportConnectRepository.createAndSave(connectScope, {
      ...fields,
      evaluationId,
    })
  }

  async listReports({
    connectScope,
    evaluationId,
  }: {
    connectScope: RequiredConnectScope
    evaluationId: string
  }): Promise<EvaluationReport[]> {
    const reports = await this.reportConnectRepository.find(connectScope, {
      where: { evaluationId },
    })
    return reports
  }

  async findById({
    connectScope,
    reportId,
  }: {
    connectScope: RequiredConnectScope
    reportId: string
  }): Promise<EvaluationReport | null> {
    return this.reportConnectRepository.getOneById(connectScope, reportId)
  }

  async updateReport({
    connectScope,
    required,
    fieldsToUpdate,
  }: {
    connectScope: RequiredConnectScope
    required: { reportId: string }
    fieldsToUpdate: Partial<Pick<EvaluationReport, "agentId" | "traceId" | "output" | "score">>
  }): Promise<EvaluationReport> {
    const { reportId } = required
    const { agentId, traceId, output, score } = fieldsToUpdate

    if (agentId !== undefined && !agentId.trim()) {
      throw new UnprocessableEntityException("Agent ID is required")
    }

    if (traceId !== undefined && !traceId.trim()) {
      throw new UnprocessableEntityException("Trace ID is required")
    }

    if (output !== undefined && !output.trim()) {
      throw new UnprocessableEntityException("Output is required")
    }

    if (score !== undefined && !score.trim()) {
      throw new UnprocessableEntityException("Score is required")
    }

    const report = await this.reportConnectRepository.getOneById(connectScope, reportId)

    if (!report) {
      throw new NotFoundException(`Report with id ${reportId} not found`)
    }

    Object.assign(report, {
      ...(agentId !== undefined && { agentId }),
      ...(traceId !== undefined && { traceId }),
      ...(output !== undefined && { output }),
      ...(score !== undefined && { score }),
    })

    return await this.reportConnectRepository.saveOne(report)
  }

  async deleteReport({
    connectScope,
    reportId,
  }: {
    connectScope: RequiredConnectScope
    reportId: string
  }): Promise<void> {
    const isDeleted = await this.reportConnectRepository.deleteOneById({
      connectScope,
      id: reportId,
    })

    if (!isDeleted) {
      throw new NotFoundException(`Report with id ${reportId} not found`)
    }
  }

  async processReport({
    agent,
    evaluation,
    evaluationReport,
  }: {
    agent: Agent
    evaluation: Evaluation
    evaluationReport: EvaluationReport
  }): Promise<string> {
    const llmConfig = this.buildLLMConfig({
      systemPrompt: this.generateMasterPrompt(agent),
      model: agent.model,
      temperature: agent.temperature,
    })

    const llmMetadata: LLMMetadata = this.buildLLMMetadata({ agent, evaluationReport })
    return await this.getProviderForModel(llmConfig.model).generateText({
      prompt: evaluation.input,
      config: llmConfig,
      metadata: llmMetadata,
    })
  }

  async rateReport({
    evaluationReport,
    generatedValue,
    expectedValue,
    generatorAgent,
  }: {
    evaluationReport: EvaluationReport
    generatedValue: string
    expectedValue: string
    generatorAgent: Agent
  }): Promise<string> {
    const ratingAgent = {
      systemPrompt: `
 You are a rating agent. Your job is to evaluate a string value and return a score from 0 to 100.
 The string value is '%value'.
 The instructions to do the rating are '%ratingInstructions'
 You have to consider the '%ratingInstructions' and only them to evaluate the '%value'
 Your rating rules are the following:
    - return a value between 0 and 100, step 1
    - 100 is the maximum and signify that the '%value' completely satisfies the '%ratingInstructions'.
    - 0 signifies that the '%value' is fully far away the '%ratingInstructions'.
`,
      model: AgentModel.Gemini25Flash,
      temperature: 0,
    }

    //fixme: remove when specific agent for rating with mock
    if (AgentModelToAgentProvider[generatorAgent.model] === AgentProvider._Mock)
      ratingAgent.model = AgentModel._MockGenerateText

    const llmConfig = this.buildLLMConfig(ratingAgent)
    const llmMetadata: LLMMetadata = {
      traceId: evaluationReport.traceId,
      evaluationReportId: evaluationReport.id,
      agentId: "Custom-Rating-Agent",
      projectId: "*N/A*",
      organizationId: evaluationReport.organizationId,
      tags: ["*Rating Agent*"],
    }
    return await this.getProviderForModel(llmConfig.model).generateText({
      prompt: `    
<%ratingInstructions>
${expectedValue}
<%/ratingInstructions>

<%value>
${generatedValue}
</%value>

return only the rating value (0 to 100), no sentence`,
      config: llmConfig,
      metadata: llmMetadata,
    })
  }

  //fixme DOO: below is temp : create base class (ServiceWithLLM) common to streaming service
  getProviderForModel(model: string): LLMProvider {
    const provider = AgentModelToAgentProvider[model]
    switch (provider) {
      case AgentProvider._Mock:
        return this._mockLlmProvider
      case AgentProvider.Vertex:
        return this.vertexLlmProvider
      default:
        throw new NotImplementedException(`not supported llm provider: ${provider}`)
    }
  }
  private buildLLMConfig({
    systemPrompt,
    model,
    temperature,
  }: {
    systemPrompt: string
    model: AgentModel
    temperature: AgentTemperature
  }): LLMConfig {
    // Convert temperature to number (database decimal types may be returned as strings)
    const safeTemperature =
      typeof temperature === "string" ? parseFloat(temperature) : Number(temperature)

    // Validate temperature is a valid number
    if (Number.isNaN(safeTemperature) || safeTemperature < 0 || safeTemperature > 2) {
      throw new Error(
        `Invalid temperature value: ${safeTemperature}. Temperature must be a number between 0 and 2.`,
      )
    }
    return {
      model,
      temperature: safeTemperature,
      systemPrompt,
    }
  }
  private buildLLMMetadata({
    agent,
    evaluationReport,
  }: {
    agent: Pick<Agent, "name" | "id" | "projectId">
    evaluationReport: EvaluationReport
  }): LLMMetadata {
    return {
      traceId: evaluationReport.traceId,
      evaluationReportId: evaluationReport.id,
      agentId: agent.id,
      projectId: agent.projectId,
      organizationId: evaluationReport.organizationId,
      tags: [agent.name],
    }
  }
  private generateMasterPrompt(agent: Agent): string {
    return `
Today's date: ${new Date().toLocaleDateString()}

${agent.defaultPrompt}

# Attachment:
If there is a file (image or pdf) attached to the user's chat message, answer the user's question or instruction reading the content of the file.

Always answer in ${agent.locale}.
  `.trim()
  }
}
