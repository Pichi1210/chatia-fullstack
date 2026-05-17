import {
  AlertCircle,
  Building,
  Clock,
  ExternalLink,
  MapPin,
  Phone,
  Star,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/i18n"

interface MedicalCenter {
  name: string
  institution_type_name?: string | null
  main_services?: string[]
  main_specialties?: string[]
  recommendation_reason?: string | null
  address?: string | null
  city?: string | null
  district?: string | null
  phone?: string | null
  website?: string | null
  working_hours?: string | null
  rating?: number | null
  price_level?: string | null
  has_emergency?: boolean | null
  is_public?: boolean | null
  description?: string | null
}

interface MedicalCenterCardProps {
  center: MedicalCenter
  recommendedService?: string | null
  recommendedSpecialty?: string | null
}

export function MedicalCenterCard({
  center,
  recommendedService,
  recommendedSpecialty,
}: MedicalCenterCardProps) {
  const { t } = useLanguage()
  const services = center.main_services?.length ? center.main_services : []
  const specialties = center.main_specialties?.length ? center.main_specialties : []
  const typeLabel = center.institution_type_name || t("medical.typeMissing")
  const hasRecommendedService =
    recommendedService && services.includes(recommendedService)
  const hasRecommendedSpecialty =
    recommendedSpecialty && specialties.includes(recommendedSpecialty)

  return (
    <div className="h-full overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
      <div className="p-4">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Building className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold leading-tight text-card-foreground">
                {center.name}
              </h4>
              <p className="text-sm text-muted-foreground">{typeLabel}</p>
            </div>
          </div>
          {center.rating != null && (
            <div className="flex items-center gap-1 rounded-md bg-secondary px-2 py-1">
              <Star className="h-3.5 w-3.5 fill-risk-medium text-risk-medium" />
              <span className="text-sm font-medium text-card-foreground">
                {center.rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        <div className="mb-3 flex flex-wrap gap-1.5">
          <Badge variant={center.is_public ? "secondary" : "outline"}>
            {center.is_public ? t("common.public") : t("common.private")}
          </Badge>
          {center.has_emergency && (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              {t("medical.emergency")}
            </Badge>
          )}
          {hasRecommendedService && (
            <Badge className="gap-1 bg-accent text-accent-foreground">
              {recommendedService}
            </Badge>
          )}
          {hasRecommendedSpecialty && (
            <Badge className="gap-1 bg-primary/10 text-primary">
              {recommendedSpecialty}
            </Badge>
          )}
        </div>

        {(center.recommendation_reason || center.description) && (
          <p className="mb-4 line-clamp-3 text-sm text-muted-foreground">
            {center.recommendation_reason || center.description}
          </p>
        )}

        {(services.length > 0 || specialties.length > 0) && (
          <div className="mb-4 space-y-2">
            {services.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {services.slice(0, 3).map((service) => (
                  <Badge key={service} variant="outline">
                    {service}
                  </Badge>
                ))}
              </div>
            )}
            {specialties.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {specialties.slice(0, 3).map((specialty) => (
                  <Badge key={specialty} variant="secondary">
                    {specialty}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>
              {center.address || t("medical.addressMissing")}
              {center.district ? `, ${center.district}` : ""}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4 shrink-0" />
            <span>{center.phone || t("medical.phoneMissing")}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 shrink-0" />
            <span>{center.working_hours || t("medical.hoursMissing")}</span>
          </div>
        </div>
      </div>

      {center.website && (
        <div className="border-t border-border bg-secondary/30 px-4 py-3">
          <Button variant="outline" size="sm" className="w-full gap-2" asChild>
            <a href={center.website} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              {t("medical.site")}
            </a>
          </Button>
        </div>
      )}
    </div>
  )
}
