import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface MedicalCenter {
    name: string;
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
}

export function MedicalCenterCard({ center }: MedicalCenterCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{center.name}</CardTitle>
                <div className="flex flex-wrap gap-2">
                    {center.has_emergency && <Badge variant="destructive">Urgencias</Badge>}
                    {center.is_public && <Badge variant="secondary">Publico</Badge>}
                    {center.price_level && <Badge variant="outline">{center.price_level}</Badge>}
                </div>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
                {center.description && <p>{center.description}</p>}
                {center.address && <p>{center.address}</p>}
                {center.district && <p>Distrito: {center.district}</p>}
                {center.phone && <p>Tel: {center.phone}</p>}
                {center.working_hours && <p>Horario: {center.working_hours}</p>}
                {center.rating && <p>Rating: {center.rating} / 5</p>}
                {center.website && (
                    <a
                        href={center.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                    >
                        Sitio web
                    </a>
                )}
            </CardContent>
        </Card>
    );
}
