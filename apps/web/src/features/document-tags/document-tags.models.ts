import type { TimeType } from "@caseai-connect/api-contracts"
import z from "zod"

export type DocumentTag = {
  createdAt: TimeType
  description: string | null
  id: string
  name: string
  organizationId: string
  parentId: string | null
  projectId: string
  updatedAt: TimeType
}

export type TagNode = DocumentTag & { children: TagNode[] }

export function buildTagTree(tags: DocumentTag[]): TagNode[] {
  const tagMap = new Map<string, TagNode>()
  for (const tag of tags) {
    tagMap.set(tag.id, { ...tag, children: [] })
  }
  const roots: TagNode[] = []
  for (const node of tagMap.values()) {
    if (node.parentId === null) {
      roots.push(node)
    } else {
      const parent = tagMap.get(node.parentId)
      if (parent) {
        parent.children.push(node)
      } else {
        roots.push(node)
      }
    }
  }
  return roots
}

export const documentTagSchema = z
  .object({
    createdAt: z.number(),
    description: z.string().nullable(),
    id: z.string(),
    name: z.string(),
    organizationId: z.string(),
    parentId: z.string().nullable(),
    projectId: z.string(),
    updatedAt: z.number(),
  })
  .strict()
