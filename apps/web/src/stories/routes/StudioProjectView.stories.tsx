import { AgentLocale, AgentModel, DocumentsRagMode } from "@caseai-connect/api-contracts"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { withRouter } from "storybook-addon-remix-react-router"
import type { Agent } from "@/common/features/agents/agents.models"
import { AgentList } from "@/common/features/agents/components/AgentList"
import type { Project } from "@/common/features/projects/projects.models"
import { AgentCreatorButton } from "@/studio/features/agents/components/AgentCreator"
import { AnalyticsButton } from "@/studio/features/agents/components/AnalyticsButton"
import { DocumentsButton } from "@/studio/features/agents/components/DocumentsButton"
import { EvaluationButton } from "@/studio/features/agents/components/EvaluationButton"
import { MembersButton } from "@/studio/features/agents/components/MembersButton"
import { ReviewCampaignsButton } from "@/studio/features/review-campaigns/components/ReviewCampaignsButton"
import { withRedux } from "../decorators/with-redux"

const mockProject: Project = {
  id: "proj-1",
  name: "Demo project",
  organizationId: "org-1",
  createdAt: Date.now(),
  updatedAt: Date.now(),
  featureFlags: ["evaluation"],
  agentCategories: [],
}

const baseAgent = {
  organizationId: "org-1",
  projectId: "proj-1",
  defaultPrompt: "You are a helpful assistant.",
  model: AgentModel.Gemini25Flash,
  temperature: 0.2,
  locale: AgentLocale.EN,
  documentsRagMode: DocumentsRagMode.All,
  documentTagIds: [],
  projectAgentCategoryIds: [],
  usedProjectAgentCategoryIds: [],
  instructionPrompt: null,
  greetingMessage: null,
  createdAt: Date.now(),
  updatedAt: Date.now(),
}

const mockAgents: Agent[] = [
  { ...baseAgent, id: "agent-1", name: "Support assistant", type: "conversation" },
  { ...baseAgent, id: "agent-2", name: "Scheduling bot", type: "conversation" },
  { ...baseAgent, id: "agent-3", name: "Intake form agent", type: "form" },
]

const extraItems = [
  AgentCreatorButton,
  DocumentsButton,
  MembersButton,
  ReviewCampaignsButton,
  AnalyticsButton,
  EvaluationButton,
]

function StudioProjectView({ project, agents }: { project: Project; agents: Agent[] }) {
  return (
    <AgentList project={project} agents={agents} extraItems={extraItems.length}>
      {extraItems.map((Component, index) => (
        <Component key={Component.name} project={project} index={agents.length + index} />
      ))}
    </AgentList>
  )
}

const meta = {
  title: "routes/StudioProjectView",
  component: StudioProjectView,
  parameters: { layout: "fullscreen" },
  decorators: [withRouter, withRedux({ currentProject: mockProject })],
} satisfies Meta<typeof StudioProjectView>

export default meta
type Story = StoryObj<typeof meta>

export const WithAgents: Story = {
  args: {
    project: mockProject,
    agents: mockAgents,
  },
}

export const EmptyProject: Story = {
  args: {
    project: mockProject,
    agents: [],
  },
}
