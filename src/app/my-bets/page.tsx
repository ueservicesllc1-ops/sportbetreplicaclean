
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  type Timestamp,
} from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";


interface BetSelection {
  event: string;
  selection: string;
  odd: number;
  market: string;
}

interface BetDoc {
  id: string;
  userId: string;
  bets: BetSelection[];
  stake: number;
  totalOdds: number;
  potentialWinnings: number;
  status: 'pending' | 'won' | 'lost';
  createdAt: Timestamp;
}

function BetStatusBadge({ status }: { status: BetDoc['status'] }) {
    return (
        <Badge
            variant={status === 'pending' ? 'secondary' : status === 'won' ? 'default' : 'destructive'}
            className={status === 'won' ? 'bg-green-600 text-white' : ''}
        >
            {status === 'pending' ? 'Pendiente' : status === 'won' ? 'Ganada' : 'Perdida'}
        </Badge>
    );
}

export default function MyBetsPage() {
  const { user, loading: authLoading } = useAuth();
  const [bets, setBets] = useState<BetDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'user_bets'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const userBets: BetDoc[] = [];
      querySnapshot.forEach((doc) => {
        userBets.push({ id: doc.id, ...doc.data() } as BetDoc);
      });
      // Sort bets by creation date on the client side
      const sortedBets = userBets.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
      setBets(sortedBets);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  if (loading || authLoading) {
    return (
      <div className="container mx-auto max-w-4xl py-8 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-muted-foreground">Cargando tus apuestas...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto max-w-4xl py-8 text-center">
        <h1 className="text-2xl font-bold">Mis Apuestas</h1>
        <p className="mt-4 text-muted-foreground">
          Debes iniciar sesión para ver tu historial de apuestas.
        </p>
        <Button asChild className="mt-4">
            <Link href="/">Volver al inicio</Link>
        </Button>
      </div>
    );
  }
  

  return (
    <div className="container mx-auto max-w-6xl py-8">
      <div className='flex items-center justify-between mb-8'>
        <h1 className="text-3xl font-bold tracking-tight">Mis Apuestas</h1>
         <Button asChild variant="outline">
            <Link href="/">Volver al inicio</Link>
        </Button>
      </div>

      {bets.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-muted-foreground">Aún no has realizado ninguna apuesta.</p>
          <p className="text-sm text-muted-foreground mt-2">¡Dirígete a la página principal para empezar!</p>
        </Card>
      ) : (
        <>
        {/* Mobile View */}
        <div className="space-y-4 md:hidden">
          {bets.map((bet) => (
            <Card key={bet.id}>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-base">
                  {new Date(bet.createdAt.seconds * 1000).toLocaleString()}
                </CardTitle>
                <BetStatusBadge status={bet.status} />
              </CardHeader>
              <CardContent className="space-y-3">
                <p className='text-sm font-semibold'>Selecciones:</p>
                <ul className='space-y-2'>
                    {bet.bets.map((selection, index) => (
                        <li key={index} className="flex justify-between items-center text-sm p-2 bg-secondary rounded-md">
                            <div>
                                <p className='font-medium'>{selection.selection}</p>
                                <p className='text-xs text-muted-foreground'>{selection.event}</p>
                            </div>
                             <span className="font-bold text-primary">{selection.odd.toFixed(2)}</span>
                        </li>
                    ))}
                </ul>
              </CardContent>
              <CardFooter className="flex-col items-start gap-2 border-t pt-4">
                <div className="flex justify-between w-full text-sm">
                    <span>Monto Apostado:</span>
                    <span className="font-semibold">${bet.stake.toFixed(2)}</span>
                </div>
                <div className="flex justify-between w-full text-sm">
                    <span>Cuotas Totales:</span>
                    <span className="font-semibold">{bet.totalOdds.toFixed(2)}</span>
                </div>
                <Separator className='my-1' />
                <div className="flex justify-between w-full font-bold text-base">
                    <span>Ganancia Potencial:</span>
                    <span>${bet.potentialWinnings.toFixed(2)}</span>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Desktop View */}
        <Card className='hidden md:block'>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className='w-[150px]'>Fecha</TableHead>
                        <TableHead>Selecciones</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                        <TableHead className="text-right">Cuotas Totales</TableHead>
                        <TableHead className="text-right">Ganancia Pot.</TableHead>
                        <TableHead className="text-center">Estado</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {bets.map((bet) => (
                        <TableRow key={bet.id} className="odd:bg-secondary/40">
                            <TableCell className="text-xs">{new Date(bet.createdAt.seconds * 1000).toLocaleString()}</TableCell>
                            <TableCell>
                                <ul className='space-y-1.5'>
                                    {bet.bets.map((selection, index) => (
                                        <li key={index} className="flex justify-between items-center text-sm">
                                            <div>
                                                <p className='font-medium'>{selection.selection}</p>
                                                <p className='text-xs text-muted-foreground'>{selection.event}</p>
                                            </div>
                                            <span className="font-bold text-primary ml-4">{selection.odd.toFixed(2)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </TableCell>
                            <TableCell className="text-right font-medium">${bet.stake.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-medium">{bet.totalOdds.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-bold text-primary">${bet.potentialWinnings.toFixed(2)}</TableCell>
                            <TableCell className="text-center"><BetStatusBadge status={bet.status} /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card>
        </>
      )}
    </div>
  );
}
