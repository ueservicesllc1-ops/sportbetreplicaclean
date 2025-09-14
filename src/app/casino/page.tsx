
'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardTitle, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { placeCasinoBet, resolveCasinoBet } from './actions';
import { Loader2 } from 'lucide-react';

type GameState = 'betting' | 'waiting' | 'playing' | 'crashed' | 'cashout';

const RevolutionMeter = ({ multiplier, gameState }: { multiplier: number, gameState: GameState }) => {
    const totalBars = 20;
    const [_, setTick] = useState(0);

    // Re-render on animation frame to create the vibration effect
    useEffect(() => {
        let animationFrameId: number;
        if (gameState === 'playing') {
            const animate = () => {
                setTick(prev => prev + 1);
                animationFrameId = requestAnimationFrame(animate);
            };
            animationFrameId = requestAnimationFrame(animate);
        }
        return () => cancelAnimationFrame(animationFrameId);
    }, [gameState]);
  
    const getBarColor = (index: number) => {
      const percentage = (index + 1) / totalBars;
      if (percentage <= 0.3) return 'bg-blue-500'; // Blue
      if (percentage <= 0.6) return 'bg-green-500'; // Green
      if (percentage <= 0.8) return 'bg-yellow-400'; // Yellow
      return 'bg-red-500'; // Red
    };

    const baseActiveBars = Math.min(
        totalBars,
        Math.floor(Math.log2(Math.max(1, multiplier)) * (totalBars / 3.5)) 
    );

    let activeBars = baseActiveBars;
    // Fluctuation logic for suspense
    const isHighRisk = baseActiveBars > totalBars * 0.7; // Start fluctuating in yellow zone
    if (gameState === 'playing' && isHighRisk) {
        // Create a a fast but small oscillation
        const fluctuation = Math.floor(Math.sin(Date.now() / 50) * 2); // oscillates between -1, 0, 1
        activeBars = baseActiveBars + fluctuation;
    }
    
    if (gameState === 'crashed') {
        activeBars = totalBars;
    }
  
    return (
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col-reverse gap-1.5 p-2 rounded-lg bg-black/30">
        {Array.from({ length: totalBars }).map((_, i) => {
            const barColor = gameState === 'crashed' ? 'bg-red-500' : getBarColor(i);
            const isLit = i < activeBars;
            const colorName = barColor.replace('bg-','').replace('-500','').replace('-400','');
            
            return (
                <div
                    key={i}
                    className={cn(
                    "h-3 w-5 md:h-4 md:w-6 rounded-sm transition-all duration-100",
                    isLit ? barColor : 'bg-secondary/50'
                    )}
                    style={{
                        boxShadow: isLit ? `0 0 5px ${colorName}` : 'none'
                    }}
                />
            );
        })}
      </div>
    );
  };


