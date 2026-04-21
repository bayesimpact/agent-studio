import { AgentLocale, AgentModel, DocumentsRagMode } from "@caseai-connect/api-contracts"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { FormResult } from "@/common/features/agents/agent-sessions/form/components/FormResult"
import type { FormAgentSession } from "@/common/features/agents/agent-sessions/form/form-agent-sessions.models"
import type { Agent } from "@/common/features/agents/agents.models"

const mockAgent: Agent = {
  id: "agent-form-1",
  projectId: "proj-1",
  type: "form",
  name: "Intake Form Agent",
  defaultPrompt: "Collect intake details from the user.",
  greetingMessage: "Welcome — let's get started.",
  model: AgentModel.Gemini25Flash,
  temperature: 0.2,
  locale: AgentLocale.EN,
  documentTagIds: [],
  documentsRagMode: DocumentsRagMode.None,
  outputJsonSchema: {
    type: "object",
    properties: {
      firstName: { type: "string", description: "Given name" },
      lastName: { type: "string", description: "Family name" },
      email: { type: "string", description: "Contact email" },
      phone: { type: "string", description: "Phone number" },
      company: { type: "string", description: "Company name" },
      role: { type: "string", description: "Job title" },
      country: { type: "string", description: "Country" },
      city: { type: "string", description: "City" },
      postalCode: { type: "string", description: "Postal or zip code" },
      industry: { type: "string", description: "Industry" },
      teamSize: { type: "number", description: "Number of people in the team" },
      budget: { type: "number", description: "Planned budget" },
      startDate: { type: "string", description: "Project start date" },
      endDate: { type: "string", description: "Project end date" },
      notes: { type: "string", description: "Any extra notes" },
    },
    required: ["firstName", "email"],
  },
  createdAt: Date.now(),
  updatedAt: Date.now(),
}

const mockSessionEmpty: FormAgentSession = {
  id: "session-empty",
  agentId: mockAgent.id,
  type: "playground",
  createdAt: Date.now(),
  updatedAt: Date.now(),
}

const mockSessionFilled: FormAgentSession = {
  id: "session-filled",
  agentId: mockAgent.id,
  type: "playground",
  createdAt: Date.now(),
  updatedAt: Date.now(),
  result: {
    firstName: "Alex",
    lastName: "Martin",
    email: "alex@example.com",
    company: "Acme",
    role: "PM",
    country: "France",
    city: "Lyon",
    industry: "Software",
    teamSize: 12,
  },
}

const meta = {
  title: "forms/FormResult",
  component: FormResult,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="relative h-screen w-80 border-l">
        <Story />
      </div>
    ),
  ],
  args: {
    agent: mockAgent,
  },
} satisfies Meta<typeof FormResult>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  args: {
    agentSession: mockSessionEmpty,
  },
}

export const Partial: Story = {
  args: {
    agentSession: mockSessionFilled,
  },
}
