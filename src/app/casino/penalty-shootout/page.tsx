
'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardTitle, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { placePenaltyBet, resolvePenaltyBet } from './actions';
import { Loader2, ArrowLeft, Shield, Target } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { SoccerBallIcon } from '@/components/icons/soccer-ball-icon';

type GameState = 'betting' | 'shooting' | 'finished';
type ShotResult = 'goal' | 'save';

const GOAL_MULTIPLIER = 3;
const GOAL_CHANCE = 0.60; // 60% chance to score

const goalZones = [
    { id: 1, name: 'Superior Izquierda' },
    { id: 2, name: 'Superior Derecha' },
    { id: 3, name: 'Centro' },
    { id: 4, name: 'Inferior Izquierda' },
    { id: 5, name: 'Inferior Derecha' },
];

export default function PenaltyShootoutPage() {
    const [betAmount, setBetAmount] = useState('1.00');
    const [selectedZone, setSelectedZone] = useState<number | null>(null);
    const [gameState, setGameState] = useState<GameState>('betting');
    const [shotResult, setShotResult] = useState<ShotResult | null>(null);
    const [ballPosition, setBallPosition] = useState({ x: '50%', y: '85%' });
    const [keeperPosition, setKeeperPosition] = useState<number | null>(null);

    const { user } = useAuth();
    const { toast } = useToast();

    const handleShoot = async () => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'Debes iniciar sesión para apostar.' });
            return;
        }
        if (!selectedZone) {
            toast({ variant: 'destructive', title: 'Error', description: 'Debes seleccionar una zona para disparar.' });
            return;
        }
        const amount = parseFloat(betAmount);
        if (isNaN(amount) || amount <= 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'Introduce un monto de apuesta válido.' });
            return;
        }
        
        setGameState('shooting');
        setShotResult(null);

        try {
            await placePenaltyBet(user.uid, amount);

            // Animate the ball
            const targetEl = document.getElementById(`zone-${selectedZone}`);
            if (targetEl) {
                const rect = targetEl.getBoundingClientRect();
                const containerRect = targetEl.parentElement!.getBoundingClientRect();
                setBallPosition({ 
                    x: `${rect.left - containerRect.left + rect.width / 2}px`, 
                    y: `${rect.top - containerRect.top + rect.height / 2}px` 
                });
            }

            // Determine result and keeper movement
            const isGoal = Math.random() < GOAL_CHANCE;
            const keeperTargetZone = isGoal ? goalZones.find(z => z.id !== selectedZone)!.id : selectedZone;
            setKeeperPosition(keeperTargetZone);

            setTimeout(async () => {
                if (isGoal) {
                    setShotResult('goal');
                    const winnings = amount * GOAL_MULTIPLIER;
                    await resolvePenaltyBet(user.uid, winnings);
                    toast({
                        title: '¡GOOOOL!',
                        description: `Has ganado $${winnings.toFixed(2)}.`,
                        className: 'bg-green-600 border-green-600 text-white'
                    });
                } else {
                    setShotResult('save');
                     toast({
                        variant: 'destructive',
                        title: '¡ATAJADO!',
                        description: `El portero ha parado tu disparo.`,
                    });
                }
                
                setGameState('finished');
                
                setTimeout(() => {
                    setGameState('betting');
                    setBallPosition({ x: '50%', y: '85%' });
                    setKeeperPosition(null);
                    setSelectedZone(null);
                }, 3000);

            }, 1000); // Wait for animation

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error al apostar', description: error.message });
            setGameState('betting');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <SoccerBallIcon className="h-8 w-8 text-primary" />
                    <h1 className="text-3xl font-bold tracking-tight">Tanda de Penales</h1>
                </div>
                 <Button asChild size="lg">
                    <Link href="/casino">
                        <ArrowLeft className="mr-2 h-5 w-5" />
                        Volver a Juegos
                    </Link>
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Game Area */}
                <div className="lg:col-span-2 flex flex-col items-center justify-center space-y-4">
                    <Card className="w-full max-w-2xl aspect-[4/3] relative overflow-hidden bg-green-600">
                        {/* Goal posts */}
                        <div className="absolute top-[10%] left-[10%] w-[80%] h-[70%] border-4 border-white border-b-0" />
                        <div className="absolute top-[10%] left-[10%] w-[80%] h-[70%] bg-repeat bg-center" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M0 38.59l2.83-2.83 1.41 1.41L1.41 40H0v-1.41zM0 1.4l2.83 2.83 1.41-1.41L1.41 0H0v1.41zM38.59 40l-2.83-2.83 1.41-1.41L40 38.59V40h-1.41zM40 1.41l-2.83 2.83-1.41-1.41L38.59 0H40v1.41z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
                        
                        {/* Goalkeeper */}
                        <Shield
                            className={cn(
                                "absolute h-24 w-24 text-primary-foreground transition-all duration-500 ease-out",
                                `zone-keeper-${keeperPosition}`
                            )} 
                            style={{
                                top: keeperPosition === 3 ? '40%' : keeperPosition ? '20%' : '35%',
                                left: keeperPosition ? undefined : '50%',
                                transform: keeperPosition ? undefined : 'translateX(-50%)'
                            }}
                        />

                        {/* Ball */}
                        <SoccerBallIcon 
                             className="absolute h-8 w-8 text-white transition-all duration-300 ease-out"
                             style={{ 
                                top: ballPosition.y, 
                                left: ballPosition.x, 
                                transform: `translate(-50%, -50%) scale(${gameState === 'shooting' ? 0.7 : 1})`,
                             }} 
                        />

                        {/* Zones */}
                        <div className="absolute top-[10%] left-[10%] w-[80%] h-[70%] grid grid-cols-3 grid-rows-2">
                           <div id="zone-1" onClick={() => gameState === 'betting' && setSelectedZone(1)} className={cn("row-start-1 col-start-1", shotResult && selectedZone === 1 ? (shotResult === 'goal' ? 'bg-green-500/50' : 'bg-red-500/50') : 'hover:bg-white/20', "cursor-pointer transition-colors border-r border-b border-white/20")}></div>
                           <div id="zone-2" onClick={() => gameState === 'betting' && setSelectedZone(2)} className={cn("row-start-1 col-start-3", shotResult && selectedZone === 2 ? (shotResult === 'goal' ? 'bg-green-500/50' : 'bg-red-500/50') : 'hover:bg-white/20', "cursor-pointer transition-colors border-l border-b border-white/20")}></div>
                           <div id="zone-3" onClick={() => gameState === 'betting' && setSelectedZone(3)} className={cn("row-start-1 col-start-2", shotResult && selectedZone === 3 ? (shotResult === 'goal' ? 'bg-green-500/50' : 'bg-red-500/50') : 'hover:bg-white/20', "cursor-pointer transition-colors border-b border-white/20")}></div>
                           <div id="zone-4" onClick={() => gameState === 'betting' && setSelectedZone(4)} className={cn("row-start-2 col-start-1", shotResult && selectedZone === 4 ? (shotResult === 'goal' ? 'bg-green-500/50' : 'bg-red-500/50') : 'hover:bg-white/20', "cursor-pointer transition-colors border-r border-white/20")}></div>
                           <div id="zone-5" onClick={() => gameState === 'betting' && setSelectedZone(5)} className={cn("row-start-2 col-start-3", shotResult && selectedZone === 5 ? (shotResult === 'goal' ? 'bg-green-500/50' : 'bg-red-500/50') : 'hover:bg-white/20', "cursor-pointer transition-colors border-l border-white/20")}></div>
                        </div>

                         {/* Result text */}
                        {gameState === 'finished' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                <h2 className={cn("text-6xl font-bold font-headline animate-in zoom-in", shotResult === 'goal' ? 'text-green-400' : 'text-red-500')}>
                                    {shotResult === 'goal' ? '¡GOL!' : '¡ATAJADO!'}
                                </h2>
                            </div>
                        )}
                    </Card>
                    <p className="text-sm text-muted-foreground">Selecciona una zona en la portería para patear.</p>
                </div>

                {/* Control Panel */}
                <Card>
                    <CardHeader>
                        <CardTitle>Coloca tu Apuesta</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className='space-y-2'>
                            <Label>1. Elige un monto</Label>
                             <div className="flex gap-2">
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

                        <div className='space-y-2'>
                            <Label>2. Elige una zona</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {goalZones.map(zone => (
                                    <Button
                                        key={zone.id}
                                        variant={selectedZone === zone.id ? 'secondary' : 'outline'}
                                        onClick={() => setSelectedZone(zone.id)}
                                        disabled={gameState !== 'betting'}
                                        className="h-auto py-2 flex-col"
                                    >
                                        <Target className="h-5 w-5 mb-1" />
                                        <span className="text-xs">{zone.name}</span>
                                    </Button>
                                ))}
                            </div>
                        </div>
                        
                        <div className="text-center bg-secondary p-3 rounded-md">
                            <p className="text-sm text-muted-foreground">Probabilidad de Gol</p>
                            <p className="text-xl font-bold text-primary">{(GOAL_CHANCE * 100).toFixed(0)}%</p>
                            <p className="text-sm text-muted-foreground mt-2">Premio</p>
                            <p className="text-xl font-bold text-primary">{GOAL_MULTIPLIER}x</p>
                        </div>
                        
                        <Button
                            size="lg"
                            className="w-full h-12 text-lg"
                            onClick={handleShoot}
                            disabled={gameState !== 'betting' || !selectedZone}
                        >
                            {gameState === 'shooting' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            ¡Patear!
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

