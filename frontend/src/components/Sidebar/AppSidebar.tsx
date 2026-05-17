import {
  Building2,
  CircleHelp,
  MessageSquare,
  Plus,
  Stethoscope,
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { Link, useRouterState } from "@tanstack/react-router"

import { SidebarAppearance } from "@/components/Common/Appearance"
import { Logo } from "@/components/Common/Logo"
import { OpenAPI } from "@/client"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { type Item, Main } from "./Main"
import { User } from "./User"
import useAuth from "@/hooks/useAuth"
import { apiLanguageHeaders, useLanguage } from "@/lib/i18n"

interface ChatSessionSummary {
  id: string
  title: string
  updated_at: string
}

interface ChatSessionsResponse {
  data: ChatSessionSummary[]
  count: number
}

const fetchChatSessions = async (language: "es" | "ru") => {
  const response = await fetch(`${OpenAPI.BASE}/api/v1/chat/sessions?limit=8`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
      ...apiLanguageHeaders(language),
    },
  })

  if (!response.ok) {
    throw new Error("No se pudo cargar el historial de chats")
  }

  return (await response.json()) as ChatSessionsResponse
}

export function AppSidebar() {
  const { user: currentUser } = useAuth()
  const { language, t } = useLanguage()
  const router = useRouterState()
  const baseItems: Item[] = [
    { icon: MessageSquare, title: t("nav.chat"), path: "/chat" },
    { icon: Building2, title: t("nav.medicalCenters"), path: "/medical-centers" },
    { icon: Stethoscope, title: t("nav.services"), path: "/services" },
    { icon: CircleHelp, title: t("nav.about"), path: "/about" },
  ]
  const activeChatId =
    typeof router.location.search.chat === "string"
      ? router.location.search.chat
      : undefined
  const {
    data: chatSessions,
    isLoading: isLoadingChatSessions,
    isError: hasChatSessionsError,
  } = useQuery({
    queryKey: ["chatSessions", language],
    queryFn: () => fetchChatSessions(language),
    retry: false,
    refetchOnWindowFocus: false,
  })

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-sidebar-border bg-sidebar"
    >
      <SidebarHeader className="p-3">
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <Logo variant="responsive" />
          <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold tracking-normal text-sidebar-foreground">
              {language === "ru" ? "ВИЛПУ" : "VILPU"}
            </span>
            <span className="truncate text-[9px] text-sidebar-foreground/60">
              {t("nav.slogan")}
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <div className="px-2 py-2">
          <Button
            variant="outline"
            className="w-full justify-start gap-2 rounded-xl border-sidebar-border bg-sidebar-accent/50 text-sidebar-foreground hover:bg-sidebar-accent group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
            asChild
          >
            <Link to="/chat" search={{ new: Date.now().toString() }}>
              <Plus className="h-4 w-4" />
              <span className="group-data-[collapsible=icon]:hidden">
                {t("nav.newChat")}
              </span>
            </Link>
          </Button>
        </div>
        <Main items={baseItems} />
        <div className="mt-2 px-2 group-data-[collapsible=icon]:hidden">
          <p className="px-2 pb-2 text-[10px] font-medium uppercase tracking-normal text-sidebar-foreground/50">
            {t("nav.history")}
          </p>
          {isLoadingChatSessions ? (
            <p className="px-2 py-1.5 text-xs text-sidebar-foreground/50">
              {t("nav.historyLoading")}
            </p>
          ) : hasChatSessionsError ? (
            <p className="px-2 py-1.5 text-xs text-sidebar-foreground/50">
              {t("nav.historyError")}
            </p>
          ) : chatSessions?.data.length ? (
            <div className="flex flex-col gap-1">
              {chatSessions.data.map((chatSession) => (
                <Link
                  key={chatSession.id}
                  to="/chat"
                  search={{ chat: chatSession.id }}
                  className={`flex min-h-8 items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                    activeChatId === chatSession.id
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : ""
                  }`}
                >
                  <MessageSquare className="h-4 w-4 shrink-0" />
                  <span className="truncate">{chatSession.title}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="px-2 py-1.5 text-xs text-sidebar-foreground/50">
              {t("nav.historyEmpty")}
            </p>
          )}
        </div>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/30 p-3 group-data-[collapsible=icon]:p-2">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-primary" />
            <span className="text-xs text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
              {t("nav.localBase")}
            </span>
          </div>
          <span className="mt-1 block text-[10px] text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden">
            {t("nav.localData")}
          </span>
        </div>
        <SidebarAppearance />
        <User user={currentUser} />
      </SidebarFooter>
    </Sidebar>
  )
}

export default AppSidebar
