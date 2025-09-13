

'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardTitle, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import Image from 'next/image';

type GameState = 'betting' | 'playing' | 'crashed' | 'cashout';

// This is a client-side simulation. True multiplayer requires a server.
export default function CasinoPage() {
  const [betAmount, setBetAmount] = useState<string>('1.00');
  const [multiplier, setMultiplier] = useState<number>(1.00);
  const [gameState, setGameState] = useState<GameState>('betting');
  const [countdown, setCountdown] = useState<number>(5);
  const [winnings, setWinnings] = useState<number>(0);

  const history = useRef([2.34, 1.56, 1.02, 8.91, 3.45, 1.19, 4.01, 1.88, 2.76, 10.21, 1.00, 3.12]);
  const crashPoint = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Game loop management
  useEffect(() => {
    if (gameState === 'betting') {
      intervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setGameState('playing');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (gameState === 'playing') {
      const r = Math.random();
      if (r < 0.5) { 
        crashPoint.current = 1 + Math.random();
      } else if (r < 0.9) {
        crashPoint.current = 2 + Math.random() * 8;
      } else { 
        crashPoint.current = 10 + Math.random() * 40;
      }

      setMultiplier(1.00);
      setWinnings(0);

      intervalRef.current = setInterval(() => {
        setMultiplier((prevMultiplier) => {
          if (prevMultiplier >= crashPoint.current) {
            setGameState('crashed');
            return prevMultiplier;
          }
          const increment = 0.01 + (prevMultiplier / 200);
          return prevMultiplier + increment;
        });
      }, 50); 
    } else if (gameState === 'crashed' || gameState === 'cashout') {
        if(intervalRef.current) clearInterval(intervalRef.current);
        
        const finalMultiplier = gameState === 'crashed' ? crashPoint.current : multiplier;
        history.current = [parseFloat(finalMultiplier.toFixed(2)), ...history.current.slice(0, 11)];

        setTimeout(() => {
            setGameState('betting');
            setCountdown(5);
            setMultiplier(1.00);
        }, 3000);
    }
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [gameState]);

  const handlePlaceBet = () => {
    // This is just for UI state change, in a real app this would register the bet
  };

  const handleCashOut = () => {
      if(gameState !== 'playing') return;
      setWinnings(parseFloat(betAmount) * multiplier);
      setGameState('cashout');
  }

  const getMultiplierColor = () => {
      if(gameState === 'crashed') return 'text-destructive';
      if(gameState === 'cashout') return 'text-blue-400';
      if (multiplier < 2) return 'text-white';
      if (multiplier < 10) return 'text-green-400';
      return 'text-primary';
  }


  return (
    <div className="space-y-6">
       <div className="flex items-center gap-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="m10 10.5 4 4"></path><path d="m14 10.5-4 4"></path></svg>
        <h1 className="text-3xl font-bold tracking-tight">Speedrun</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 [transform:translateZ(0)]">
        {/* Game Area */}
        <div className="relative lg:col-span-2">
           <Card 
            className="aspect-[16/9] overflow-hidden"
          >
            <div 
              className='absolute inset-0 h-full w-full bg-cover bg-center transition-transform duration-500 ease-in-out'
              style={{
                backgroundImage: `url('https://iili.io/KT1Ttt4.jpg')`,
                transform: gameState !== 'betting' ? 'scale(1.5)' : 'scale(1)',
              }}
            />
            <CardContent className="absolute inset-0 flex h-full flex-col items-center justify-center p-4">
              {gameState === 'betting' && (
                <div className="text-center text-white">
                  <p className="text-lg text-neutral-300">La próxima carrera comienza en...</p>
                  <p className="text-6xl font-bold drop-shadow-lg">{countdown.toFixed(0)}s</p>
                </div>
              )}
              {(gameState === 'playing' || gameState === 'crashed' || gameState === 'cashout') && (
                 <div className="absolute text-center" style={{ top: '52%', left: '50.5%', transform: 'translate(-50%, -50%)' }}>
                    <p className={cn(
                      "text-4xl md:text-5xl font-bold transition-colors font-mono drop-shadow-2xl", 
                      getMultiplierColor()
                    )}>
                        {multiplier.toFixed(2)}x
                    </p>
                    {gameState === 'crashed' && <p className="mt-2 animate-pulse text-xl font-bold text-destructive drop-shadow-lg">¡CRASH!</p>}
                    {gameState === 'cashout' && <p className="mt-2 text-lg font-bold text-blue-400 drop-shadow-lg">GANANCIA: ${winnings.toFixed(2)}</p>}
                </div>
              )}
            </CardContent>
          </Card>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
             {history.current.map((h, i) => (
                <div key={i} className={`flex h-8 w-16 flex-shrink-0 items-center justify-center rounded-md text-sm font-semibold ${h < 2 ? 'bg-muted text-muted-foreground' : h < 10 ? 'bg-green-600/20 text-green-400' : 'bg-primary/20 text-primary'}`}>
                    {h.toFixed(2)}x
                </div>
             ))}
          </div>
        </div>

        {/* Control Panel */}
        <div className="relative">
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
                        disabled={gameState === 'playing' || gameState === 'crashed'}
                      />
                      <Button variant="outline" onClick={() => setBetAmount((p) => (parseFloat(p) / 2).toFixed(2))} disabled={gameState === 'playing'}>½</Button>
                      <Button variant="outline" onClick={() => setBetAmount((p) => (parseFloat(p) * 2).toFixed(2))} disabled={gameState === 'playing'}>2x</Button>
                    </div>
                  </div>

                   {gameState !== 'playing' ? (
                     <Button 
                        size="lg" 
                        className="w-full h-12 bg-green-600 text-white hover:bg-green-700 text-lg"
                        onClick={handlePlaceBet}
                        disabled={gameState !== 'betting'}
                    >
                       {gameState === 'betting' ? 'Apuesta para la próxima ronda' : 'Esperando la próxima ronda...'}
                    </Button>
                   ) : (
                    <Button 
                        size="lg" 
                        className="w-full h-12 bg-yellow-500 text-black hover:bg-yellow-600 text-lg"
                        onClick={handleCashOut}
                        disabled={gameState !== 'playing'}
                    >
                      Retirar ${ (parseFloat(betAmount) * multiplier).toFixed(2) }
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
            Aquí se mostrarán los jugadores y sus apuestas en tiempo real. (Funcionalidad multijugador no implementada)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
