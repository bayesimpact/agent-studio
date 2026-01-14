import type { Meta, StoryObj } from "@storybook/react-vite"
import { withRouter } from "storybook-addon-remix-react-router"
import { Lobby as Comp } from "@/components/Lobby"

const meta = {
  title: "routes/Lobby",
  component: Comp,
  decorators: [withRouter],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof Comp>

export default meta
type Story = StoryObj<typeof meta>

export const NotAuthenticated: Story = {
  args: {
    isAuthenticated: false,
  },
}
export const Authenticated: Story = {
  args: {
    isAuthenticated: true,
    user: {
      name: "Jane Doe",
      email: "jane.doe@example.com",
    },
  },
}
