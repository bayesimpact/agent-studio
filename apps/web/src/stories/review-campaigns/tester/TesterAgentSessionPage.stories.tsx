import {
  type AgentDto,
  AgentLocale,
  AgentModel,
  type AgentSessionMessageDto,
  type ConversationAgentSessionDto,
  DocumentsRagMode,
  type FormAgentSessionDto,
} from "@caseai-connect/api-contracts"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { withRouter } from "storybook-addon-remix-react-router"
import type { Project } from "@/common/features/projects/projects.models"
import { TesterAgentSessionContent } from "@/tester/features/review-campaigns/components/TesterAgentSessionPage"
import { withRedux } from "../../decorators/with-redux"
import { mockPerSessionQuestions, mockTesterContext } from "./fixtures"
import { buildMockTesterService } from "./mock-service"

const mockProject: Project = {
  id: "proj-1",
  name: "Demo project",
  organizationId: "org-1",
  createdAt: Date.now(),
  updatedAt: Date.now(),
  featureFlags: [],
}

const mockConversationAgent: AgentDto = {
  id: "agent-1",
  projectId: mockProject.id,
  name: "Support assistant",
  type: "conversation",
  defaultPrompt: "You are a helpful support assistant.",
  greetingMessage: "Hi! Ask me anything about your account.",
  locale: AgentLocale.EN,
  model: AgentModel.Gemini25Flash,
  temperature: 0.5,
  documentTagIds: [],
  documentsRagMode: DocumentsRagMode.All,
  createdAt: Date.now(),
  updatedAt: Date.now(),
}

const mockFormAgent: AgentDto = {
  ...mockConversationAgent,
  id: "agent-2",
  name: "Intake form",
  type: "form",
  outputJsonSchema: {
    type: "object",
    required: ["reason"],
    properties: {
      reason: { type: "string", description: "Reason for contact" },
      priority: { type: "string", description: "Priority level" },
    },
  },
}

const mockConversationSession: ConversationAgentSessionDto = {
  id: "session-1",
  agentId: mockConversationAgent.id,
  type: "live",
  createdAt: Date.now() - 5 * 60_000,
  updatedAt: Date.now(),
}

const mockFormSession: FormAgentSessionDto = {
  id: "session-2",
  agentId: mockFormAgent.id,
  type: "live",
  createdAt: Date.now() - 3 * 60_000,
  updatedAt: Date.now(),
  result: { reason: "Account access", priority: "Medium" },
}

const mockMessages: AgentSessionMessageDto[] = [
  {
    id: "msg-1",
    role: "assistant",
    content: "Hi! Ask me anything about your account.",
    status: "completed",
  },
  {
    id: "msg-2",
    role: "user",
    content: "How do I reset my password?",
    status: "completed",
  },
  {
    id: "msg-3",
    role: "assistant",
    content:
      "Sure — go to Settings → Security and click 'Reset password'. You'll receive an email with a secure link.",
    status: "completed",
  },
]

const baseStoryArgs = {
  organizationId: mockProject.organizationId,
  projectId: mockProject.id,
  campaignName: mockTesterContext.name,
  perSessionQuestions: mockPerSessionQuestions,
  backPath: "/tester",
}

const meta = {
  title: "review-campaigns/tester/pages/TesterAgentSessionPage",
  component: TesterAgentSessionContent,
  parameters: { layout: "fullscreen" },
  decorators: [
    withRouter,
    withRedux({
      currentProject: mockProject,
      testerContext: mockTesterContext,
      servicesMock: { reviewCampaignsTester: buildMockTesterService() },
    }),
  ],
} satisfies Meta<typeof TesterAgentSessionContent>

export default meta
type Story = StoryObj<typeof meta>

export const ConversationWithMessages: Story = {
  args: {
    ...baseStoryArgs,
    agent: mockConversationAgent,
    agentSession: mockConversationSession,
    messages: mockMessages,
  },
}

export const ConversationEmpty: Story = {
  args: {
    ...baseStoryArgs,
    agent: mockConversationAgent,
    agentSession: mockConversationSession,
    messages: [],
  },
}

export const FormSessionWithResult: Story = {
  args: {
    ...baseStoryArgs,
    agent: mockFormAgent,
    agentSession: mockFormSession,
    messages: mockMessages,
  },
}
