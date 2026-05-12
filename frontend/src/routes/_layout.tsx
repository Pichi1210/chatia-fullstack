import {
  createFileRoute,
  Outlet,
  redirect,
  useRouterState,
} from "@tanstack/react-router"
import { Menu } from "lucide-react"

import AppSidebar from "@/components/Sidebar/AppSidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { isLoggedIn } from "@/hooks/useAuth"

export const Route = createFileRoute("/_layout")({
  component: Layout,
  beforeLoad: async () => {
    if (!isLoggedIn()) {
      throw redirect({
        to: "/login",
      })
    }
  },
})

function Layout() {
  const router = useRouterState()
  const isChatRoute = router.location.pathname === "/chat"

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset className={isChatRoute ? "h-screen" : undefined}>
        <div className="relative flex h-full flex-col">
          <div className="absolute left-4 top-4 z-20">
            <SidebarTrigger className="h-10 w-10 rounded-full border border-border bg-card/80 shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-card">
              <Menu className="h-4 w-4" />
              <span className="sr-only">Alternar menu lateral</span>
            </SidebarTrigger>
          </div>
          <main className={isChatRoute ? "flex-1" : "flex-1 p-6 pt-20 md:p-8 md:pt-20"}>
            <div className={isChatRoute ? "h-full" : "mx-auto max-w-7xl"}>
              <Outlet />
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
