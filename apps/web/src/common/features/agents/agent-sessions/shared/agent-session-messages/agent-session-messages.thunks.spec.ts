import { beforeEach, describe, expect, it, vi } from "vitest"
import { agentFactory } from "@/common/features/agents/agent.factory"
import { agentSettingsFactory } from "@/common/features/agents/agent-settings/agent-settings.factory"
import { organizationFactory } from "@/common/features/organizations/organization.factory"
import { projectFactory } from "@/common/features/projects/projects.factory"
import type { RootState } from "@/common/store"
import { ADS } from "@/common/store/async-data-status"
import type { Services } from "@/di/services"
import { isStudioInterface } from "@/studio/routes/helpers"
import { sendMessage } from "./agent-session-messages.thunks"
import { streamChatResponse } from "./external/agent-session-messages-streaming"

// `isStudioInterface` reads `window.location`, which doesn't exist under vitest's default node
// environment. Mocking it (rather than `buildType` itself) keeps the real `buildType` — the
// gate `sendMessage` actually depends on — in the test path.
vi.mock("@/studio/routes/helpers", () => ({ isStudioInterface: vi.fn() }))

// The real module imports the Auth0 client transitively, which also needs `window`.
vi.mock("./external/agent-session-messages-streaming", () => ({ streamChatResponse: vi.fn() }))

const mockedIsStudioInterface = vi.mocked(isStudioInterface)
const mockedStreamChatResponse = vi.mocked(streamChatResponse)

const organizationId = "org-1"
const projectId = "project-1"
const agentId = "agent-1"
const agentSessionId = "session-1"

const organization = organizationFactory.build({ id: organizationId })
const project = projectFactory.transient({ organization }).build({ id: projectId })
const agent = agentFactory.transient({ project }).build({ id: agentId })

const extra = { services: {} as Services }

/**
 * A fixture shaped like only the slices `sendMessage` reads, not a full `RootState` — the real
 * type is a many-scope union not meant to be hand-built. The cast is safe because every field the
 * thunk touches is present with the real shape.
 */
function buildState({
  history = {},
  chosenRevision,
}: {
  history?: Record<string, ReturnType<typeof agentSettingsFactory.build>[]>
  chosenRevision?: number
} = {}): RootState {
  return {
    currentIds: { organizationId, projectId, agentId, agentSessionId },
    agentSessionMessages: { isStreaming: false },
    agentSettings: {
      history: Object.fromEntries(
        Object.entries(history).map(([historyAgentId, versions]) => [
          historyAgentId,
          { status: ADS.Fulfilled, error: null, value: versions },
        ]),
      ),
      playgroundRevisionBySessionId:
        chosenRevision === undefined ? {} : { [agentSessionId]: chosenRevision },
    },
  } as unknown as RootState
}

beforeEach(() => {
  vi.clearAllMocks()
  mockedStreamChatResponse.mockResolvedValue(undefined)
})

describe("sendMessage", () => {
  it("carries the chosen revision on a playground session", async () => {
    mockedIsStudioInterface.mockReturnValue(true)
    const versions = [agentSettingsFactory.transient({ agent }).build({ revision: 2 })]
    const state = buildState({ history: { [agentId]: versions }, chosenRevision: 2 })
    const dispatch = vi.fn()

    await sendMessage({ content: "Hello" })(dispatch, () => state, extra)

    expect(mockedStreamChatResponse).toHaveBeenCalledWith(
      expect.objectContaining({ agentSettingsRevision: 2 }),
    )
  })

  it("forwards no revision on a live session even when one is chosen", async () => {
    mockedIsStudioInterface.mockReturnValue(false)
    const versions = [agentSettingsFactory.transient({ agent }).build({ revision: 2 })]
    const state = buildState({ history: { [agentId]: versions }, chosenRevision: 2 })
    const dispatch = vi.fn()

    await sendMessage({ content: "Hello" })(dispatch, () => state, extra)

    expect(mockedStreamChatResponse).toHaveBeenCalledWith(
      expect.objectContaining({ agentSettingsRevision: undefined }),
    )
  })

  it("forwards no revision on a playground session whose history has not loaded", async () => {
    mockedIsStudioInterface.mockReturnValue(true)
    const state = buildState()
    const dispatch = vi.fn()

    await sendMessage({ content: "Hello" })(dispatch, () => state, extra)

    expect(mockedStreamChatResponse).toHaveBeenCalledWith(
      expect.objectContaining({ agentSettingsRevision: undefined }),
    )
  })
})
