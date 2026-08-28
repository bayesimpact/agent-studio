import type { Meta, StoryObj } from "@storybook/react-vite"
import {
  projectAgentSessionCategoryFactory,
  retentionSweepRunFactory,
} from "@/common/features/projects/projects.factory"
import type { ProjectAgentSessionCategory } from "@/common/features/projects/projects.models"
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
  withAgentSessionCategories?: boolean
  withRetentionLog?: boolean
}

const meta = {
  title: "routes/studio/project/admin",
  parameters: { layout: "fullscreen" },
  argTypes: {
    ...studioStoryArgTypes,
    withAgentSessionCategories: { control: "boolean" },
    withRetentionLog: { control: "boolean" },
  },
  args: {
    ...studioStoryArgs,
    withAgentSessionCategories: false,
    withRetentionLog: true,
  },
  render: render({
    routes: studioRoutes,
    path: StudioRoutes.projectAdmin.path,
  }),
} satisfies Meta<StoryArgs>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  decorators: [
    buildDecorator<StoryArgs>(({ withAgentSessionCategories, withRetentionLog, ...args }) => {
      const { baseSeeds, project } = buildStudioData(args)
      const categories: ProjectAgentSessionCategory[] = withAgentSessionCategories
        ? [
            projectAgentSessionCategoryFactory.build({ name: "Support" }),
            projectAgentSessionCategoryFactory.build({ name: "Sales" }),
            projectAgentSessionCategoryFactory.build({ name: "Onboarding" }),
          ]
        : []
      const seededProject = { ...project, agentSessionCategories: categories }
      const retentionLog = {
        nextRunAt: Date.now() + 8 * 60 * 60 * 1000,
        runs: withRetentionLog
          ? [
              retentionSweepRunFactory.build({ status: "OK", purgedCount: 12 }),
              retentionSweepRunFactory.build({
                status: "PARTIAL",
                purgedCount: 3,
                report:
                  "- Conversations purged: 3\n- Embed sessions purged: 0\n- Trace deletions postponed: 2 (retried on the next run)",
              }),
              retentionSweepRunFactory.build({
                status: "ERROR",
                purgedCount: 0,
                report: "The run failed: the database connection dropped.",
              }),
              retentionSweepRunFactory.build({ status: "OK", purgedCount: 0 }),
            ]
          : [],
      }
      return {
        state: mergeSeeds(
          baseSeeds,
          seed.projects([seededProject], { currentId: seededProject.id }),
          seed.retentionSweepRuns(retentionLog),
        ),
      }
    }),
  ],
}

export const WithCategories: Story = {
  args: {
    ...studioStoryArgs,
    withAgentSessionCategories: true,
  },
  decorators: [
    buildDecorator<StoryArgs>(({ withAgentSessionCategories, withRetentionLog, ...args }) => {
      const { baseSeeds, project } = buildStudioData(args)
      const categories: ProjectAgentSessionCategory[] = withAgentSessionCategories
        ? [
            projectAgentSessionCategoryFactory.build({ name: "Support" }),
            projectAgentSessionCategoryFactory.build({ name: "Sales" }),
            projectAgentSessionCategoryFactory.build({ name: "Onboarding" }),
          ]
        : []
      const seededProject = { ...project, agentSessionCategories: categories }
      const retentionLog = {
        nextRunAt: Date.now() + 8 * 60 * 60 * 1000,
        runs: withRetentionLog
          ? [
              retentionSweepRunFactory.build({ status: "OK", purgedCount: 12 }),
              retentionSweepRunFactory.build({
                status: "PARTIAL",
                purgedCount: 3,
                report:
                  "- Conversations purged: 3\n- Embed sessions purged: 0\n- Trace deletions postponed: 2 (retried on the next run)",
              }),
              retentionSweepRunFactory.build({
                status: "ERROR",
                purgedCount: 0,
                report: "The run failed: the database connection dropped.",
              }),
              retentionSweepRunFactory.build({ status: "OK", purgedCount: 0 }),
            ]
          : [],
      }
      return {
        state: mergeSeeds(
          baseSeeds,
          seed.projects([seededProject], { currentId: seededProject.id }),
          seed.retentionSweepRuns(retentionLog),
        ),
      }
    }),
  ],
}
