import type { Meta, StoryObj } from "@storybook/react-vite"
import type { Agent } from "@/common/features/agents/agents.models"
import type { IAgentsSpi } from "@/common/features/agents/agents.spi"
import { buildDecorator, render } from "@/stories/decorators"
import {
  buildStudioData,
  type StudioStoryArgs,
  studioStoryArgs,
  studioStoryArgTypes,
} from "@/stories/routes/studio/helpers"
import { mergeSeeds, seed } from "@/stories/seed"
import { agentSubAgentFactory } from "@/studio/features/agent-sub-agents/agent-sub-agents.factory"
import { StudioRoutes } from "@/studio/routes/helpers"
import { studioRoutes } from "@/studio/routes/StudioRoutes"

type StoryArgs = StudioStoryArgs & {
  withSubAgents?: boolean
  /** Unpublished draft revision — drives whether the header's publish button is enabled. */
  withDraft?: boolean
}

/** Older revisions of the agent so the version history sheet has content to compare. */
function buildVersions(agent: Agent): Agent[] {
  return [
    { ...agent },
    {
      ...agent,
      revision: 2,
      isDraft: false,
      revisionName: "Stricter sourcing",
      revisionDesc: "Requires the agent to cite a source for every factual claim.",
      temperature: 0.2,
      instructions: `${agent.instructions}\nAlways cite your sources.`,
    },
    {
      ...agent,
      revision: 1,
      isDraft: false,
      revisionName: "Initial setup",
      instructions: "You are a helpful assistant.",
    },
  ]
}

/** Serves the seeded data back so history/restore interactions work inside the story. */
function buildMockAgentsService(agents: Agent[], versions: Agent[]): IAgentsSpi {
  return {
    getAll: async () => agents,
    getAllWithDrafts: async () => agents,
    createOne: async () => {
      throw new Error("createOne is not supported in this story")
    },
    updateOne: async () => {},
    deleteOne: async () => {},
    getHistory: async () => versions,
    restoreRevision: async () => {},
    publishRevision: async ({ revision }, payload) => {
      const published = agents.find((agent) => agent.revision === revision) ?? agents[0]
      if (!published) throw new Error("publishRevision has no agent to publish in this story")
      return { ...published, ...payload, isDraft: false }
    },
  }
}

const meta = {
  title: "routes/studio/project/agent/edit",
  parameters: { layout: "fullscreen" },
  argTypes: {
    ...studioStoryArgTypes,
    withSubAgents: { control: "boolean" },
    withDraft: { control: "boolean" },
  },
  args: {
    ...studioStoryArgs,
    featureFlags: [...studioStoryArgs.featureFlags, "agent-orchestration"],
    withAgents: true,
    withSubAgents: true,
    withDraft: true,
  },
  render: render({ routes: studioRoutes, path: StudioRoutes.agentEdit.path }),
} satisfies Meta<StoryArgs>

export default meta
type Story = StoryObj<typeof meta>

export const ConversationAgent: Story = {
  decorators: [
    buildDecorator<StoryArgs>(({ withSubAgents, withDraft, ...args }) => {
      const { baseSeeds, agents } = buildStudioData({ ...args, withAgents: true })
      const [rawParentAgent, ...rawChildAgents] = agents
      if (!rawParentAgent) {
        throw new Error("Agent editor route story requires a parent agent")
      }
      const parentAgent = {
        ...rawParentAgent,
        name: "Helpful Assistant",
        type: "conversation" as const,
        revision: 3,
        isDraft: !!withDraft,
      }
      const childAgents = rawChildAgents.map((agent, index) => ({
        ...agent,
        name: index === 0 ? "Research Agent" : "Summary Bot",
        type: "conversation" as const,
      }))
      const subAgents =
        withSubAgents && childAgents[0]
          ? [
              agentSubAgentFactory.transient({ parentAgent, childAgent: childAgents[0] }).build({
                toolName: "ask_research_agent",
                description: "Use for research and source discovery questions.",
              }),
            ]
          : []
      const allAgents = [parentAgent, ...childAgents]
      const versions = buildVersions(parentAgent)

      return {
        state: mergeSeeds(
          baseSeeds,
          seed.agents(allAgents, { currentId: parentAgent.id }),
          seed.studio.agentSubAgents(subAgents),
          seed.studio.documentTags([]),
          seed.studio.agentHistory(versions),
        ),
        services: {
          agents: buildMockAgentsService(allAgents, versions),
        },
      }
    }),
  ],
}
