import {
  Building2,
  CircleHelp,
  MessageSquare,
  Plus,
  Stethoscope,
} from "lucide-react"
import { Link } from "@tanstack/react-router"

import { SidebarAppearance } from "@/components/Common/Appearance"
import { Logo } from "@/components/Common/Logo"
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

const baseItems: Item[] = [
  { icon: MessageSquare, title: "Chat medico", path: "/chat" },
  { icon: Building2, title: "Centros medicos", path: "/medical-centers" },
  { icon: Stethoscope, title: "Servicios", path: "/services" },
  { icon: CircleHelp, title: "Acerca del sistema", path: "/about" },
]

export function AppSidebar() {
  const { user: currentUser } = useAuth()

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
              VILPU
            </span>
            <span className="truncate text-[9px] text-sidebar-foreground/60">
              Elige mejor. Vive mejor.
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
            <Link to="/chat">
              <Plus className="h-4 w-4" />
              <span className="group-data-[collapsible=icon]:hidden">
                Nueva consulta
              </span>
            </Link>
          </Button>
        </div>
        <Main items={baseItems} />
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/30 p-3 group-data-[collapsible=icon]:p-2">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-primary" />
            <span className="text-xs text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
              Base local de Kursk
            </span>
          </div>
          <span className="mt-1 block text-[10px] text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden">
            Datos medicos actualizados
          </span>
        </div>
        <SidebarAppearance />
        <User user={currentUser} />
      </SidebarFooter>
    </Sidebar>
  )
}

export default AppSidebar
