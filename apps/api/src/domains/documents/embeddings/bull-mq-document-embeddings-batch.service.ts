import { InjectQueue } from "@nestjs/bullmq"
import { Injectable } from "@nestjs/common"
import type { Queue } from "bullmq"
import {
  DOCUMENT_EMBEDDINGS_JOB_NAME,
  DOCUMENT_EMBEDDINGS_QUEUE_NAME,
} from "./document-embeddings.constants"
import type { CreateDocumentEmbeddingsJobPayload } from "./document-embeddings.types"

@Injectable()
export class BullMqDocumentEmbeddingsBatchService {
  constructor(
    @InjectQueue(DOCUMENT_EMBEDDINGS_QUEUE_NAME)
    private readonly documentEmbeddingsQueue: Queue<CreateDocumentEmbeddingsJobPayload>,
  ) {}

  async enqueueCreateEmbeddingsForDocument(
    payload: CreateDocumentEmbeddingsJobPayload,
  ): Promise<void> {
    console.log("Enqueuing document embeddings job", payload)
    await this.documentEmbeddingsQueue.add(DOCUMENT_EMBEDDINGS_JOB_NAME, payload)
  }
}
