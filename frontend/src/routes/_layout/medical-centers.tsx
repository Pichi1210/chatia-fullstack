import { OpenAPI } from "@/client"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiLanguageHeaders, useLanguage } from "@/lib/i18n"
import { createFileRoute } from "@tanstack/react-router"
import { Building2, Clock, MapPin, Phone, Star } from "lucide-react"
import { useEffect, useState } from "react"

type MedicalCenter = {
  id: number
  name: string
  institution_type_name?: string | null
  address?: string | null
  district?: string | null
  phone?: string | null
  working_hours?: string | null
  rating?: number | null
  has_emergency?: boolean | null
  is_public?: boolean | null
  description?: string | null
}

type MedicalCentersResponse = {
  data: MedicalCenter[]
  count: number
}

export const Route = createFileRoute("/_layout/medical-centers")({
  component: MedicalCentersPage,
  head: () => ({
    meta: [{ title: "Centros medicos - VILPU" }],
  }),
})

function MedicalCentersPage() {
  const { language, t } = useLanguage()
  const [centers, setCenters] = useState<MedicalCenter[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadCenters = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`${OpenAPI.BASE}/api/v1/medical-centers/`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
            ...apiLanguageHeaders(language),
          },
        })
        if (!response.ok) return
        const data = (await response.json()) as MedicalCentersResponse
        setCenters(Array.isArray(data.data) ? data.data : [])
      } finally {
        setIsLoading(false)
      }
    }

    loadCenters()
  }, [language])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">
          {t("medical.centersTitle")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("medical.centersSubtitle")}
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t("medical.centersLoading")}</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {centers.map((center) => (
            <Card key={center.id} className="bg-card">
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base leading-6">{center.name}</CardTitle>
                  {center.rating != null && (
                    <Badge variant="outline">
                      <Star className="mr-1 h-3 w-3 fill-current" />
                      {center.rating.toFixed(1)}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    {center.is_public ? t("common.public") : t("common.private")}
                  </Badge>
                  <Badge variant={center.has_emergency ? "destructive" : "outline"}>
                    {t("medical.emergency")}:{" "}
                    {center.has_emergency ? t("common.yes") : t("common.no")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm">
                {center.description && (
                  <p className="text-muted-foreground">{center.description}</p>
                )}
                <p className="flex gap-2">
                  <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {center.institution_type_name || t("medical.typeMissing")}
                </p>
                <p className="flex gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    {center.address || t("medical.addressMissing")}
                    <span className="block text-muted-foreground">
                      {t("medical.district")}:{" "}
                      {center.district || t("medical.districtMissing")}
                    </span>
                  </span>
                </p>
                <p className="flex gap-2">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {center.phone || t("medical.phoneMissing")}
                </p>
                <p className="flex gap-2">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {center.working_hours || t("medical.hoursMissing")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
