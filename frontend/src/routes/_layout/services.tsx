import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/lib/i18n"
import { createFileRoute } from "@tanstack/react-router"
import { FlaskConical, HeartPulse, Pill, ShieldPlus, Stethoscope } from "lucide-react"

const services = [
  {
    icon: Stethoscope,
    titleKey: "services.consultation.title",
    descriptionKey: "services.consultation.description",
  },
  {
    icon: ShieldPlus,
    titleKey: "services.emergency.title",
    descriptionKey: "services.emergency.description",
  },
  {
    icon: FlaskConical,
    titleKey: "services.labs.title",
    descriptionKey: "services.labs.description",
  },
  {
    icon: HeartPulse,
    titleKey: "services.specialties.title",
    descriptionKey: "services.specialties.description",
  },
  {
    icon: Pill,
    titleKey: "services.pharmacy.title",
    descriptionKey: "services.pharmacy.description",
  },
] as const

export const Route = createFileRoute("/_layout/services")({
  component: ServicesPage,
  head: () => ({
    meta: [{ title: "Servicios - VILPU" }],
  }),
})

function ServicesPage() {
  const { t } = useLanguage()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">
          {t("services.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("services.description")}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {services.map(({ icon: Icon, titleKey, descriptionKey }) => (
          <Card key={titleKey} className="bg-card">
            <CardHeader className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <CardTitle className="text-base">{t(titleKey)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-6 text-muted-foreground">
                {t(descriptionKey)}
              </p>
              <Badge variant="secondary">{t("services.available")}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
