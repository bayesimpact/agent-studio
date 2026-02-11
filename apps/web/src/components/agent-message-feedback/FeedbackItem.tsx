import type { AgentMessageFeedback } from "@/features/agent-message-feedback/agent-message-feedback.models"

export function FeedbackItem({ feedback }: { feedback: AgentMessageFeedback }) {
  const createdAt = new Date(feedback.createdAt).toLocaleString()
  return (
    <div className="border rounded-lg p-4 bg-card">
      <div className="flex justify-between items-start mb-2">
        <span className="text-sm text-muted-foreground">Message ID: {feedback.agentMessageId}</span>
        <span className="text-xs text-muted-foreground">{createdAt}</span>
      </div>
      <p className="text-sm">{feedback.content}</p>
    </div>
  )
}
