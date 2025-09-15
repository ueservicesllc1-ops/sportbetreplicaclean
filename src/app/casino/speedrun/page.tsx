

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
import { placeCasinoBet, resolveCasinoBet } from '../actions';
import { getSpeedrunGameAssets } from '@/app/admin/game-assets/actions';
import { Loader2, User, ArrowLeft, Volume2, VolumeX } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';

type GameState = 'betting' | 'waiting' | 'playing' | 'crashed' | 'cashout';

// --- FAKE PLAYER DATA AND TYPES ---
interface Player {
  id: string;
  name: string;
  betAmount: number;
  cashOutMultiplier: number | null; // Multiplier at which they cashed out
  winnings: number | null;
  status: 'playing' | 'cashed-out' | 'crashed';
  isRealPlayer?: boolean;
}

const fakeUsernames = [
  'ElEstratega', 'SuerteLoca', 'ReyDelCashout', 'ApuestaSegura', 'Midas', 
  'ElProfeta', 'NoRiskNoFun', 'TsunamiDeDolar', 'LaReinaDelVerde', 'CazaCuotas',
  'ElAnalista', 'FiebreDeJuego', 'GoldenBet', 'ElMago', 'Invicto'
];

// --- COMPONENTS ---

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
  const [autoCashOutAmount, setAutoCashOutAmount] = useState<string>('1.50');
  const [isAutoCashOutEnabled, setIsAutoCashOutEnabled] = useState<boolean>(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [assets, setAssets] = useState<Record<string, string>>({});


  const { user } = useAuth();
  const { toast } = useToast();

  const history = useRef([2.34, 1.56, 1.02, 8.91, 3.45, 1.19, 4.01, 1.88, 2.76, 10.21, 1.00, 3.12]);
  const crashPoint = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const engineSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    async function fetchAssets() {
        const gameAssets = await getSpeedrunGameAssets();
        setAssets(gameAssets);
    }
    fetchAssets();
  }, []);

  // Effect for audio handling
   useEffect(() => {
    // Create or destroy audio element based on asset URL
    if (assets.engineSound && !engineSoundRef.current) {
        engineSoundRef.current = new Audio(assets.engineSound);
        engineSoundRef.current.loop = true;
    }

    if (gameState === 'playing' && engineSoundRef.current) {
      engineSoundRef.current.muted = isMuted;
      engineSoundRef.current.play().catch(e => console.error("Audio play failed:", e));
    } else if (engineSoundRef.current) {
      engineSoundRef.current.pause();
      engineSoundRef.current.currentTime = 0;
    }

    // Cleanup on unmount
    return () => {
      engineSoundRef.current?.pause();
    };
  }, [gameState, isMuted, assets.engineSound]);


  const handleCashOut = async () => {
      if(gameState !== 'playing' || !hasPlacedBet || !user) return;
      
      const currentWinnings = parseFloat(betAmount) * multiplier;
      setWinnings(currentWinnings);
      setIsSubmitting(true);

      try {
          await resolveCasinoBet(user.uid, currentWinnings);
          toast({
              title: '¡Ganaste!',
              description: `Has retirado $${currentWinnings.toFixed(2)}.`,
              className: 'bg-green-600 border-green-600 text-white'
          });
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Error al retirar', description: error.message });
      } finally {
          setIsSubmitting(false);
          setGameState('cashout');
      }
  }


  // Game loop management
  useEffect(() => {
    if (gameState === 'betting' || gameState === 'waiting') {
        if(gameState === 'betting') {
            setMultiplier(1.00);
            setHasPlacedBet(false);
            setWinnings(0);

            const numPlayers = Math.floor(Math.random() * 8) + 7;
            const newPlayers: Player[] = [];
            const usedNames = new Set();
            for (let i = 0; i < numPlayers; i++) {
                let name = fakeUsernames[Math.floor(Math.random() * fakeUsernames.length)];
                while(usedNames.has(name)) {
                    name = fakeUsernames[Math.floor(Math.random() * fakeUsernames.length)];
                }
                usedNames.add(name);

                const r = Math.random();
                let cashOutTarget: number | null;
                 if (r < 0.4) cashOutTarget = 1.01 + Math.random() * 0.5;
                 else if (r < 0.7) cashOutTarget = 1.5 + Math.random() * 2.5;
                 else if (r < 0.9) cashOutTarget = 4 + Math.random() * 6;
                 else cashOutTarget = null;

                newPlayers.push({
                    id: `fake_${i}`,
                    name,
                    betAmount: Math.floor(Math.random() * 50) + 1,
                    status: 'playing',
                    cashOutMultiplier: cashOutTarget,
                    winnings: null,
                });
            }
            if (hasPlacedBet && user) {
                newPlayers.unshift({
                    id: user.uid,
                    name: user.email?.split('@')[0] || 'Tú',
                    betAmount: parseFloat(betAmount),
                    status: 'playing',
                    cashOutMultiplier: isAutoCashOutEnabled ? parseFloat(autoCashOutAmount) : null,
                    winnings: null,
                    isRealPlayer: true
                });
            }
            setPlayers(newPlayers);
        }

        intervalRef.current = setInterval(() => {
            setCountdown((prev) => {
            if (prev <= 1) {
                clearInterval(intervalRef.current!);
                
                const r = Math.random();
                if (r < 0.7) { 
                crashPoint.current = 1.01 + Math.random();
                } else if (r < 0.95) { 
                crashPoint.current = 2 + Math.random() * 8;
                } else { 
                crashPoint.current = 10 + Math.random() * 190;
                }

                setGameState('playing');
                return 0;
            }
            return prev - 1;
            });
        }, 1000);
    } else if (gameState === 'playing') {
      setMultiplier(1.00);
      
      const gameInterval = setInterval(() => {
        setMultiplier((prevMultiplier) => {
          if (prevMultiplier >= crashPoint.current) {
            setGameState('crashed');
            return prevMultiplier;
          }
          const increment = 0.01 + (prevMultiplier / 200);
          return prevMultiplier + increment;
        });
      }, 50);
      intervalRef.current = gameInterval;
    } else if (gameState === 'crashed' || gameState === 'cashout') {
        if(intervalRef.current) clearInterval(intervalRef.current);
        
        const finalMultiplier = gameState === 'crashed' ? crashPoint.current : multiplier;
        history.current = [parseFloat(finalMultiplier.toFixed(2)), ...history.current.slice(0, 11)];

        if (gameState === 'crashed') {
            setPlayers(prevPlayers => prevPlayers.map(p => 
                p.status === 'playing' ? {...p, status: 'crashed'} : p
            ));
        }

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


  // Player status update logic
  useEffect(() => {
    if (gameState === 'playing') {
        setPlayers(prevPlayers => 
            prevPlayers.map(p => {
                if(p.status === 'playing' && p.cashOutMultiplier && multiplier >= p.cashOutMultiplier) {
                     return {
                        ...p,
                        status: 'cashed-out',
                        winnings: p.betAmount * p.cashOutMultiplier,
                    };
                }
                return p;
            })
        );
    }
    if (gameState === 'cashout') {
        setPlayers(prevPlayers =>
            prevPlayers.map(p => p.isRealPlayer ? {
                ...p,
                status: 'cashed-out',
                cashOutMultiplier: multiplier,
                winnings: winnings
            } : p)
        );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [multiplier, gameState]);


  // Auto-cashout logic
  useEffect(() => {
    if (
        gameState === 'playing' &&
        hasPlacedBet &&
        isAutoCashOutEnabled &&
        !isSubmitting
    ) {
        const targetMultiplier = parseFloat(autoCashOutAmount);
        if (!isNaN(targetMultiplier) && multiplier >= targetMultiplier) {
            handleCashOut();
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [multiplier, gameState, hasPlacedBet, isAutoCashOutEnabled, autoCashOutAmount, isSubmitting]);


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
        await placeCasinoBet(user.uid, amount);
        toast({ title: 'Apuesta Realizada', description: `Has apostado $${amount.toFixed(2)}.` });
        setHasPlacedBet(true);
        setGameState('waiting');
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error al apostar', description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  };


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
                disabled={isSubmitting || hasPlacedBet}
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
       <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="m10 10.5 4 4"></path><path d="m14 10.5-4 4"></path></svg>
                <h1 className="text-3xl font-bold tracking-tight">Speedrun</h1>
                 {assets.engineSound && (
                    <Button variant="outline" size="icon" onClick={() => setIsMuted(!isMuted)}>
                        {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                        <span className="sr-only">Silenciar</span>
                    </Button>
                )}
            </div>
            <Button asChild size="lg">
                <Link href="/casino">
                    <ArrowLeft className="mr-2 h-5 w-5" />
                    Volver a Juegos
                </Link>
            </Button>
       </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Game Area */}
        <div className="relative lg:col-span-2">
            <Card className="relative aspect-[16/9] overflow-hidden">
                 <Image
                    src="https://iili.io/KT1Ttt4.jpg"
                    alt="F1 Cockpit"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
                  <div className='space-y-2'>
                    <Label className="text-sm font-medium">Monto de Apuesta</Label>
                    <div className="grid grid-cols-5 gap-2">
                        <Button size="sm" variant="outline" onClick={() => setBetAmount('1.00')} disabled={hasPlacedBet}>$1</Button>
                        <Button size="sm" variant="outline" onClick={() => setBetAmount('2.00')} disabled={hasPlacedBet}>$2</Button>
                        <Button size="sm" variant="outline" onClick={() => setBetAmount('5.00')} disabled={hasPlacedBet}>$5</Button>
                        <Button size="sm" variant="outline" onClick={() => setBetAmount('10.00')} disabled={hasPlacedBet}>$10</Button>
                        <Button size="sm" variant="outline" onClick={() => setBetAmount('20.00')} disabled={hasPlacedBet}>$20</Button>
                    </div>
                    <div className="flex gap-2">
                      <Input 
                        type="number" 
                        value={betAmount} 
                        onChange={(e) => setBetAmount(e.target.value)}
                        placeholder="1.00"
                        className='text-base font-bold'
                        disabled={hasPlacedBet}
                      />
                      <Button variant="outline" onClick={() => setBetAmount((p) => (parseFloat(p) / 2).toFixed(2))} disabled={hasPlacedBet}>½</Button>
                      <Button variant="outline" onClick={() => setBetAmount((p) => (parseFloat(p) * 2).toFixed(2))} disabled={hasPlacedBet}>2x</Button>
                    </div>
                  </div>
                  <div className="space-y-3">
                     <Label className="text-sm font-medium">Auto Retiro</Label>
                     <div className="flex items-center gap-2">
                        <div className="relative flex-grow">
                            <Input
                                type="number"
                                value={autoCashOutAmount}
                                onChange={(e) => setAutoCashOutAmount(e.target.value)}
                                placeholder="1.50"
                                className="h-9 pr-6"
                                disabled={hasPlacedBet}
                            />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">x</span>
                        </div>
                        <div className="flex items-center space-x-2 rounded-md border p-2 pr-3 h-9">
                            <Switch 
                                id="auto-cashout-switch" 
                                checked={isAutoCashOutEnabled}
                                onCheckedChange={setIsAutoCashOutEnabled}
                                disabled={hasPlacedBet}
                            />
                            <Label htmlFor="auto-cashout-switch" className='text-xs cursor-pointer'>Activar</Label>
                        </div>
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
            <ScrollArea className="h-96">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Jugador</TableHead>
                            <TableHead className="text-right">Apuesta</TableHead>
                            <TableHead className="text-right">Multiplicador</TableHead>
                            <TableHead className="text-right">Ganancia</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {players.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    Esperando jugadores para la próxima ronda...
                                </TableCell>
                            </TableRow>
                        )}
                        {players.map(p => (
                            <TableRow key={p.id} className={cn(
                                p.isRealPlayer ? 'bg-primary/20' : '',
                                p.status === 'cashed-out' ? 'text-blue-400' : p.status === 'crashed' ? 'text-red-500/80' : ''
                            )}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        <span>{p.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right font-mono">${p.betAmount.toFixed(2)}</TableCell>
                                <TableCell className={cn("text-right font-mono", p.status === 'cashed-out' ? 'font-bold' : '')}>
                                    {p.status === 'cashed-out' && p.cashOutMultiplier ? `${p.cashOutMultiplier.toFixed(2)}x` : '-'}
                                </TableCell>
                                <TableCell className={cn("text-right font-mono", p.status === 'cashed-out' ? 'font-bold' : '')}>
                                    {p.status === 'cashed-out' && p.winnings ? `+$${p.winnings.toFixed(2)}` : p.status === 'crashed' ? '-$'+p.betAmount.toFixed(2) : '...'}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
