import { ChatBotRoute } from "./ChatBotRoute"
import { ChatSessionRoute } from "./ChatSessionRoute"
import { DashboardRoute } from "./DashboardRoute"
import { RouteNames } from "./helpers"
import { ChatBotHoc } from "./hocs/ChatBotHoc"
import { ChatBotsHoc } from "./hocs/ChatBotsHoc"
import { ChatSessionHoc } from "./hocs/ChatSessionHoc"
import { ChatSessionMessagesHoc } from "./hocs/ChatSessionMessagesHoc"
import { ChatSessionsHoc } from "./hocs/ChatSessionsHoc"
import { OrganizationsHoc } from "./hocs/OrganizationsHoc"
import { ProjectHoc } from "./hocs/ProjectHoc"
import { ProjectsHoc } from "./hocs/ProjectsHoc"
import { UserHoc } from "./hocs/UserHoc"
import { ProjectRoute } from "./ProjectRoute"
import { ProtectedRoute } from "./ProtectedRoute"

export const getElement = (routeNames: RouteNames) => {
  switch (routeNames) {
    case RouteNames.ORGANIZATION_DASHBOARD:
      return (
        <ProtectedRoute>
          <UserHoc>
            {(user) => (
              <OrganizationsHoc>
                {(organization) => (
                  <ProjectsHoc>
                    {(projects) => (
                      <DashboardRoute user={user} projects={projects} organization={organization} />
                    )}
                  </ProjectsHoc>
                )}
              </OrganizationsHoc>
            )}
          </UserHoc>
        </ProtectedRoute>
      )

    case RouteNames.PROJECT:
      return (
        <ProjectHoc>
          {(project) => (
            <ChatBotsHoc projectId={project.id}>
              {(chatBots) => <ProjectRoute project={project} chatBots={chatBots} />}
            </ChatBotsHoc>
          )}
        </ProjectHoc>
      )

    case RouteNames.CHAT_BOT:
      return (
        <ChatBotHoc>
          {(chatBot) => (
            <ChatSessionsHoc>
              {(chatSessions) => <ChatBotRoute chatBot={chatBot} chatSessions={chatSessions} />}
            </ChatSessionsHoc>
          )}
        </ChatBotHoc>
      )

    case RouteNames.CHAT_SESSION:
      return (
        <ChatSessionHoc>
          {(chatSession) => (
            <ChatSessionMessagesHoc>
              {(messages) => <ChatSessionRoute chatSession={chatSession} messages={messages} />}
            </ChatSessionMessagesHoc>
          )}
        </ChatSessionHoc>
      )

    default:
      break
  }
}
