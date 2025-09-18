
import Link from 'next/link';
import { Logo } from '../logo';
import { Separator } from '../ui/separator';

const footerSections = {
  'Sobre Nosotros': [['Quiénes somos', '/quienes-somos'], ['Juego Responsable', '/juego-responsable'], ['Términos y Condiciones', '/terminos-y-condiciones']],
  Ayuda: [['Contáctanos', '#'], ['Preguntas Frecuentes', '#'], ['Reglas de Apuestas', '/reglas-de-apuestas']],
  Social: [['Facebook', '#'], ['Twitter', '#'], ['Instagram', '#']],
};

export function Footer() {
  return (
    <footer className="border-t bg-card text-card-foreground">
      <div className="w-full px-4 py-8 md:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {Object.entries(footerSections).map(([title, links]) => (
            <div key={title}>
              <h3 className="font-headline text-lg font-semibold">{title}</h3>
              <ul className="mt-4 space-y-2">
                {links.map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="text-sm text-muted-foreground hover:text-primary">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <Separator className="my-8" />
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <Logo className="h-auto w-40" />
            <p className="text-center text-sm text-muted-foreground">
                © {new Date().getFullYear()} SportBet Replica. Todos los derechos reservados.
            </p>
             <Link href="/dev/ui-parity-check" className="text-sm text-muted-foreground hover:text-primary">
                Dev: UI Parity Check
            </Link>
        </div>
      </div>
    </footer>
  );
}
