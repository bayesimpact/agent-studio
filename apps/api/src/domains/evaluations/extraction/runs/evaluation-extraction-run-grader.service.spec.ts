import type { EvaluationExtractionDatasetRecordData } from "../datasets/records/evaluation-extraction-dataset-record.entity"
import type { EvaluationExtractionRunKeyMapping } from "./evaluation-extraction-run.entity"
import { EvaluationExtractionRunGraderService } from "./evaluation-extraction-run-grader.service"

describe("EvaluationExtractionRunGraderService", () => {
  let grader: EvaluationExtractionRunGraderService

  beforeEach(() => {
    grader = new EvaluationExtractionRunGraderService()
  })

  it("should return match when all scored fields match exactly", () => {
    const keyMapping: EvaluationExtractionRunKeyMapping = [
      { agentOutputKey: "age_val", datasetColumnId: "col_age", mode: "scored" },
      { agentOutputKey: "cat_val", datasetColumnId: "col_category", mode: "scored" },
    ]
    const agentOutput = { age_val: "45", cat_val: "A" }
    const datasetRecordData: EvaluationExtractionDatasetRecordData = {
      col_age: "45",
      col_category: "A",
    }

    const result = grader.gradeRecord({ agentOutput, datasetRecordData, keyMapping })

    expect(result.status).toBe("match")
    expect(result.comparison.age_val!.status).toBe("match")
    expect(result.comparison.cat_val!.status).toBe("match")
  })

  it("should return mismatch when a scored field differs", () => {
    const keyMapping: EvaluationExtractionRunKeyMapping = [
      { agentOutputKey: "age_val", datasetColumnId: "col_age", mode: "scored" },
      { agentOutputKey: "cat_val", datasetColumnId: "col_category", mode: "scored" },
    ]
    const agentOutput = { age_val: "45", cat_val: "B" }
    const datasetRecordData: EvaluationExtractionDatasetRecordData = {
      col_age: "45",
      col_category: "A",
    }

    const result = grader.gradeRecord({ agentOutput, datasetRecordData, keyMapping })

    expect(result.status).toBe("mismatch")
    expect(result.comparison.age_val!.status).toBe("match")
    expect(result.comparison.cat_val!.status).toBe("mismatch")
  })

  it("should be case-insensitive", () => {
    const keyMapping: EvaluationExtractionRunKeyMapping = [
      { agentOutputKey: "cat_val", datasetColumnId: "col_category", mode: "scored" },
    ]
    const agentOutput = { cat_val: "YES" }
    const datasetRecordData: EvaluationExtractionDatasetRecordData = { col_category: "yes" }

    const result = grader.gradeRecord({ agentOutput, datasetRecordData, keyMapping })

    expect(result.status).toBe("match")
    expect(result.comparison.cat_val!.status).toBe("match")
  })

  it("should trim whitespace before comparing", () => {
    const keyMapping: EvaluationExtractionRunKeyMapping = [
      { agentOutputKey: "cat_val", datasetColumnId: "col_category", mode: "scored" },
    ]
    const agentOutput = { cat_val: "  hello  " }
    const datasetRecordData: EvaluationExtractionDatasetRecordData = { col_category: "hello" }

    const result = grader.gradeRecord({ agentOutput, datasetRecordData, keyMapping })

    expect(result.status).toBe("match")
    expect(result.comparison.cat_val!.status).toBe("match")
  })

  it("should match null to null", () => {
    const keyMapping: EvaluationExtractionRunKeyMapping = [
      { agentOutputKey: "age_val", datasetColumnId: "col_age", mode: "scored" },
    ]
    const agentOutput = { age_val: null }
    const datasetRecordData: EvaluationExtractionDatasetRecordData = { col_age: null }

    const result = grader.gradeRecord({ agentOutput, datasetRecordData, keyMapping })

    expect(result.status).toBe("match")
    expect(result.comparison.age_val!.status).toBe("match")
  })

  it("should match undefined to null", () => {
    const keyMapping: EvaluationExtractionRunKeyMapping = [
      { agentOutputKey: "missing_key", datasetColumnId: "col_age", mode: "scored" },
    ]
    const agentOutput = {}
    const datasetRecordData: EvaluationExtractionDatasetRecordData = { col_age: null }

    const result = grader.gradeRecord({ agentOutput, datasetRecordData, keyMapping })

    expect(result.status).toBe("match")
    expect(result.comparison.missing_key!.status).toBe("match")
  })

  it("should mismatch null vs non-null", () => {
    const keyMapping: EvaluationExtractionRunKeyMapping = [
      { agentOutputKey: "age_val", datasetColumnId: "col_age", mode: "scored" },
    ]
    const agentOutput = { age_val: null }
    const datasetRecordData: EvaluationExtractionDatasetRecordData = { col_age: "45" }

    const result = grader.gradeRecord({ agentOutput, datasetRecordData, keyMapping })

    expect(result.status).toBe("mismatch")
    expect(result.comparison.age_val!.status).toBe("mismatch")
  })

  it("should treat N/A, NaN, empty string, NA as null (match with null)", () => {
    const nullishValues = ["N/A", "NaN", "", "null", "NULL", "NA"]

    for (const nullishValue of nullishValues) {
      const keyMapping: EvaluationExtractionRunKeyMapping = [
        { agentOutputKey: "age_val", datasetColumnId: "col_age", mode: "scored" },
      ]
      const agentOutput = { age_val: nullishValue }
      const datasetRecordData: EvaluationExtractionDatasetRecordData = { col_age: null }

      const result = grader.gradeRecord({
        agentOutput,
        datasetRecordData,
        keyMapping,
      })

      expect(result.status).toBe("match")
      expect(result.comparison.age_val!.status).toBe("match")
    }
  })

  it("should mark fyi fields without scoring them", () => {
    const keyMapping: EvaluationExtractionRunKeyMapping = [
      { agentOutputKey: "age_val", datasetColumnId: "col_age", mode: "scored" },
      { agentOutputKey: "summary_text", datasetColumnId: "col_summary", mode: "fyi" },
    ]
    const agentOutput = { age_val: "45", summary_text: "A summary" }
    const datasetRecordData: EvaluationExtractionDatasetRecordData = {
      col_age: "45",
      col_summary: "Different summary",
    }

    const result = grader.gradeRecord({ agentOutput, datasetRecordData, keyMapping })

    expect(result.status).toBe("match")
    expect(result.comparison.summary_text!.status).toBe("fyi")
    expect(result.comparison.summary_text!.agentValue).toBe("A summary")
  })

  it("should return match with an empty key mapping", () => {
    const keyMapping: EvaluationExtractionRunKeyMapping = []
    const agentOutput = { some_key: "value" }
    const datasetRecordData: EvaluationExtractionDatasetRecordData = { col_age: "45" }

    const result = grader.gradeRecord({ agentOutput, datasetRecordData, keyMapping })

    expect(result.status).toBe("match")
    expect(result.comparison).toEqual({})
  })

  it("should compare numbers as strings", () => {
    const keyMapping: EvaluationExtractionRunKeyMapping = [
      { agentOutputKey: "age_val", datasetColumnId: "col_age", mode: "scored" },
    ]
    const agentOutput = { age_val: 45 }
    const datasetRecordData: EvaluationExtractionDatasetRecordData = { col_age: "45" }

    const result = grader.gradeRecord({ agentOutput, datasetRecordData, keyMapping })

    expect(result.status).toBe("match")
    expect(result.comparison.age_val!.status).toBe("match")
  })

  it("should use agentOutputKey as comparison key", () => {
    const keyMapping: EvaluationExtractionRunKeyMapping = [
      { agentOutputKey: "val", datasetColumnId: "unknown_col", mode: "scored" },
    ]
    const agentOutput = { val: "test" }
    const datasetRecordData: EvaluationExtractionDatasetRecordData = { unknown_col: "test" }

    const result = grader.gradeRecord({ agentOutput, datasetRecordData, keyMapping })

    expect(result.status).toBe("match")
    expect(result.comparison.val).toBeDefined()
    expect(result.comparison.val!.status).toBe("match")
  })
})
