
'use client';

import { useState } from 'react';
import { useBetSlip } from '@/contexts/bet-slip-context';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Separator } from './ui/separator';
import { Loader2, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { addDoc, collection, doc, runTransaction, serverTimestamp } from 'firebase/firestore';

export function BetSlip() {
  const { bets, removeBet, clearBets } = useBetSlip();
  const { user } = useAuth();
  const { toast } = useToast();
  const [stake, setStake] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);

  const totalOdds = bets.reduce((acc, bet) => acc * bet.odd, 1);
  const potentialWinnings = stake !== '' && stake > 0 ? (totalOdds * stake).toFixed(2) : '0.00';

  const handlePlaceBet = async () => {
    if (!user) {
        toast({
            variant: 'destructive',
            title: 'Debes iniciar sesión',
            description: 'Por favor, accede a tu cuenta para realizar una apuesta.',
        });
        return;
    }
    if (!stake || stake <= 0) {
        toast({
            variant: 'destructive',
            title: 'Monto inválido',
            description: 'Por favor, introduce un monto para apostar.',
        });
        return;
    }

    setLoading(true);

    try {
        const userWalletRef = doc(db, 'users', user.uid);

        await runTransaction(db, async (transaction) => {
            const userWalletDoc = await transaction.get(userWalletRef);
            if (!userWalletDoc.exists()) {
                throw new Error("No se encontró tu billetera.");
            }

            const currentBalance = userWalletDoc.data().balance;
            if (currentBalance < stake) {
                throw new Error("Saldo insuficiente para realizar esta apuesta.");
            }

            const newBalance = currentBalance - stake;
            transaction.update(userWalletRef, { balance: newBalance });

            const newBetRef = doc(collection(db, 'user_bets'));
            transaction.set(newBetRef, {
                userId: user.uid,
                bets: bets.map(b => ({ event: b.event, selection: b.selection, odd: b.odd, market: b.market })),
                stake: stake,
                totalOdds: totalOdds,
                potentialWinnings: parseFloat(potentialWinnings),
                status: 'pending',
                createdAt: serverTimestamp(),
            });
        });
        
        toast({
            title: '¡Apuesta realizada!',
            description: 'Tu apuesta ha sido guardada y el monto ha sido descontado de tu saldo.',
        });

        clearBets();
        setStake('');

    } catch (error: any) {
        console.error("Error placing bet: ", error);
        toast({
            variant: 'destructive',
            title: 'Error al apostar',
            description: error.message || 'No se pudo guardar tu apuesta. Inténtalo de nuevo.',
        });
    } finally {
        setLoading(false);
    }
  }


  return (
    <div className="flex h-full flex-col">
      <CardHeader className="p-4">
        <CardTitle>Boleto de Apuesta</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto p-4">
        {bets.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            Seleccione una apuesta para empezar.
          </p>
        ) : (
          <div className="space-y-4">
            {bets.map((bet) => (
              <div key={bet.id} className="rounded-md border p-3 text-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{bet.selection}</p>
                    <p className="text-xs text-muted-foreground">{bet.event}</p>
                  </div>
                  <div className='flex items-center gap-2'>
                    <span className="font-bold text-primary">{bet.odd.toFixed(2)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeBet(bet.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      {bets.length > 0 && (
        <CardFooter className="mt-auto flex-col items-stretch gap-2 border-t p-4">
           <Button variant="outline" size="sm" className="w-full" onClick={clearBets}>Limpiar todo</Button>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total de Cuotas:</span>
              <span className="font-bold">{totalOdds.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className='text-sm'>Monto:</span>
              <Input
                type="number"
                placeholder="0.00"
                value={stake}
                onChange={(e) => setStake(parseFloat(e.target.value) || '')}
                className="h-9"
              />
            </div>
            <Separator />
            <div className="flex justify-between font-bold">
              <span>Ganancia Potencial:</span>
              <span>${potentialWinnings}</span>
            </div>
            <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={handlePlaceBet} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Realizar Apuesta
            </Button>
          </div>
        </CardFooter>
      )}
    </div>
  );
}
