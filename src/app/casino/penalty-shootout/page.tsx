
'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardTitle, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { placePenaltyBet, resolvePenaltyBet } from './actions';
import { getPenaltyGameAssets } from '@/app/admin/game-assets/actions';
import { Loader2, ArrowLeft, Target } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { SoccerBallIcon } from '@/components/icons/soccer-ball-icon';
import { Skeleton } from '@/components/ui/skeleton';


type GameState = 'betting' | 'shooting' | 'finished';
type ShotResult = 'goal' | 'save';

const GOAL_MULTIPLIER = 3;
const GOAL_CHANCE = 0.60; // 60% chance to score

const goalZones = [
    { id: 1, name: 'Superior Izquierda', position: { top: '30%', left: '22%' } },
    { id: 2, name: 'Superior Derecha', position: { top: '30%', left: '76%' } },
    { id: 3, name: 'Centro', position: { top: '40%', left: '50%' } },
    { id: 4, name: 'Inferior Izquierda', position: { top: '55%', left: '22%' } },
    { id: 5, name: 'Inferior Derecha', position: { top: '55%', left: '76%' } },
];

const defaultAssets = {
    background: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600' width='800' height='600'%3E%3Crect width='800' height='600' fill='%234CAF50'/%3E%3Crect x='100' y='100' width='600' height='400' fill='none' stroke='white' stroke-width='8'/%3E%3C/svg%3E",
    ball: '', // Use icon
    keeper_standing: 'https://i.postimg.cc/T1bSCYkF/goalkeeper.png',
    keeper_flying: 'https://i.postimg.cc/T1bSCYkF/goalkeeper.png',
};

export default function PenaltyShootoutPage() {
    const [betAmount, setBetAmount] = useState('1.00');
    const [selectedZone, setSelectedZone] = useState<number | null>(null);
    const [gameState, setGameState] = useState<GameState>('betting');
    const [shotResult, setShotResult] = useState<ShotResult | null>(null);
    const [ballPosition, setBallPosition] = useState({ x: '50%', y: '85%' });
    const [keeperStyle, setKeeperStyle] = useState({
        top: '38%',
        left: '50%',
        transform: 'translateX(-50%) scale(1)',
    });
    const [gameAssets, setGameAssets] = useState<Record<string, string>>(defaultAssets);
    const [assetsLoading, setAssetsLoading] = useState(true);

    const { user } = useAuth();
    const { toast } = useToast();

     useEffect(() => {
        const fetchAssets = async () => {
            const assets = await getPenaltyGameAssets();
            setGameAssets(prev => ({ ...defaultAssets, ...assets }));
            setAssetsLoading(false);
        };
        fetchAssets();
    }, []);

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
            const targetPosition = goalZones.find(z => z.id === selectedZone)!.position;
            setBallPosition({ 
                x: targetPosition.left, 
                y: targetPosition.top
            });


            // Determine result and keeper movement
            const isGoal = Math.random() < GOAL_CHANCE;
            const keeperTargetZone = isGoal 
                ? goalZones.find(z => z.id !== selectedZone)!.id 
                : selectedZone;
            
            const keeperTargetPosition = goalZones.find(z => z.id === keeperTargetZone)!.position;
            
            setKeeperStyle({
                top: keeperTargetPosition.top,
                left: keeperTargetPosition.left,
                transform: 'translateX(-50%) translateY(-50%) scale(1.4)'
            });


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
                    setKeeperStyle({
                        top: '38%',
                        left: '50%',
                        transform: 'translateX(-50%) scale(1)',
                    });
                    setSelectedZone(null);
                }, 3000);

            }, 1000); // Wait for animation

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error al apostar', description: error.message });
            setGameState('betting');
        }
    };

    const keeperImage = gameState === 'shooting' ? gameAssets.keeper_flying : gameAssets.keeper_standing;

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
                        {assetsLoading ? (
                             <Skeleton className="absolute inset-0" />
                        ) : (
                            <>
                                 <Image
                                    src={gameAssets.background}
                                    alt="Campo de futbol"
                                    fill
                                    className="object-cover"
                                    priority
                                />
                                {/* Goalkeeper */}
                                {keeperImage && (
                                    <div
                                        className="absolute w-32 h-32 transition-all duration-300 ease-out"
                                        style={keeperStyle}
                                    >
                                        <Image
                                            src={keeperImage}
                                            alt="Goalkeeper"
                                            width={128}
                                            height={128}
                                            className="drop-shadow-lg"
                                        />
                                    </div>
                                )}
                                {/* Ball */}
                                {gameAssets.ball ? (
                                    <div className="absolute h-8 w-8 text-white transition-all duration-300 ease-out"
                                         style={{ 
                                            top: ballPosition.y, 
                                            left: ballPosition.x, 
                                            transform: `translate(-50%, -50%) scale(${gameState === 'shooting' ? 0.7 : 1})`,
                                         }} >
                                        <Image src={gameAssets.ball} alt="Balón de fútbol" width={32} height={32} />
                                    </div>
                                ) : (
                                    <SoccerBallIcon 
                                        className="absolute h-8 w-8 text-white transition-all duration-300 ease-out"
                                        style={{ 
                                            top: ballPosition.y, 
                                            left: ballPosition.x, 
                                            transform: `translate(-50%, -50%) scale(${gameState === 'shooting' ? 0.7 : 1})`,
                                        }} 
                                    />
                                )}
                            </>
                        )}
                        
                        {/* Zones */}
                        {gameState === 'betting' && goalZones.map(zone => (
                             <div
                                key={zone.id}
                                id={`zone-${zone.id}`}
                                onClick={() => gameState === 'betting' && setSelectedZone(zone.id)}
                                className="absolute w-12 h-12 -translate-x-1/2 -translate-y-1/2 rounded-full cursor-pointer flex items-center justify-center"
                                style={zone.position}
                             >
                                 <div className={cn("w-full h-full rounded-full transition-all",
                                    selectedZone === zone.id ? 'bg-transparent' : 'bg-yellow-400/20 hover:bg-yellow-400/40'
                                 )}>
                                    {selectedZone === zone.id && (
                                        <Target className="w-12 h-12 text-primary animate-in fade-in zoom-in" />
                                    )}
                                 </div>
                             </div>
                        ))}
                         {shotResult && selectedZone && (
                            <div className={cn("absolute w-16 h-16 rounded-full -translate-x-1/2 -translate-y-1/2", shotResult === 'goal' ? 'bg-green-500/40' : 'bg-red-500/40')} style={goalZones.find(z => z.id === selectedZone)?.position}></div>
                         )}


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

    

    