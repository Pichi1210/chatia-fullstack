import { createFileRoute } from "@tanstack/react-router"
import ChatInterface from "@/components/Chat/ChatInterface"
import { z } from "zod"

const searchSchema = z.object({
  chat: z.string().optional().catch(undefined),
  new: z.string().optional().catch(undefined),
})

export const Route = createFileRoute("/_layout/chat")({
  component: ChatPage,
  validateSearch: searchSchema,
})

function ChatPage() {
  const { chat, new: newChatKey } = Route.useSearch()

  return <ChatInterface chatId={chat} newChatKey={newChatKey} />
}