export default function CasinoPage() {
  const [betAmount, setBetAmount] = useState<string>('1.00');
  const [multiplier, setMultiplier] = useState<number>(1.00);
  const [gameState, setGameState] = useState<GameState>('betting');
  const [countdown, setCountdown] = useState<number>(5);
  const [winnings, setWinnings] = useState<number>(0);
  const [hasPlacedBet, setHasPlacedBet] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();

  const history = useRef([2.34, 1.56, 1.02, 8.91, 3.45, 1.19, 4.01, 1.88, 2.76, 10.21, 1.00, 3.12]);
  const crashPoint = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Game loop management
  useEffect(() => {
    if (gameState === 'betting') {
        setMultiplier(1.00);
        setHasPlacedBet(false);
        setWinnings(0);

      intervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            
            // Determine crash point for the upcoming round
            const r = Math.random();
            if (r < 0.5) { 
              crashPoint.current = 1 + Math.random() * 2;
            } else if (r < 0.9) {
              crashPoint.current = 3 + Math.random() * 7;
            } else { 
              crashPoint.current = 10 + Math.random() * 40;
            }

            setGameState('playing');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (gameState === 'playing') {
      setMultiplier(1.00);

      intervalRef.current = setInterval(() => {
        setMultiplier((prevMultiplier) => {
          // Use a function to get the latest hasPlacedBet state
          if (hasPlacedBet && prevMultiplier >= crashPoint.current) {
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
        }, 3000);
    }
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  useEffect(() => {
    // This effect ensures the game loop uses the latest state for hasPlacedBet
    if (gameState === 'playing' && hasPlacedBet) {
      // The logic inside the `setInterval` in the main `useEffect` will now see the updated `hasPlacedBet`.
    }
  }, [hasPlacedBet, gameState]);


  const handlePlaceBet = async () => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'Debes iniciar sesión para apostar.' });
        return;
    }
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) {
        toast({ variant: 'destructive', title: 'Error', description: 'Por favor, introduce un monto de apuesta válido.' });
        return;
    }

    setIsSubmitting(true);
    try {
        await placeCasinoBet(amount);
        toast({ title: 'Apuesta Realizada', description: `Has apostado $${amount.toFixed(2)}.` });
        setHasPlacedBet(true);
        setGameState('waiting');
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error al apostar', description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleCashOut = async () => {
      if(gameState !== 'playing' || !hasPlacedBet) return;
      
      const currentWinnings = parseFloat(betAmount) * multiplier;
      setWinnings(currentWinnings);
      setIsSubmitting(true);

      try {
          await resolveCasinoBet(currentWinnings);
          toast({
              title: '¡Ganaste!',
              description: `Has retirado $${currentWinnings.toFixed(2)}.`,
              className: 'bg-green-600 border-green-600 text-white'
          });
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Error al retirar', description: error.message });
          // Even if crediting fails, we cash out locally to show the UI state.
          // A more robust system would handle this reconciliation.
      } finally {
          setIsSubmitting(false);
          setGameState('cashout');
      }
  }

  const getMultiplierColor = () => {
      if(gameState === 'crashed') return 'text-destructive';
      if(gameState === 'cashout') return 'text-blue-400';
      if (multiplier < 2) return 'text-white';
      if (multiplier < 10) return 'text-green-400';
      return 'text-primary';
  }
  
  const renderButton = () => {
    if (gameState === 'playing') {
        if (!hasPlacedBet) return null; // Don't show cashout if no bet was placed
        return (
            <Button 
                size="lg" 
                className="w-full h-12 bg-yellow-500 text-black hover:bg-yellow-600 text-lg"
                onClick={handleCashOut}
                disabled={isSubmitting}
            >
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Retirar ${ (parseFloat(betAmount) * multiplier).toFixed(2) }
            </Button>
        );
    }

    if (gameState === 'waiting') {
        return (
            <Button size="lg" className="w-full h-12 text-lg" disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Esperando la próxima ronda...
            </Button>
        );
    }
    
    if (gameState === 'betting') {
         return (
            <Button 
                size="lg" 
                className="w-full h-12 bg-green-600 text-white hover:bg-green-700 text-lg"
                onClick={handlePlaceBet}
                disabled={isSubmitting}
            >
               {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
               Apostar para la próxima ronda
            </Button>
        );
    }

    // For 'crashed' or 'cashout' states
    return (
        <Button size="lg" className="w-full h-12 text-lg" disabled>
            Esperando la próxima ronda...
        </Button>
    );
  }


  return (
    <div className="space-y-6">
       <div className="flex items-center gap-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="m10 10.5 4 4"></path><path d="m14 10.5-4 4"></path></svg>
        <h1 className="text-3xl font-bold tracking-tight">Speedrun</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Game Area */}
        <div className="relative lg:col-span-2">
            <Card className="relative aspect-[16/9] overflow-hidden">
                 <Image
                    src="https://iili.io/KT1Ttt4.jpg"
                    alt="F1 Cockpit"
                    fill
                    className={cn(
                        'object-cover transition-transform duration-500 ease-in-out',
                        gameState !== 'betting' && gameState !== 'waiting' ? 'scale-150' : 'scale-100'
                    )}
                    priority
                />
                 {gameState === 'crashed' && (
                  <div className="absolute inset-0 z-10 animate-pulse bg-red-600/70" />
                )}
                <div className="absolute inset-0 z-20 flex h-full flex-col items-center justify-center p-4">
                {(gameState === 'betting' || gameState === 'waiting') && (
                    <div className="text-center" style={{ transform: 'translateY(-20%)' }}>
                    <p className="font-headline text-3xl font-semibold text-yellow-400 drop-shadow-lg">La próxima carrera comienza en...</p>
                    <p className="font-headline text-9xl font-bold text-yellow-400 drop-shadow-lg">{countdown.toFixed(0)}s</p>
                    </div>
                )}
                {(gameState === 'playing' || gameState === 'crashed' || gameState === 'cashout') && (
                    <>
                    <div className="absolute text-center" style={{ top: '48%', left: '50.5%', transform: 'translate(-50%, -50%)' }}>
                        <p className={cn(
                        "text-4xl md:text-5xl font-bold transition-colors font-headline drop-shadow-2xl", 
                        getMultiplierColor()
                        )}>
                            {multiplier.toFixed(2)}x
                        </p>
                        {gameState === 'crashed' && <p className="mt-2 animate-pulse text-5xl font-bold font-headline text-white drop-shadow-lg">Motor Fundido</p>}
                        {gameState === 'cashout' && <p className="mt-2 text-lg font-bold text-blue-400 drop-shadow-lg">GANANCIA: ${winnings.toFixed(2)}</p>}
                    </div>
                    <RevolutionMeter multiplier={multiplier} gameState={gameState} />
                    </>
                )}
                </div>
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
                        disabled={gameState !== 'betting'}
                      />
                      <Button variant="outline" onClick={() => setBetAmount((p) => (parseFloat(p) / 2).toFixed(2))} disabled={gameState !== 'betting'}>½</Button>
                      <Button variant="outline" onClick={() => setBetAmount((p) => (parseFloat(p) * 2).toFixed(2))} disabled={gameState !== 'betting'}>2x</Button>
                    </div>
                  </div>
                  {renderButton()}
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

    