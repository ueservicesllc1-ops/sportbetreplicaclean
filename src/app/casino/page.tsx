
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
          // Faster increment
          const increment = 0.015 + (prevMultiplier / 250);
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
      return 'text-green-400';
  }
  
  // New animation logic
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const [rocketStyle, setRocketStyle] = useState<React.CSSProperties>({});
  const [linePoints, setLinePoints] = useState('0,200');

  useEffect(() => {
    const width = gameAreaRef.current?.clientWidth || 400;
    const height = gameAreaRef.current?.clientHeight || 200;

    // Use a logarithmic-like scale for smoother visual progression
    const progress = Math.log(multiplier) / Math.log(1.05); // Adjust base for speed
    
    // X position moves across the screen
    const x = Math.min(progress * 10, width * 1.5); // Allow going off-screen

    // Y position has a more pronounced curve, slowing down its vertical ascent
    const y = height - (height * (1 - 1 / (0.02 * progress + 1)));
    
    // Angle of the rocket based on the curve's derivative
    const derivative = (height * 0.02) / Math.pow(0.02 * progress + 1, 2);
    const angle = -Math.atan(derivative) * (180 / Math.PI);

    setRocketStyle({
        transform: `translate(${x}px, ${y}px) rotate(${angle}deg)`,
        transition: 'transform 50ms linear',
    });
    
    // Update the line path
    if (gameState === 'playing') {
      // Append new point only if it's different from the last one to avoid performance issues
      setLinePoints(prev => {
        const lastPoint = prev.slice(prev.lastIndexOf(' ')+1);
        const newPoint = `${x.toFixed(1)},${y.toFixed(1)}`;
        if(lastPoint === newPoint) return prev;
        return `${prev} ${newPoint}`;
      });
    } else {
       // Reset line on new game
       setLinePoints(`0,${height}`);
    }

  }, [multiplier, gameState]);
  
  const viewBox = `0 0 ${gameAreaRef.current?.clientWidth || 400} ${gameAreaRef.current?.clientHeight || 200}`;


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
            <CardContent ref={gameAreaRef} className="flex h-full flex-col items-center justify-center bg-secondary/30 p-6">
              {gameState === 'betting' && (
                <div className="text-center">
                  <p className="text-lg text-muted-foreground">La próxima ronda comienza en...</p>
                  <p className="text-6xl font-bold">{countdown.toFixed(0)}s</p>
                </div>
              )}
              {(gameState === 'playing' || gameState === 'crashed' || gameState === 'cashout') && (
                <div className="relative z-20 text-center">
                  <p className={`text-7xl font-bold transition-colors ${getMultiplierColor()}`}>
                    {multiplier.toFixed(2)}x
                  </p>
                   {gameState === 'crashed' && <p className="mt-2 text-2xl font-bold text-destructive">¡CRASH!</p>}
                   {gameState === 'cashout' && <p className="mt-2 text-2xl font-bold text-blue-400">GANANCIA: ${winnings.toFixed(2)}</p>}
                </div>
              )}
               {/* Graph Area */}
               <div className="absolute bottom-0 left-0 h-full w-full">
                <svg width="100%" height="100%" viewBox={viewBox} preserveAspectRatio="none" className="absolute bottom-0 left-0">
                    <polyline
                        points={linePoints}
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="3"
                        strokeLinecap="round"
                    />
                </svg>
                 <Rocket 
                    className="absolute h-8 w-8 text-primary -translate-x-1/2 -translate-y-1/2"
                    style={rocketStyle}
                 />
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

    