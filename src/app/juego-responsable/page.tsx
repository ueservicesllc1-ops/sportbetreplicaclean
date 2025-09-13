
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Handshake, ListChecks, Goal, LifeBuoy } from "lucide-react";

export default function JuegoResponsablePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-primary font-headline">Juego Responsable</h1>
        <p className="mt-2 text-lg text-muted-foreground">Tu bienestar es nuestra prioridad.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Handshake className="h-6 w-6" />
            <span>Nuestro Compromiso</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            En Wingo, estamos comprometidos con ofrecer una experiencia de apuestas divertida, emocionante y, sobre todo, segura. El juego debe ser una forma de entretenimiento, no una fuente de estrés financiero o emocional. Promovemos activamente el juego responsable y proporcionamos herramientas para ayudarte a mantener el control.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="h-6 w-6" />
            <span>Consejos para Jugar de Forma Responsable</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
            <ul className="space-y-3 text-muted-foreground list-disc pl-5">
                <li><span className="font-semibold">Juega para entretenerte, no para ganar dinero:</span> Considera el dinero que gastas en apuestas como el costo del entretenimiento.</li>
                <li><span className="font-semibold">Establece límites de depósito y tiempo:</span> Decide de antemano cuánto dinero y tiempo estás dispuesto a gastar y no excedas esos límites.</li>
                <li><span className="font-semibold">Nunca persigas tus pérdidas:</span> Acepta las pérdidas como parte del juego. Intentar recuperar el dinero perdido suele llevar a pérdidas mayores.</li>
                <li><span className="font-semibold">No juegues bajo presión emocional:</span> Evita apostar si estás estresado, ansioso o deprimido. Las decisiones tomadas en estados emocionales alterados suelen ser malas decisiones.</li>
                <li><span className="font-semibold">Equilibra el juego con otras actividades:</span> Asegúrate de que las apuestas no interfieran con tus responsabilidades diarias, tu trabajo o tus relaciones personales.</li>
            </ul>
        </CardContent>
      </Card>

       <div className="grid md:grid-cols-2 gap-8">
        <Card>
            <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Goal className="h-6 w-6" />
                <span>Herramientas de Autocontrol</span>
            </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-2">
                <p>
                    Ofrecemos herramientas para ayudarte a gestionar tu juego:
                </p>
                 <ul className="list-disc pl-5">
                    <li><span className="font-semibold">Límites de depósito:</span> Controla la cantidad de dinero que puedes depositar diaria, semanal o mensualmente.</li>
                    <li><span className="font-semibold">Autoexclusión:</span> Si sientes que necesitas un descanso, puedes suspender tu cuenta por un período determinado o de forma permanente.</li>
                </ul>
                 <p className="pt-2 text-sm">Puedes configurar estas opciones en la sección de tu perfil o contactando a nuestro equipo de soporte.</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <LifeBuoy className="h-6 w-6" />
                <span>¿Necesitas Ayuda?</span>
            </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
                 <p>
                    Si sientes que el juego se está convirtiendo en un problema para ti o para alguien que conoces, busca ayuda profesional. Existen organizaciones dedicadas a ofrecer apoyo gratuito y confidencial. No estás solo.
                </p>
            </CardContent>
        </Card>
       </div>
    </div>
  );
}
