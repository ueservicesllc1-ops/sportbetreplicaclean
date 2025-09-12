
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Rocket } from 'lucide-react';

// This is a static UI representation. Game logic is not implemented.
export default function CasinoPage() {
  const [betAmount, setBetAmount] = useState<string>('1.00');
  const [multiplier, setMultiplier] = useState<string>('1.00x');
  const [gameState, setGameState] = useState<'betting' | 'playing' | 'crashed'>('betting');

  const history = [2.34, 1.56, 1.02, 8.91, 3.45, 1.19, 4.01, 1.88, 2.76, 10.21, 1.00, 3.12];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Rocket className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Crash Game</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Game Area */}
        <div className="lg:col-span-2">
          <Card className="relative aspect-[2/1] overflow-hidden">
            <CardContent className="flex h-full flex-col items-center justify-center bg-secondary/30 p-6">
              {gameState === 'betting' && (
                <div className="text-center">
                  <p className="text-lg text-muted-foreground">La próxima ronda comienza en...</p>
                  <p className="text-6xl font-bold">5.4s</p>
                </div>
              )}
              {(gameState === 'playing' || gameState === 'crashed') && (
                <div className="relative text-center">
                  <p className={`text-7xl font-bold transition-colors ${gameState === 'crashed' ? 'text-destructive' : 'text-green-400'}`}>
                    {multiplier}
                  </p>
                  {gameState === 'crashed' && <p className="mt-2 text-2xl font-bold text-destructive">¡CRASH!</p>}
                </div>
              )}
               {/* Placeholder for the graph line */}
               <div className="absolute bottom-0 left-0 h-1/2 w-full p-4">
                <svg width="100%" height="100%" viewBox="0 0 400 200" preserveAspectRatio="none">
                    <path d="M 0 200 Q 150 200 200 100 T 400 0" stroke="hsl(var(--primary))" fill="none" strokeWidth="4" />
                </svg>
               </div>
            </CardContent>
          </Card>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
             {history.map((h, i) => (
                <div key={i} className={`flex h-8 w-16 flex-shrink-0 items-center justify-center rounded-md text-sm font-semibold ${h < 2 ? 'bg-muted text-muted-foreground' : h < 10 ? 'bg-green-600/20 text-green-400' : 'bg-primary/20 text-primary'}`}>
                    {h.toFixed(2)}x
                </div>
             ))}
          </div>
        </div>

        {/* Control Panel */}
        <div>
          <Card>
            <CardContent className="p-4">
              <Tabs defaultValue="manual">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="manual">Manual</TabsTrigger>
                  <TabsTrigger value="auto" disabled>Auto</TabsTrigger>
                </TabsList>
                <TabsContent value="manual" className="mt-4 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Monto de Apuesta</label>
                    <div className="mt-1 flex gap-2">
                      <Input 
                        type="number" 
                        value={betAmount} 
                        onChange={(e) => setBetAmount(e.target.value)}
                        placeholder="1.00"
                        className='text-base font-bold'
                        disabled={gameState === 'playing'}
                      />
                      <Button variant="outline" onClick={() => setBetAmount((p) => (parseFloat(p) / 2).toFixed(2))} disabled={gameState === 'playing'}>½</Button>
                      <Button variant="outline" onClick={() => setBetAmount((p) => (parseFloat(p) * 2).toFixed(2))} disabled={gameState === 'playing'}>2x</Button>
                    </div>
                  </div>

                   {gameState === 'betting' ? (
                     <Button 
                        size="lg" 
                        className="w-full h-12 bg-green-600 text-white hover:bg-green-700 text-lg"
                        onClick={() => setGameState('playing')}
                    >
                       Realizar Apuesta
                    </Button>
                   ) : (
                    <Button 
                        size="lg" 
                        className="w-full h-12 bg-yellow-500 text-black hover:bg-yellow-600 text-lg"
                        onClick={() => setGameState('crashed')}
                        disabled={gameState === 'crashed'}
                    >
                      Retirar ${ (parseFloat(betAmount) * 1.5).toFixed(2) }
                    </Button>
                   )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
       <Card className="mt-8">
        <CardHeader>
          <CardTitle>Jugadores en la Ronda</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Aquí se mostrarán los jugadores y sus apuestas en tiempo real.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
