import { Column, JoinColumn, ManyToMany, ManyToOne, OneToMany } from "typeorm"
import { ConnectEntity, ConnectEntityBase } from "@/common/entities/connect-entity"
import type { Document } from "../document.entity"

@ConnectEntity("document_tag")
export class DocumentTag extends ConnectEntityBase {
  @Column({ name: "name", nullable: false })
  name!: string

  @Column({ name: "description", nullable: true })
  description!: string

  @Column({ name: "parent_id", type: "uuid", nullable: true })
  parentId!: string | null

  @ManyToOne(
    () => DocumentTag,
    (tag) => tag.children,
    { nullable: true },
  )
  @JoinColumn({ name: "parent_id" })
  parent!: DocumentTag | null

  @OneToMany(() => DocumentTag, (tag) => tag.parent)
  children!: DocumentTag[]

  @ManyToMany("Document", (document: Document) => document.tags)
  documents!: Document[]
}
