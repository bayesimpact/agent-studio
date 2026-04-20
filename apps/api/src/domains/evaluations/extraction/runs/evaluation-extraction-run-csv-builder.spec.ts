import type {
  EvaluationExtractionDataset,
  EvaluationExtractionDatasetSchemaMapping,
} from "../datasets/evaluation-extraction-dataset.entity"
import type { EvaluationExtractionDatasetRecord } from "../datasets/records/evaluation-extraction-dataset-record.entity"
import type {
  EvaluationExtractionRun,
  EvaluationExtractionRunKeyMapping,
} from "./evaluation-extraction-run.entity"
import {
  buildEvaluationRunCsv,
  buildEvaluationRunCsvFileName,
} from "./evaluation-extraction-run-csv-builder"
import type {
  EvaluationExtractionRunRecord,
  EvaluationExtractionRunRecordComparison,
  EvaluationExtractionRunRecordStatus,
} from "./records/evaluation-extraction-run-record.entity"

const UTF8_BOM = "\uFEFF"

const INPUT_ID = "col-input"
const IGNORE_ID = "col-ignore"
const TARGET_A_ID = "col-target-a"

const schemaMapping: EvaluationExtractionDatasetSchemaMapping = {
  [INPUT_ID]: {
    id: INPUT_ID,
    index: 0,
    originalName: "Title",
    finalName: "title",
    role: "input",
  },
  [IGNORE_ID]: {
    id: IGNORE_ID,
    index: 1,
    originalName: "Notes",
    finalName: "notes",
    role: "ignore",
  },
  [TARGET_A_ID]: {
    id: TARGET_A_ID,
    index: 2,
    originalName: "Screening",
    finalName: "screening",
    role: "target",
  },
}

const keyMapping: EvaluationExtractionRunKeyMapping = [
  { agentOutputKey: "decision", datasetColumnId: TARGET_A_ID, mode: "scored" },
  { agentOutputKey: "justification", datasetColumnId: TARGET_A_ID, mode: "fyi" },
]

function buildDataset(): EvaluationExtractionDataset {
  return { name: "Dataset", schemaMapping } as EvaluationExtractionDataset
}

function buildRun(overrides: Partial<EvaluationExtractionRun> = {}): EvaluationExtractionRun {
  return { keyMapping, ...overrides } as EvaluationExtractionRun
}

function buildRecord({
  data,
  comparison,
  status = "match",
}: {
  data: Record<string, unknown>
  comparison: EvaluationExtractionRunRecordComparison | null
  status?: EvaluationExtractionRunRecordStatus
}): EvaluationExtractionRunRecord & {
  evaluationExtractionDatasetRecord: EvaluationExtractionDatasetRecord
} {
  return {
    status,
    comparison,
    evaluationExtractionDatasetRecord: { data } as EvaluationExtractionDatasetRecord,
  } as EvaluationExtractionRunRecord & {
    evaluationExtractionDatasetRecord: EvaluationExtractionDatasetRecord
  }
}

function parseLines(csv: Buffer): string[] {
  const text = csv.toString("utf-8")
  expect(text.startsWith(UTF8_BOM)).toBe(true)
  return text.slice(UTF8_BOM.length).split("\r\n")
}

