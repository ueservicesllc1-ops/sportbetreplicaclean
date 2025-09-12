'use client';

import { useState } from 'react';
import { useBetSlip } from '@/contexts/bet-slip-context';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Separator } from './ui/separator';
import { Trash2 } from 'lucide-react';

export function BetSlip() {
  const { bets, removeBet, clearBets } = useBetSlip();
  const [stake, setStake] = useState<number | ''>('');

  const totalOdds = bets.reduce((acc, bet) => acc * bet.odd, 1);
  const potentialWinnings = stake !== '' && stake > 0 ? (totalOdds * stake).toFixed(2) : '0.00';

  return (
    <div className="flex h-full flex-col bg-card lg:rounded-lg lg:border">
      <div className="border-b p-2">
        <h2 className="p-2 font-headline text-lg font-semibold tracking-tight">Boleto de Apuesta</h2>
      </div>
      <div className="flex-grow overflow-y-auto p-4">
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
      </div>
      {bets.length > 0 && (
        <div className="mt-auto border-t p-4">
           <Button variant="outline" size="sm" className="w-full mb-4" onClick={clearBets}>Limpiar todo</Button>
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
            <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
              Realizar Apuesta
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
