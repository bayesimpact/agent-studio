import { randomUUID } from "node:crypto"
import { Factory } from "fishery"
import type { Document } from "@/domains/documents/document.entity"
import type { EvaluationExtractionDataset } from "./evaluation-extraction-dataset.entity"
import type { EvaluationExtractionDatasetDocument } from "./evaluation-extraction-dataset-document.entity"

type EvaluationExtractionDatasetDocumentTransientParams = {
  evaluationExtractionDataset: EvaluationExtractionDataset
  document: Document
}

class EvaluationExtractionDatasetDocumentFactory extends Factory<
  EvaluationExtractionDatasetDocument,
  EvaluationExtractionDatasetDocumentTransientParams
> {}

export const evaluationExtractionDatasetDocumentFactory =
  EvaluationExtractionDatasetDocumentFactory.define(({ params, transientParams }) => {
    if (!transientParams.evaluationExtractionDataset) {
      throw new Error("evaluationExtractionDataset transient is required")
    }
    if (!transientParams.document) {
      throw new Error("document transient is required")
    }

    const now = new Date()
    return {
      id: params.id || randomUUID(),
      evaluationExtractionDatasetId: transientParams.evaluationExtractionDataset.id,
      evaluationExtractionDataset: transientParams.evaluationExtractionDataset,
      documentId: transientParams.document.id,
      document: transientParams.document,
      createdAt: params.createdAt || now,
      updatedAt: params.updatedAt || now,
      deletedAt: params.deletedAt || null,
    } satisfies EvaluationExtractionDatasetDocument
  })
