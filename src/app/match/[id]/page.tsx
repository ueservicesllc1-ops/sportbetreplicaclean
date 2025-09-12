import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

interface MatchDetailsPageProps {
    params: {
        id: string;
    }
}

export default function MatchDetailsPage({ params }: MatchDetailsPageProps) {
    return (
        <main className="container mx-auto max-w-4xl py-8">
            <Card className="text-center">
                <CardHeader>
                    <CardTitle>Detalles del Partido</CardTitle>
                    <CardDescription>ID del Evento: {params.id}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                       Esta página mostrará información detallada del partido cuando la API de pago esté integrada.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Aquí verás estadísticas en vivo como minutos jugados, córners, goles, y todos los mercados de apuestas disponibles.
                    </p>
                     <Button asChild>
                        <Link href="/">Volver al inicio</Link>
                    </Button>
                </CardContent>
            </Card>
        </main>
    )
}