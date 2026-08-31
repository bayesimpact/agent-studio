import type { Meta, StoryObj } from "@storybook/react-vite"
import { backofficeRoutes } from "@/backoffice/routes/BackofficeRoutes"
import { BackofficeUserRoutes } from "@/backoffice/routes/helpers"
import { buildDecorator, render } from "@/stories/decorators"
import {
  BACKOFFICE_STORY_USER_ID,
  type BackofficeStoryArgs,
  backofficeStoryArgs,
  backofficeStoryArgTypes,
  buildBackofficeData,
  buildInspectorUserDetail,
  buildMockBackofficeService,
} from "@/stories/routes/backoffice/helpers"
import { mergeSeeds, seed } from "@/stories/seed"

type StoryArgs = BackofficeStoryArgs

const decorator = buildDecorator<StoryArgs>((args) => {
  const { baseSeeds, organizations, users, termsDocuments } = buildBackofficeData(args)
  const userDetail = buildInspectorUserDetail()
  return {
    state: mergeSeeds(baseSeeds, seed.backoffice.userDetail(userDetail)),
    services: {
      backoffice: buildMockBackofficeService({
        organizations,
        users,
        termsDocuments,
        userDetails: { [userDetail.id]: userDetail },
      }),
    },
  }
})

const meta = {
  title: "routes/backoffice/users/detail",
  parameters: { layout: "fullscreen" },
  argTypes: backofficeStoryArgTypes,
  args: backofficeStoryArgs,
  decorators: [decorator],
  render: render({
    path: BackofficeUserRoutes.user.build({ userId: BACKOFFICE_STORY_USER_ID }),
    routes: backofficeRoutes,
  }),
} satisfies Meta<StoryArgs>

export default meta
type Story = StoryObj<typeof meta>

export const Populated: Story = {}
