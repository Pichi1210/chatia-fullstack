import { BotMessageSquare, Building2, CircleHelp, Stethoscope } from "lucide-react"

import { SidebarAppearance } from "@/components/Common/Appearance"
import { Logo } from "@/components/Common/Logo"
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
  { icon: BotMessageSquare, title: "Chat medico", path: "/chat" },
  { icon: Building2, title: "Centros medicos", path: "/medical-centers" },
  { icon: Stethoscope, title: "Servicios", path: "/services" },
  { icon: CircleHelp, title: "Acerca del sistema", path: "/about" },
]

export function AppSidebar() {
  const { user: currentUser } = useAuth()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-4 py-5 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:items-center">
        <Logo variant="responsive" />
        <p className="mt-2 text-xs leading-5 text-muted-foreground group-data-[collapsible=icon]:hidden">
          Asistente para seleccion de centros medicos
        </p>
      </SidebarHeader>
      <SidebarContent>
        <Main items={baseItems} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarAppearance />
        <User user={currentUser} />
      </SidebarFooter>
    </Sidebar>
  )
}

export default AppSidebar