describe("buildEvaluationRunCsv", () => {
  it("starts with the UTF-8 BOM", () => {
    const csv = buildEvaluationRunCsv({
      dataset: buildDataset(),
      run: buildRun(),
      records: [],
    })
    expect(csv.toString("utf-8").charCodeAt(0)).toBe(0xfeff)
  })

  it("builds headers with role-labeled dataset columns, agent columns, then Status", () => {
    const csv = buildEvaluationRunCsv({
      dataset: buildDataset(),
      run: buildRun(),
      records: [],
    })
    const lines = parseLines(csv)
    expect(lines[0]).toBe(
      [
        "Title (input)",
        "Notes (ignore)",
        "Screening (target)",
        "decision (agent)",
        "justification (agent)",
        "Status",
      ].join(","),
    )
  })

  it("emits dataset values in schema order, then agent values, then raw status", () => {
    const csv = buildEvaluationRunCsv({
      dataset: buildDataset(),
      run: buildRun(),
      records: [
        buildRecord({
          data: { [INPUT_ID]: "Paper", [IGNORE_ID]: "note", [TARGET_A_ID]: "Irrelevant" },
          comparison: {
            decision: { agentValue: "Irrelevant", groundTruth: "Irrelevant", status: "match" },
            justification: { agentValue: "Some reason", groundTruth: null, status: "fyi" },
          },
        }),
      ],
    })
    const lines = parseLines(csv)
    expect(lines[1]).toBe("Paper,note,Irrelevant,Irrelevant,Some reason,match")
  })

  it("emits empty cells for missing dataset values and agent values", () => {
    const csv = buildEvaluationRunCsv({
      dataset: buildDataset(),
      run: buildRun(),
      records: [
        buildRecord({
          data: { [INPUT_ID]: "", [IGNORE_ID]: null, [TARGET_A_ID]: undefined },
          comparison: {},
        }),
      ],
    })
    const lines = parseLines(csv)
    expect(lines[1]).toBe(",,,,,match")
  })

  it("preserves the raw error status and omits agent values when comparison is missing", () => {
    const csv = buildEvaluationRunCsv({
      dataset: buildDataset(),
      run: buildRun(),
      records: [
        buildRecord({
          status: "error",
          data: { [INPUT_ID]: "Paper", [IGNORE_ID]: "", [TARGET_A_ID]: "Relevant" },
          comparison: null,
        }),
      ],
    })
    const lines = parseLines(csv)
    expect(lines[1]).toBe("Paper,,Relevant,,,error")
  })

  it("escapes cells containing commas, quotes, and newlines", () => {
    const csv = buildEvaluationRunCsv({
      dataset: buildDataset(),
      run: buildRun(),
      records: [
        buildRecord({
          data: {
            [INPUT_ID]: 'has "quote", and,comma',
            [IGNORE_ID]: "line1\nline2",
            [TARGET_A_ID]: "plain",
          },
          comparison: {
            decision: { agentValue: "plain", groundTruth: "plain", status: "match" },
            justification: { agentValue: "line1\nline2", groundTruth: null, status: "fyi" },
          },
        }),
      ],
    })
    const lines = parseLines(csv)
    expect(lines[1]).toBe(
      `"has ""quote"", and,comma","line1\nline2",plain,plain,"line1\nline2",match`,
    )
  })

  it("emits only dataset columns and Status when key mapping is empty", () => {
    const csv = buildEvaluationRunCsv({
      dataset: buildDataset(),
      run: buildRun({ keyMapping: [] }),
      records: [
        buildRecord({
          data: { [INPUT_ID]: "a", [IGNORE_ID]: "b", [TARGET_A_ID]: "c" },
          comparison: {},
        }),
      ],
    })
    const lines = parseLines(csv)
    expect(lines[0]).toBe("Title (input),Notes (ignore),Screening (target),Status")
    expect(lines[1]).toBe("a,b,c,match")
  })
})

describe("buildEvaluationRunCsvFileName", () => {
  it("constructs the canonical filename", () => {
    expect(buildEvaluationRunCsvFileName({ datasetName: "My Dataset", runId: "abc-123" })).toBe(
      "My_Dataset_abc-123_Results.csv",
    )
  })

  it("strips unsafe characters", () => {
    expect(buildEvaluationRunCsvFileName({ datasetName: "na/me:*bad?", runId: "run" })).toBe(
      "na_me_bad_run_Results.csv",
    )
  })

  it("falls back to 'dataset' when the name reduces to empty", () => {
    expect(buildEvaluationRunCsvFileName({ datasetName: "///", runId: "r1" })).toBe(
      "dataset_r1_Results.csv",
    )
  })
})
