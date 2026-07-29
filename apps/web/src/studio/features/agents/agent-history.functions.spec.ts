import { describe, expect, it } from "vitest"
import { agentFactory } from "@/common/features/agents/agent.factory"
import { agentSessionMessageFactory } from "@/common/features/agents/agent-sessions/agent-session.factory"
import { organizationFactory } from "@/common/features/organizations/organization.factory"
import { projectFactory } from "@/common/features/projects/projects.factory"
import {
  findPublishedVersion,
  findVersion,
  resolveMessageRevision,
} from "./agent-history.functions"

const project = projectFactory.transient({ organization: organizationFactory.build() }).build()

/** Revisions newest first, as the history endpoint returns them. */
const buildVersions = (...revisions: { revision: number; isDraft?: boolean }[]) =>
  revisions.map(({ revision, isDraft }) =>
    agentFactory.transient({ project }).build({ id: "agent-id", revision, isDraft }),
  )

describe("findPublishedVersion", () => {
  it("returns the newest non-draft version", () => {
    const versions = buildVersions({ revision: 5, isDraft: true }, { revision: 4 }, { revision: 3 })

    expect(findPublishedVersion(versions)?.revision).toBe(4)
  })

  it("returns undefined when every version is a draft", () => {
    expect(findPublishedVersion(buildVersions({ revision: 1, isDraft: true }))).toBeUndefined()
  })
})

describe("findVersion", () => {
  it("returns the version matching the revision", () => {
    const versions = buildVersions({ revision: 4 }, { revision: 3 })

    expect(findVersion(versions, 3)?.revision).toBe(3)
  })

  it("returns undefined for a revision missing from the list", () => {
    expect(findVersion(buildVersions({ revision: 4 }), 2)).toBeUndefined()
  })
})

describe("resolveMessageRevision", () => {
  it("uses the revision recorded on the message", () => {
    const message = agentSessionMessageFactory.build({ role: "assistant", agentRevision: 3 })

    expect(resolveMessageRevision(message, buildVersions({ revision: 4 }))).toBe(3)
  })

  it("labels a still-unsaved streamed message with the published revision", () => {
    // Messages built client-side during streaming have no `createdAt` and no revision;
    // streaming always runs the latest published settings, so that is the correct label.
    const message = agentSessionMessageFactory.build({ role: "assistant" })
    const versions = buildVersions({ revision: 5, isDraft: true }, { revision: 4 })

    expect(resolveMessageRevision(message, versions)).toBe(4)
  })

  it("hides the badge for a server-loaded message with no revision", () => {
    // A persisted message always has `createdAt`. If its revision is missing the transport
    // dropped it, and claiming the published revision would mislabel an old message as
    // the latest version — so report nothing instead.
    const message = agentSessionMessageFactory.build({
      role: "assistant",
      createdAt: Date.now() - 1000 * 60 * 60,
    })
    const versions = buildVersions({ revision: 4 }, { revision: 1 })

    expect(resolveMessageRevision(message, versions)).toBeUndefined()
  })

  it("returns undefined when there is no recorded revision and no published version", () => {
    const message = agentSessionMessageFactory.build({ role: "assistant" })

    expect(resolveMessageRevision(message, [])).toBeUndefined()
  })

  it("keeps a recorded revision that is absent from the history list", () => {
    const message = agentSessionMessageFactory.build({ role: "assistant", agentRevision: 2 })

    expect(resolveMessageRevision(message, buildVersions({ revision: 4 }))).toBe(2)
  })
})
