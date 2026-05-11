import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createFileRoute } from "@tanstack/react-router"
import { FlaskConical, HeartPulse, Pill, ShieldPlus, Stethoscope } from "lucide-react"

const services = [
  {
    icon: Stethoscope,
    title: "Consulta medica",
    description: "Orientacion hacia policlinicos, clinicas y especialidades.",
  },
  {
    icon: ShieldPlus,
    title: "Atencion urgente",
    description: "Derivacion a hospital o urgencias cuando hay signos de alarma.",
  },
  {
    icon: FlaskConical,
    title: "Analisis y laboratorio",
    description: "Busqueda de centros para estudios basicos y pruebas clinicas.",
  },
  {
    icon: HeartPulse,
    title: "Especialidades",
    description: "Traumatologia, odontologia, oftalmologia, ginecologia y mas.",
  },
  {
    icon: Pill,
    title: "Farmacia",
    description: "Orientacion para compra de medicamentos y productos de salud.",
  },
]

export const Route = createFileRoute("/_layout/services")({
  component: ServicesPage,
  head: () => ({
    meta: [{ title: "Servicios - VILPU" }],
  }),
})

function ServicesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Servicios</h1>
        <p className="text-sm text-muted-foreground">
          Tipos de orientacion disponibles en el sistema VILPU.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {services.map(({ icon: Icon, title, description }) => (
          <Card key={title} className="bg-card">
            <CardHeader className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-6 text-muted-foreground">{description}</p>
              <Badge variant="secondary">Disponible en triaje</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
