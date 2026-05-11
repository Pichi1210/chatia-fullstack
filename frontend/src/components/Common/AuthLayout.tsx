import { Appearance } from "@/components/Common/Appearance"
import { Logo } from "@/components/Common/Logo"
import { Footer } from "./Footer"

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative hidden bg-muted lg:flex lg:items-center lg:justify-center">
        <div className="flex max-w-md flex-col items-center gap-6 text-center">
          <Logo variant="full" className="h-20" asLink={false} />
          <div className="space-y-2">
            <p className="text-lg font-semibold text-foreground">
              Asistente para seleccion de centros medicos
            </p>
            <p className="text-sm text-muted-foreground">
              ВИЛПУ — подбор медицинского учреждения
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-end">
          <Appearance />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">{children}</div>
        </div>
        <Footer />
      </div>
    </div>
  )
}
