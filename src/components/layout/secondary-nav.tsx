
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const secondaryNavLinks = [
    { name: 'Resultados en Vivo', href: '/#' },
    { name: 'Estadísticas', href: '/estadisticas' },
    { name: 'Reglas', href: '/reglas-de-apuestas' },
    { name: 'Noticias', href: '/#' },
];


export function SecondaryNav() {
  return (
    <div className="border-b bg-secondary/50">
      <div className="w-full px-4 md:px-6">
        <ScrollArea className="whitespace-nowrap">
          <div className="flex h-10 items-center justify-center space-x-2">
            {secondaryNavLinks.map((link) => (
              <Link href={link.href} key={link.name} passHref>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">
                  {link.name}
                </Button>
              </Link>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>
      </div>
    </div>
  );
}
