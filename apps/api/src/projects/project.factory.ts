import { randomUUID } from "node:crypto"
import { Factory } from "fishery"
import type { Project } from "./project.entity"

export const projectFactory = Factory.define<Project>(({ sequence, params }) => {
  const now = new Date()
  return {
    id: params.id || randomUUID(),
    name: params.name || `Test Project ${sequence}`,
    organizationId: params.organizationId || randomUUID(),
    createdAt: params.createdAt || now,
    updatedAt: params.updatedAt || now,
    organization: params.organization,
  } as Project
})
