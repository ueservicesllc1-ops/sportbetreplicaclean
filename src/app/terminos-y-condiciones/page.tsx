
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, UserCheck, Landmark, Gavel, ShieldBan, AlertTriangle, Gift } from "lucide-react";

export default function TerminosPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-primary font-headline">Términos y Condiciones</h1>
        <p className="mt-2 text-lg text-muted-foreground">Última actualización: {new Date().toLocaleDateString()}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            <span>1. Aceptación de los Términos</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            Al registrarse y utilizar los servicios de Wingo, usted confirma que ha leído, entendido y aceptado estar sujeto a estos Términos y Condiciones. Si no está de acuerdo con alguna parte de estos términos, no debe utilizar nuestros servicios. Nos reservamos el derecho de modificar estos términos en cualquier momento.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-6 w-6" />
            <span>2. Cuentas de Usuario</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            Debe ser mayor de 18 años para crear una cuenta. Usted es el único responsable de mantener la confidencialidad de su información de inicio de sesión y de todas las actividades que ocurran en su cuenta. Debe notificarnos inmediatamente sobre cualquier uso no autorizado de su cuenta. Solo se permite una cuenta por persona.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="h-6 w-6" />
            <span>3. Depósitos y Retiros</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            Todos los depósitos y retiros están sujetos a nuestros procesos de verificación. Podemos requerir documentación de identidad (KYC) antes de procesar cualquier transacción. Usted declara que los fondos utilizados en nuestra plataforma no provienen de ninguna actividad ilegal.
          </p>
        </CardContent>
      </Card>

        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-6 w-6" />
            <span>4. Bonos y Promociones</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            El bono de bienvenida y otros fondos promocionales se otorgan con el único propósito de jugar en la plataforma. Estos fondos no pueden ser retirados directamente. Solo las ganancias generadas a partir de las apuestas realizadas con el saldo total (depósitos + bonos) pueden ser elegibles para retiro, sujeto a las condiciones de cada promoción.
          </p>
        </CardContent>
      </Card>

        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gavel className="h-6 w-6" />
            <span>5. Reglas de Apuestas</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            Todas las apuestas realizadas en Wingo están sujetas a las reglas específicas del deporte y del mercado correspondiente. Nos reservamos el derecho de anular cualquier apuesta en caso de error evidente (por ejemplo, cuotas incorrectas) o actividad sospechosa. Las decisiones sobre el resultado de los eventos se basan en los resultados oficiales publicados.
          </p>
        </CardContent>
      </Card>

        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldBan className="h-6 w-6" />
            <span>6. Conducta del Usuario y Actividades Prohibidas</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            Está estrictamente prohibido el uso de software de arbitraje, bots, o cualquier forma de actividad fraudulenta. El abuso de bonos, el juego en grupo (sindicatos) y cualquier intento de manipular nuestros sistemas resultarán en el cierre inmediato de la cuenta y la confiscación de los fondos.
          </p>
        </CardContent>
      </Card>

        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6" />
            <span>7. Limitación de Responsabilidad</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            Wingo proporciona sus servicios "tal como están". No garantizamos que el servicio sea ininterrumpido o libre de errores. No seremos responsables de ninguna pérdida o daño que surja del uso de nuestro sitio, incluyendo pérdidas de ganancias o datos.
          </p>
        </CardContent>
      </Card>
      
    </div>
  );
}
