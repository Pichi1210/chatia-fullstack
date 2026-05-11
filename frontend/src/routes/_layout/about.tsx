import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_layout/about")({
  component: AboutPage,
  head: () => ({
    meta: [{ title: "Acerca de VILPU" }],
  }),
})

function AboutPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Acerca del sistema</h1>
        <p className="text-sm text-muted-foreground">
          VILPU / ВИЛПУ ayuda a orientar la seleccion de centros medicos en Kursk.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Proposito</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>
              VILPU recibe una necesidad medica, realiza preguntas de triaje y
              recomienda el tipo de institucion mas adecuado segun reglas locales.
            </p>
            <p>
              El sistema orienta la decision inicial: farmacia, laboratorio,
              policlinico, clinica especializada u hospital/urgencias.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alcance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>
              La aplicacion trabaja con datos locales de Kursk y no reemplaza una
              evaluacion medica profesional.
            </p>
            <p>
              El objetivo es guiar hacia el recurso adecuado, no diagnosticar
              enfermedades.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
