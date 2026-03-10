import { Column } from "typeorm"
import { ConnectEntity, ConnectEntityBase } from "@/common/entities/connect-entity"

@ConnectEntity("document_chunk")
export class DocumentChunk extends ConnectEntityBase {
  @Column({ name: "document_id", type: "uuid" })
  documentId!: string

  @Column({ name: "content", type: "text" })
  content!: string

  @Column({ name: "chunk_index", type: "integer" })
  chunkIndex!: number
}
