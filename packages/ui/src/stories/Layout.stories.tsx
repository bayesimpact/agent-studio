import type { Meta, StoryObj } from "@storybook/react"
import Layout from "@/components/layouts/layout"

const meta: Meta<typeof Layout> = {
  title: "UI/Layout",
  component: Layout,
  tags: ["autodocs"],
  argTypes: {},
}

export default meta
type Story = StoryObj<typeof Layout>

export const Default: Story = {
  args: {},
}
