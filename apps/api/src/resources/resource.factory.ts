import { randomUUID } from "node:crypto"
import { MimeTypes } from "@caseai-connect/api-contracts"
import { Factory } from "fishery"
import type { Project } from "@/projects/project.entity"
import type { Resource } from "./resource.entity"

type ResourceTransientParams = {
  project: Project
}

class ResourceFactory extends Factory<Resource, ResourceTransientParams> {}

export const resourceFactory = ResourceFactory.define(({ sequence, params, transientParams }) => {
  if (!transientParams.project) {
    throw new Error("project transient is required")
  }

  const now = new Date()
  return {
    id: params.id || randomUUID(),
    createdAt: params.createdAt || now,
    updatedAt: params.updatedAt || now,
    deletedAt: params.deletedAt || now,
    projectId: transientParams.project.id,
    project: transientParams.project,

    title: params.title || `Resource ${sequence}`,
    content: params.content || "Sample content",
    fileName: params.fileName || `file_${sequence}.txt`,
    language: params.language || "en",
    mimeType: params.mimeType || MimeTypes.txt,
    size: params.size || 1024,
    storageRelativePath: params.storageRelativePath || `resources/file_${sequence}.txt`,
  } satisfies Resource
})
