import { Column } from "typeorm"
import { ConnectEntity, ConnectEntityBase } from "@/common/entities/connect-entity"

// Note: the `embedding vector(768)` column is created by migration but intentionally
// omitted here. TypeORM does not support the pgvector type natively; insertions with
// the embedding value are performed via raw SQL using pgvector's toSql() helper.
@ConnectEntity("document_chunk")
export class DocumentChunk extends ConnectEntityBase {
  @Column({ name: "document_id", type: "uuid" })
  documentId!: string

  @Column({ name: "content", type: "text" })
  content!: string

  @Column({ name: "chunk_index", type: "integer" })
  chunkIndex!: number
}
