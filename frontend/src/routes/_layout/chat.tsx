
import { createFileRoute } from '@tanstack/react-router'
import ChatInterface from '../../components/Chat/ChatInterface';

export const Route = createFileRoute('/_layout/chat')({
  component: ChatPage,
})

function ChatPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Chatbot de Centros Médicos</h1>
      <ChatInterface />
    </div>
  )
}
