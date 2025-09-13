
'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gauge, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

type GameState = 'betting' | 'playing' | 'crashed' | 'cashout';

const MAX_ANGLE = 135; // Corresponds to the end of the speedometer arc (from -135 to 135)
function multiplierToAngle(multiplier: number): number {
  if (multiplier <= 1) return -MAX_ANGLE;
  // Use a logarithmic scale to make the needle move fast at the beginning and slow down for higher multipliers
  // This makes high multipliers reachable without spinning the needle multiple times
  const logMultiplier = Math.log10(multiplier);
  // We'll map a log10 value of 0 (1x) to -135 deg and a log10 of 2 (100x) to 135 deg
  const maxLog = 2.5; // Corresponds to ~316x
  const angle = -MAX_ANGLE + (logMultiplier / maxLog) * (2 * MAX_ANGLE);
  
  return Math.min(angle, MAX_ANGLE);
}


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
      if (multiplier < 2) return 'text-foreground';
      if (multiplier < 10) return 'text-green-400';
      return 'text-primary';
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Gauge className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Speedrun</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Game Area */}
        <div className="lg:col-span-2">
          <Card className="relative aspect-[2/1] overflow-hidden">
            <Image 
                src="/images/f1.jpg"
                alt="Formula One track background"
                fill
                className="object-cover blur-sm"
                data-ai-hint="formula one race track"
            />
             <div className="absolute inset-0 bg-black/60" />
            <CardContent className="relative flex h-full flex-col items-center justify-center bg-transparent p-6 transition-all duration-300">
              {gameState === 'betting' && (
                <div className="text-center">
                  <p className="text-lg text-muted-foreground">La próxima carrera comienza en...</p>
                  <p className="text-6xl font-bold">{countdown.toFixed(0)}s</p>
                </div>
              )}
              {(gameState === 'playing' || gameState === 'crashed' || gameState === 'cashout') && (
                 <div className='absolute inset-0 flex flex-col items-center justify-center'>
                    <div className='relative w-full max-w-sm'>
                         <svg viewBox="0 0 200 120" className="w-full">
                            {/* Dial Background */}
                            <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="hsl(var(--border) / 0.5)" strokeWidth="10" strokeLinecap="round" />
                            {/* Dial Foreground/Progress */}
                            <path
                                d="M 20 100 A 80 80 0 0 1 180 100"
                                fill="none"
                                stroke="hsl(var(--primary))"
                                strokeWidth="10"
                                strokeLinecap="round"
                                className="transition-all duration-200"
                                style={{
                                    strokeDasharray: 251.2,
                                    strokeDashoffset: 251.2 * (1 - (multiplierToAngle(multiplier) + MAX_ANGLE) / (2 * MAX_ANGLE))
                                }}
                            />
                            {/* Needle */}
                            <g style={{ transformOrigin: '100px 100px', transform: `rotate(${multiplierToAngle(multiplier)}deg)`, transition: 'transform 50ms linear' }}>
                                <path d="M 100 100 L 100 25" stroke="hsl(var(--foreground))" strokeWidth="2" strokeLinecap="round" />
                                <circle cx="100" cy="100" r="4" fill="hsl(var(--foreground))" />
                            </g>
                             {/* Dial markings */}
                             <text x="15" y="85" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="10">1x</text>
                             <text x="45" y="32" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="10">2x</text>
                             <text x="100" y="15" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="10">5x</text>
                             <text x="155" y="32" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="10">10x</text>
                             <text x="185" y="85" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="10">50x+</text>
                        </svg>
                    </div>
                    <div className="relative z-10 mt-[-40px] text-center">
                        <p className={cn("text-6xl md:text-8xl font-bold transition-colors", getMultiplierColor())}>
                            {multiplier.toFixed(2)}x
                        </p>
                        {gameState === 'crashed' && <p className="mt-2 animate-pulse text-4xl font-bold text-destructive">¡CRASH!</p>}
                        {gameState === 'cashout' && <p className="mt-2 text-2xl font-bold text-blue-400">GANANCIA: ${winnings.toFixed(2)}</p>}
                    </div>
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
