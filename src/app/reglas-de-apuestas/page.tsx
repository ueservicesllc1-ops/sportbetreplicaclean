
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Scale, AlertTriangle, CheckCircle, Ban } from "lucide-react";
import { SoccerBallIcon } from "@/components/icons/soccer-ball-icon";
import { TennisBallIcon } from "@/components/icons/tennis-ball-icon";
import { BasketballIcon } from "@/components/icons/basketball-icon";


export default function ReglasDeApuestasPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-primary font-headline">Reglas de Apuestas</h1>
        <p className="mt-2 text-lg text-muted-foreground">Entiende cómo se determinan y pagan tus apuestas.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-6 w-6" />
            <span>Reglas Generales</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
            <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 mt-1 text-green-500 flex-shrink-0" />
                <p><span className="font-semibold text-foreground">Resultados Oficiales:</span> Todas las apuestas se resuelven según el resultado oficial proporcionado por el organismo rector del evento. Decisiones posteriores (por ejemplo, por dopaje) no afectan las apuestas ya resueltas.</p>
            </div>
            <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 mt-1 text-yellow-500 flex-shrink-0" />
                <p><span className="font-semibold text-foreground">Errores Evidentes (Palpables):</span> Nos reservamos el derecho de anular apuestas que se hayan aceptado con cuotas claramente incorrectas debido a un error humano o técnico. </p>
            </div>
             <div className="flex items-start gap-3">
                <Ban className="h-5 w-5 mt-1 text-red-500 flex-shrink-0" />
                <p><span className="font-semibold text-foreground">Anulación de Apuestas:</span> Si un evento se cancela o pospone por más de 48 horas, todas las apuestas serán anuladas y el monto apostado será devuelto, a menos que el resultado ya estuviera determinado.</p>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reglas por Deporte</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible defaultValue="futbol">
            <AccordionItem value="futbol">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                    <SoccerBallIcon className="h-5 w-5"/>
                    <span className="text-lg font-medium">Fútbol</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-3 text-muted-foreground list-disc pl-5">
                    <li><span className="font-semibold">Tiempo Reglamentario (90 Minutos):</span> A menos que se especifique lo contrario (ej. "incluye prórroga"), todas las apuestas de fútbol se basan en el resultado al final de los 90 minutos de juego más el tiempo de descuento.</li>
                    <li><span className="font-semibold">Mercados de Tarjetas:</span> Solo cuentan las tarjetas mostradas a los jugadores en el campo. Las tarjetas a entrenadores o jugadores en el banquillo no cuentan. Una tarjeta roja directa cuenta como 2 tarjetas para algunos mercados.</li>
                    <li><span className="font-semibold">Mercados de Córners:</span> Solo cuentan los córners que se ejecutan. Los córners concedidos pero no ejecutados no cuentan.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="baloncesto">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                    <BasketballIcon className="h-5 w-5"/>
                    <span className="text-lg font-medium">Baloncesto</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                 <ul className="space-y-3 text-muted-foreground list-disc pl-5">
                    <li><span className="font-semibold">Prórroga Incluida:</span> Para mercados como "Ganador del partido" (Moneyline) y Hándicap, el tiempo extra (prórroga) siempre cuenta para el resultado final.</li>
                    <li><span className="font-semibold">Actuaciones de Jugadores:</span> Las apuestas sobre puntos, rebotes, asistencias, etc., de un jugador serán anuladas si el jugador no participa en el partido.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
             <AccordionItem value="tenis">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                    <TennisBallIcon className="h-5 w-5"/>
                    <span className="text-lg font-medium">Tenis</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-3 text-muted-foreground list-disc pl-5">
                    <li><span className="font-semibold">Retirada de Jugadores:</span> Si un jugador se retira durante un partido, todas las apuestas a "Ganador del partido" serán anuladas. Las apuestas en mercados cuyo resultado ya esté determinado (ej. "Ganador del Primer Set") se mantendrán.</li>
                    <li><span className="font-semibold">Cambios de Superficie o Sede:</span> Si el partido se juega en una superficie o sede diferente a la programada, las apuestas se mantendrán.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
