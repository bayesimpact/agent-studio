import { randomUUID } from "node:crypto"
import { Factory } from "fishery"
import type { Document } from "@/domains/documents/document.entity"
import type { EvaluationDataset } from "./evaluation-dataset.entity"
import type { EvaluationDatasetDocument } from "./evaluation-dataset-document.entity"

type EvaluationDatasetDocumentTransientParams = {
  evaluationDataset: EvaluationDataset
  document: Document
}

class EvaluationDatasetDocumentFactory extends Factory<
  EvaluationDatasetDocument,
  EvaluationDatasetDocumentTransientParams
> {}

export const evaluationDatasetDocumentFactory = EvaluationDatasetDocumentFactory.define(
  ({ params, transientParams }) => {
    if (!transientParams.evaluationDataset) {
      throw new Error("evaluationDataset transient is required")
    }
    if (!transientParams.document) {
      throw new Error("document transient is required")
    }

    const now = new Date()
    return {
      id: params.id || randomUUID(),
      evaluationDatasetId: transientParams.evaluationDataset.id,
      evaluationDataset: transientParams.evaluationDataset,
      documentId: transientParams.document.id,
      document: transientParams.document,
      createdAt: params.createdAt || now,
      updatedAt: params.updatedAt || now,
      deletedAt: params.deletedAt || null,
    } satisfies EvaluationDatasetDocument
  },
)
