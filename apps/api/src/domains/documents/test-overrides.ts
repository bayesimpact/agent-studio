import type { TestingModuleBuilder } from "@nestjs/testing"
import { setupUserGuardForTesting } from "../../../test/e2e.helpers"
import { DOCUMENT_EMBEDDINGS_BATCH_SERVICE } from "./embeddings/document-embeddings-batch.interface"

function createDocumentEmbeddingsBatchServiceMock() {
  return {
    enqueueCreateEmbeddingsForDocument: jest.fn().mockResolvedValue(undefined),
  }
}

export function withDocumentEmbeddingsBatchServiceMock(
  moduleBuilder: TestingModuleBuilder,
): TestingModuleBuilder {
  return moduleBuilder
    .overrideProvider(DOCUMENT_EMBEDDINGS_BATCH_SERVICE)
    .useValue(createDocumentEmbeddingsBatchServiceMock())
}

export function withDocumentAuthAndEmbeddingsMocks(
  moduleBuilder: TestingModuleBuilder,
  getAuth0Id: () => string,
): TestingModuleBuilder {
  return setupUserGuardForTesting(withDocumentEmbeddingsBatchServiceMock(moduleBuilder), getAuth0Id)
}
