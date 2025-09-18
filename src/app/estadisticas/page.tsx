
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Construction } from "lucide-react";

export default function EstadisticasPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-primary font-headline">Estadísticas Deportivas</h1>
        <p className="mt-2 text-lg text-muted-foreground">Tu centro de datos para apuestas informadas.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Construction className="h-6 w-6 text-yellow-500" />
            <span>Sección en Construcción</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            ¡Estamos trabajando para traerte un completo centro de estadísticas! Esta sección está diseñada para darte toda la información que necesitas para analizar cada partido y tomar decisiones de apuesta más inteligentes.
          </p>
          <p className="font-semibold text-foreground">
            Actualmente, la API que utilizamos (`the-odds-api`) solo nos proporciona cuotas de apuestas, pero no datos estadísticos históricos.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            <span>Próximamente</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
            <p className="mb-4 text-muted-foreground">
                Para implementar esta funcionalidad, necesitamos integrar una API de datos deportivos dedicada. Una vez integrada, aquí encontrarás:
            </p>
            <ul className="space-y-3 text-muted-foreground list-disc pl-5">
                <li><span className="font-semibold">Clasificaciones de Ligas:</span> Tablas de posiciones actualizadas para las principales competiciones.</li>
                <li><span className="font-semibold">Resultados Anteriores:</span> Historial de partidos recientes de cada equipo.</li>
                <li><span className="font-semibold">Estadísticas Head-to-Head (H2H):</span> Comparativas directas entre dos equipos.</li>
                <li><span className="font-semibold">Datos de Jugadores:</span> Goleadores, asistentes y más estadísticas individuales.</li>
                <li><span className="font-semibold">Forma del Equipo:</span> Análisis de los últimos 5-10 partidos jugados.</li>
            </ul>
        </CardContent>
      </Card>
    </div>
  );
}
