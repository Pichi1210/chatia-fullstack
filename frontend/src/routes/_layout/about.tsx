import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/lib/i18n"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_layout/about")({
  component: AboutPage,
  head: () => ({
    meta: [{ title: "Acerca de VILPU" }],
  }),
})

function AboutPage() {
  const { t } = useLanguage()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">
          {t("about.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("about.description")}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("about.purpose.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>{t("about.purpose.body1")}</p>
            <p>{t("about.purpose.body2")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("about.scope.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>{t("about.scope.body1")}</p>
            <p>{t("about.scope.body2")}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
