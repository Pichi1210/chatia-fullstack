import {
    Building2,
    Clock,
    MapPin,
    Phone,
    ShieldCheck,
    Star,
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface MedicalCenter {
    name: string;
    institution_type_name?: string | null;
    main_services?: string[];
    main_specialties?: string[];
    recommendation_reason?: string | null;
    address?: string | null;
    city?: string | null;
    district?: string | null;
    phone?: string | null;
    website?: string | null;
    working_hours?: string | null;
    rating?: number | null;
    price_level?: string | null;
    has_emergency?: boolean | null;
    is_public?: boolean | null;
    description?: string | null;
}

interface MedicalCenterCardProps {
    center: MedicalCenter;
    recommendedService?: string | null;
    recommendedSpecialty?: string | null;
}

const booleanText = (value?: boolean | null) => (value ? 'Si' : 'No');

export function MedicalCenterCard({
    center,
    recommendedService,
    recommendedSpecialty,
}: MedicalCenterCardProps) {
    const services = center.main_services?.length
        ? center.main_services
        : center.description
          ? [center.description]
          : [];

    return (
        <Card className="h-full border-border bg-card text-card-foreground shadow-sm">
            <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-base leading-6">{center.name}</CardTitle>
                    {center.rating != null && (
                        <Badge variant="outline" className="shrink-0">
                            <Star className="mr-1 h-3 w-3 fill-current" />
                            {center.rating.toFixed(1)}
                        </Badge>
                    )}
                </div>
                <div className="flex flex-wrap gap-2">
                    <Badge variant={center.has_emergency ? 'destructive' : 'outline'}>
                        Urgencias: {booleanText(center.has_emergency)}
                    </Badge>
                    <Badge variant="secondary">
                        {center.is_public ? 'Publico' : 'Privado'}
                    </Badge>
                    {center.institution_type_name && (
                        <Badge variant="outline">{center.institution_type_name}</Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
                {center.recommendation_reason && (
                    <p className="rounded-md bg-muted p-3 leading-6 text-muted-foreground">
                        {center.recommendation_reason}
                    </p>
                )}

                <div className="grid gap-3">
                    <div className="flex gap-2">
                        <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <div>
                            <p className="text-xs uppercase text-muted-foreground">
                                Tipo de institucion
                            </p>
                            <p>{center.institution_type_name || 'No informado'}</p>
                        </div>
                    </div>

                    <div>
                        <p className="mb-2 text-xs uppercase text-muted-foreground">
                            Servicios principales
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {recommendedService && (
                                <Badge variant="secondary">
                                    Recomendado: {recommendedService}
                                </Badge>
                            )}
                            {services.length > 0 ? (
                                services.map((service) => (
                                    <Badge key={service} variant="outline">
                                        {service}
                                    </Badge>
                                ))
                            ) : recommendedService ? null : (
                                <span className="text-muted-foreground">No informado</span>
                            )}
                        </div>
                    </div>

                    {((center.main_specialties && center.main_specialties.length > 0) ||
                        recommendedSpecialty) && (
                        <div>
                            <p className="mb-2 text-xs uppercase text-muted-foreground">
                                Especialidades
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {recommendedSpecialty && (
                                    <Badge variant="secondary">
                                        Recomendada: {recommendedSpecialty}
                                    </Badge>
                                )}
                                {center.main_specialties?.map((specialty) => (
                                    <Badge key={specialty} variant="secondary">
                                        {specialty}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <div>
                            <p className="text-xs uppercase text-muted-foreground">
                                Direccion
                            </p>
                            <p>{center.address || 'No informada'}</p>
                            <p className="text-muted-foreground">
                                Distrito: {center.district || 'No informado'}
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="flex gap-2">
                            <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            <div>
                                <p className="text-xs uppercase text-muted-foreground">
                                    Telefono
                                </p>
                                <p>{center.phone || 'No informado'}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            <div>
                                <p className="text-xs uppercase text-muted-foreground">
                                    Horario
                                </p>
                                <p>{center.working_hours || 'No informado'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <div>
                            <p className="text-xs uppercase text-muted-foreground">
                                Titularidad y atencion urgente
                            </p>
                            <p>
                                {center.is_public ? 'Publico' : 'Privado'} | Urgencias:{' '}
                                {booleanText(center.has_emergency)}
                            </p>
                        </div>
                    </div>
                </div>

                {center.website && (
                    <a
                        href={center.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex text-primary hover:underline"
                    >
                        Sitio web
                    </a>
                )}
            </CardContent>
        </Card>
    );
}
