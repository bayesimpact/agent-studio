import type { Meta, StoryObj } from "@storybook/react-vite"
import { agentFactory } from "@/common/features/agents/agent.factory"
import { extractionAgentSessionSummaryFactory } from "@/common/features/agents/agent-sessions/agent-session.factory"
import { agentSettingsFactory } from "@/common/features/agents/agent-settings/agent-settings.factory"
import { buildDecorator, render } from "@/stories/decorators"
import {
  buildStudioData,
  type StudioStoryArgs,
  studioStoryArgs,
  studioStoryArgTypes,
} from "@/stories/routes/studio/helpers"
import { mergeSeeds, seed } from "@/stories/seed"
import { StudioRoutes } from "@/studio/routes/helpers"
import { studioRoutes } from "@/studio/routes/StudioRoutes"

type StoryArgs = StudioStoryArgs & {
  status?: "success" | "pending" | "failed"
  /** Revision the run was executed with — older than the agent's current one by default. */
  runRevision?: number
}

const meta = {
  title: "routes/studio/project/agent/extractionRun",
  parameters: { layout: "fullscreen" },
  argTypes: {
    ...studioStoryArgTypes,
    withAgents: { control: undefined },
    status: { control: "select", options: ["success", "pending", "failed"] },
    runRevision: { control: "number" },
  },
  args: {
    ...studioStoryArgs,
    withAgents: true,
    status: "success",
    runRevision: 1,
  },
  render: render({ routes: studioRoutes, path: StudioRoutes.agentExtractionRun.path }),
} satisfies Meta<StoryArgs>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  decorators: [
    buildDecorator<StoryArgs>(({ status, runRevision, ...args }) => {
      const { baseSeeds, project, agents } = buildStudioData(args)
      const [firstAgent, ...restAgents] = agents
      // The agent has moved on to revision 2, so the run keeps labelling its own revision.
      const currentAgent = agentFactory.transient({ project }).build({
        ...firstAgent,
        type: "extraction",
        currentRevision: { number: 2 },
      })
      const versions = [2, 1].map((revision) =>
        agentSettingsFactory.transient({ agent: currentAgent }).build({ revision }),
      )
      const run = extractionAgentSessionSummaryFactory
        .transient({ agent: currentAgent })
        .build({ status, agentRevision: runRevision })

      return {
        state: mergeSeeds(
          baseSeeds,
          seed.agents([...restAgents, currentAgent], { currentId: currentAgent.id }),
          seed.extractionAgentSessions({
            [currentAgent.id]: { csvSessions: [], others: [run] },
          }),
          seed.extractionAgentSessionDocuments([]),
          seed.currentExtractionRunId(run.id),
          seed.studio.agentHistory({ agentId: currentAgent.id, versions }),
        ),
      }
    }),
  ],
}

export const Failed: Story = {
  args: { ...meta.args, status: "failed" },
  decorators: Default.decorators,
}
