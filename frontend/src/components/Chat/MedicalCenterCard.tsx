
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';

interface MedicalCenterCardProps {
    center: any;
}

export function MedicalCenterCard({ center }: MedicalCenterCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{center.name}</CardTitle>
                <Badge variant="secondary">{center.category}</Badge>
            </CardHeader>
            <CardContent className="text-sm">
                <p>{center.address}</p>
                {center.phone && <p>Tel: {center.phone}</p>}
                {center.rating && <p>Rating: {center.rating} / 5</p>}
                {center.yandex_uri && (
                    <a href={center.yandex_uri} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                        Ver en Yandex Maps
                    </a>
                )}
            </CardContent>
        </Card>
    );
}
