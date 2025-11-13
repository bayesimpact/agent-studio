import { ChatInterface } from '../../components/chat-interface'
import { CountrySwitcher } from '../../components/country-switcher'

export default function USPage() {
  return (
    <div className="min-h-screen bg-background px-4">
      <div className="flex justify-between items-center py-6 px-4">
        <h1 className="text-3xl font-bold text-primary">CaseAI Connect</h1>
        <CountrySwitcher currentCountry="us" />
      </div>
      <ChatInterface country="us" />
    </div>
  );
}