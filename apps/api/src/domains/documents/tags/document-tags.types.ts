import type { DocumentTag } from "./document-tag.entity"

export type DocumentTagsUpdateFields = {
  tagsToAdd?: DocumentTag["id"][]
  tagsToRemove?: DocumentTag["id"][]
}
