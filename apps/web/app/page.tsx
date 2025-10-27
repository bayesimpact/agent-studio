import { ChatInterface } from '../components/chat-interface'

export default function Home() {
  return (
    <div className="min-h-screen bg-background px-4">
      <div className="flex justify-center items-center py-6">
        <h1 className="text-3xl font-bold text-primary">CaseAI Connect</h1>
      </div>
      <ChatInterface />
    </div>
  );
}
