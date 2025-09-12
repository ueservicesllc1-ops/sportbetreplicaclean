
'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Rocket } from 'lucide-react';

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
      // Countdown before the round starts
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
      // Set a random crash point for the round
      crashPoint.current = Math.random() * 10 + 1; // Crashes between 1.00 and 11.00
      if(Math.random() > 0.8) { // 20% chance of a big multiplier
          crashPoint.current = Math.random() * 40 + 10;
      }

      setMultiplier(1.00);
      setWinnings(0);

      // Multiplier increase logic
      intervalRef.current = setInterval(() => {
        setMultiplier((prevMultiplier) => {
          if (prevMultiplier >= crashPoint.current) {
            setGameState('crashed');
            return prevMultiplier;
          }
          // The multiplier increases faster over time
          const increment = 0.01 + (prevMultiplier / 500);
          return prevMultiplier + increment;
        });
      }, 100);
    } else if (gameState === 'crashed' || gameState === 'cashout') {
        if(intervalRef.current) clearInterval(intervalRef.current);
        
        const finalMultiplier = gameState === 'crashed' ? crashPoint.current : multiplier;
        history.current = [finalMultiplier, ...history.current.slice(0, 11)];

        // Reset for the next round after a delay
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
    // For this simulation, we assume the bet is placed when the game starts
    // In this simulation, the user just needs to have a bet amount set.
  };

  const handleCashOut = () => {
      if(gameState !== 'playing') return;
      setWinnings(parseFloat(betAmount) * multiplier);
      setGameState('cashout');
  }

  const getMultiplierColor = () => {
      if(gameState === 'crashed') return 'text-destructive';
      if(gameState === 'cashout') return 'text-blue-400';
      return 'text-green-400';
  }

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
                  <p className="text-6xl font-bold">{countdown.toFixed(1)}s</p>
                </div>
              )}
              {(gameState === 'playing' || gameState === 'crashed' || gameState === 'cashout') && (
                <div className="relative text-center">
                  <p className={`text-7xl font-bold transition-colors ${getMultiplierColor()}`}>
                    {multiplier.toFixed(2)}x
                  </p>
                   {gameState === 'crashed' && <p className="mt-2 text-2xl font-bold text-destructive">¡CRASH!</p>}
                   {gameState === 'cashout' && <p className="mt-2 text-2xl font-bold text-blue-400">GANANCIA: ${winnings.toFixed(2)}</p>}
                </div>
              )}
               {/* Placeholder for the graph line */}
               <div className="absolute bottom-0 left-0 h-1/2 w-full p-4">
                <svg width="100%" height="100%" viewBox="0 0 400 200" preserveAspectRatio="none">
                    <path d="M 0 200 Q 150 200 200 100 T 400 0" stroke="hsl(var(--primary))" fill="none" strokeWidth="4" 
                     style={{
                        strokeDasharray: 500,
                        strokeDashoffset: gameState === 'playing' || gameState === 'crashed' || gameState === 'cashout' ? 500 - (500 * Math.min(multiplier / (crashPoint.current || multiplier), 1)) : 500,
                        transition: 'stroke-dashoffset 0.1s linear'
                     }}
                    />
                </svg>
               </div>
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
