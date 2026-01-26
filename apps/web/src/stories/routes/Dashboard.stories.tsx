import { Header } from "@caseai-connect/ui/components/layouts/sidebar/Header"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { withRouter } from "storybook-addon-remix-react-router"
import { dataset } from "@/assets/data"
import { SidebarLayout } from "@/components/layouts/SidebarLayout"
import { NavSources } from "@/components/sidebar/NavSources"

const meta = {
  title: "route/Dashboard",
  decorators: [withRouter],
  parameters: { layout: "fullscreen" },
} satisfies Meta<unknown>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => {
    return (
      <SidebarLayout
        sidebarHeaderChildren={<Header to="/" name="Atma Corp" />}
        sidebarContentChildren={<NavSources items={dataset.sources} />}
        user={dataset.user}
      >
        <div>
          <h1 className="text-2xl font-bold">Dashboard Home</h1>
          <p>Welcome to the dashboard!</p>
        </div>
      </SidebarLayout>
    )
  },
}
