import type { Meta, StoryObj } from "@storybook/react-vite"

import { DashboardLayout as Comp } from "../../components/DashboardLayout"

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
    projects: [],
  },
}
