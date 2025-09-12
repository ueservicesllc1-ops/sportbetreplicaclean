import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dices } from 'lucide-react';

export default function CasinoPage() {
  return (
    <div className="space-y-8">
       <div className="flex items-center gap-4">
        <Dices className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Casino</h1>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
           <Card key={index} className="overflow-hidden">
            <CardHeader className='p-0'>
                 <div className="aspect-[4/3] bg-secondary flex items-center justify-center">
                    <p className="text-muted-foreground text-sm">Próximamente</p>
                 </div>
            </CardHeader>
            <CardContent className="p-4">
                <h3 className="font-semibold">Juego de Casino {index + 1}</h3>
                <p className="text-sm text-muted-foreground">Categoría del Juego</p>
            </CardContent>
           </Card>
        ))}
      </div>
       <Card className="mt-8 text-center">
        <CardHeader>
          <CardTitle>¡Nuevos Juegos en Camino!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Estamos trabajando para traerte los mejores y más emocionantes juegos de casino. ¡Vuelve pronto!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
