import type { Meta, StoryObj } from "@storybook/react-vite"
import { LoadingRoute } from "@/common/routes/LoadingRoute"

const meta = {
  title: "routes/Loading",
  component: LoadingRoute,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof LoadingRoute>

export default meta
type Story = StoryObj<typeof meta>

export const Loading: Story = {}
