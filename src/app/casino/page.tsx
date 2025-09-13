

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
  const [rocketPosition, setRocketPosition] = useState({ x: 0, y: 200 });
  const [rocketRotation, setRocketRotation] = useState(0);

  const history = useRef([2.34, 1.56, 1.02, 8.91, 3.45, 1.19, 4.01, 1.88, 2.76, 10.21, 1.00, 3.12]);
  const crashPoint = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(0);
  
  // Adjusted path points to make the rocket fly off-screen
  const p0 = { x: 0, y: 200 };
  const p1 = { x: 150, y: 180 };
  const p2 = { x: 300, y: 50 };
  const p3 = { x: 450, y: -50 }; // End point is now outside the viewbox

  const getPointOnCubicBezier = (p0: {x:number, y:number}, p1: {x:number, y:number}, p2: {x:number, y:number}, p3: {x:number, y:number}, t: number) => {
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    const uuu = uu * u;
    const ttt = tt * t;
    
    const x = uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x;
    const y = uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y;
    
    return { x, y };
  };

  const getTangentOnCubicBezier = (p0: {x:number, y:number}, p1: {x:number, y:number}, p2: {x:number, y:number}, p3: {x:number, y:number}, t: number) => {
    const u = 1 - t;
    const dx = 3 * u * u * (p1.x - p0.x) + 6 * u * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x);
    const dy = 3 * u * u * (p1.y - p0.y) + 6 * u * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y);
    return Math.atan2(dy, dx) * (180 / Math.PI);
  };
  
  useEffect(() => {
    if (pathRef.current) {
        setPathLength(pathRef.current.getTotalLength());
    }
  }, []);

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
      // Use a more realistic crash point distribution
      const r = Math.random();
      if (r < 0.5) { // 50% chance of crashing between 1.00x and 1.99x
        crashPoint.current = 1 + Math.random();
      } else if (r < 0.9) { // 40% chance of crashing between 2.00x and 9.99x
        crashPoint.current = 2 + Math.random() * 8;
      } else { // 10% chance of crashing over 10.00x
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
          const increment = 0.01 + (prevMultiplier / 500);
          return prevMultiplier + increment;
        });
      }, 50); // Faster updates for smoother animation
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


  useEffect(() => {
    // This function maps the multiplier to the animation progress `t` (0 to 1)
    // We can use a non-linear mapping (like log) to make the rocket move faster at higher multipliers
    const maxMultiplierViewable = 15; // The multiplier at which the rocket leaves the screen
    const progress = Math.min(Math.log(multiplier) / Math.log(maxMultiplierViewable), 1);
    
    let point, angle;

    if (gameState === 'betting') {
        point = p0;
        angle = getTangentOnCubicBezier(p0, p1, p2, p3, 0);
    } else {
        point = getPointOnCubicBezier(p0, p1, p2, p3, progress);
        angle = getTangentOnCubicBezier(p0, p1, p2, p3, progress);
    }
    
    setRocketPosition(point);
    setRocketRotation(angle);

  }, [multiplier, gameState]);

  // Animation for the trail
  const maxMultiplierForTrail = 15; // Corresponds to the viewable part of the path
  const trailProgress = Math.min(Math.log(multiplier) / Math.log(maxMultiplierForTrail), 1);
  const strokeDashoffset = pathLength * (1 - trailProgress);


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
                  <p className="text-6xl font-bold">{countdown.toFixed(0)}s</p>
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
               {/* Graph Area */}
               <div className="absolute bottom-0 left-0 h-full w-full">
                <svg width="100%" height="100%" viewBox="0 0 400 200" preserveAspectRatio="none">
                    <path
                        ref={pathRef}
                        d={`M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`}
                        stroke="hsl(var(--primary))"
                        fill="none" 
                        strokeWidth="4"
                        strokeDasharray={pathLength}
                        strokeDashoffset={gameState === 'betting' ? pathLength : strokeDashoffset}
                        className={gameState !== 'betting' ? 'transition-all duration-[50ms] linear' : ''}
                    />
                </svg>
                 <Rocket 
                    className="absolute h-10 w-10 text-primary transition-all duration-[50ms] linear"
                    style={{
                        left: `${(rocketPosition.x / 400) * 100}%`,
                        top: `${(rocketPosition.y / 200) * 100}%`,
                        transform: `translate(-50%, -50%) rotate(${rocketRotation}deg)`,
                        willChange: 'left, top, transform',
                    }}
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

    

    

