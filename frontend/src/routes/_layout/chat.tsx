
import { FileRoute } from '@tanstack/react-router'
import ChatInterface from '../../components/Chat/ChatInterface';

export const Route = new FileRoute('/_layout/chat').createRoute({
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
