
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Target, ShieldCheck } from "lucide-react";

export default function QuienesSomosPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-primary font-headline">Quiénes Somos</h1>
        <p className="mt-2 text-lg text-muted-foreground">Wingo: La Plataforma para el Apostador Estratégico</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            <span>Nuestra Filosofía</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            En Wingo, entendemos que las apuestas deportivas son más que simple azar. Son un ejercicio de análisis, estrategia y conocimiento. Por eso, hemos diseñado una plataforma para un público inteligente y exigente, que valora la información, la transparencia y las herramientas que marcan la diferencia entre una corazonada y una decisión informada.
          </p>
          <p>
            No somos solo un sitio de apuestas más. Somos el copiloto del apostador analítico, el aliado del estratega y el campo de juego para quienes ven el deporte con una mente calculadora.
          </p>
        </CardContent>
      </Card>

       <div className="grid md:grid-cols-2 gap-8">
        <Card>
            <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Target className="h-6 w-6" />
                <span>Nuestra Misión</span>
            </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
                <p>
                    Nuestra misión es empoderar a nuestros usuarios con una experiencia de apuestas superior, segura y transparente. Ofrecemos datos precisos, cuotas competitivas y una interfaz intuitiva que te permite concentrarte en lo que realmente importa: analizar el juego y tomar las mejores decisiones.
                </p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-6 w-6" />
                <span>Nuestro Compromiso</span>
            </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
                 <p>
                    La seguridad y el juego responsable son los pilares de Wingo. Nos comprometemos a proteger tus fondos y tus datos con la tecnología más avanzada, y a promover un entorno de apuestas saludable, ofreciendo herramientas para el autocontrol y el apoyo necesario para garantizar que la experiencia sea siempre positiva.
                </p>
            </CardContent>
        </Card>
       </div>
    </div>
  );
}
