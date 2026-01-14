import type { Meta, StoryObj } from "@storybook/react-vite"

import { Dashboard as Comp } from "../../components/Dashboard"

const meta = {
  title: "routes/Dashboard",
  component: Comp,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof Comp>

export default meta
type Story = StoryObj<typeof meta>

export const Dashboard: Story = {
  args: {
    user: {
      name: "Jane Doe",
      email: "jane.doe@example.com",
    },
  },
}
