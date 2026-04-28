import type { Meta, StoryObj } from "@storybook/react-vite"
import { withRouter } from "storybook-addon-remix-react-router"
import { SidebarLayout } from "@/common/components/sidebar/SidebarLayout"
import type { Organization } from "@/common/features/organizations/organizations.models"
import type { Project } from "@/common/features/projects/projects.models"
import { SidebarFooterChildren } from "@/studio/routes/SidebarFooterChildren"
import { withRedux } from "../decorators/with-redux"

const mockOrganization: Organization = {
  id: "org-1",
  name: "Demo organization",
  createdAt: Date.now(),
  projects: [],
}

const baseProject: Project = {
  id: "proj-1",
  name: "Demo project",
  organizationId: "org-1",
  createdAt: Date.now(),
  updatedAt: Date.now(),
  featureFlags: [],
  agentCategories: [],
}

function StudioSidebar({ project }: { project: Project }) {
  return (
    <SidebarLayout
      user={{ name: "Jane Doe", email: "jane@example.com" }}
      organization={mockOrganization}
      sidebarFooterChildren={<SidebarFooterChildren project={project} />}
    >
      <main className="p-6 text-muted-foreground text-sm">
        Sidebar story — main content area is intentionally empty so the focus is on the left
        navigation.
      </main>
    </SidebarLayout>
  )
}

const meta = {
  title: "routes/StudioSidebar",
  component: StudioSidebar,
  parameters: { layout: "fullscreen" },
  // `withRouter` is shared. The Redux store is seeded per-story so the
  // `RestrictedFeature` component (which reads featureFlags from the
  // currently-selected project in the store) sees the right flags.
  decorators: [withRouter],
} satisfies Meta<typeof StudioSidebar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { project: baseProject },
  decorators: [withRedux({ currentProject: baseProject })],
}

const allFeaturesProject: Project = {
  ...baseProject,
  featureFlags: ["evaluation", "project-analytics"],
}

export const WithAllFeatures: Story = {
  args: { project: allFeaturesProject },
  decorators: [withRedux({ currentProject: allFeaturesProject })],
}
