
'use client';

import { useState, useRef, useEffect, useActionState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardTitle, CardHeader, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { placePenaltyBet, resolvePenaltyBet, updateGameAssetPositions, resolvePenaltyLoss } from './actions';
import { getPenaltyGameAssets } from '@/app/admin/game-assets/actions';
import { Loader2, ArrowLeft, Target, Save, AlertTriangle, Info, Copy } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertTitle, AlertDescription as AlertDescriptionComponent } from '@/components/ui/alert';


type GameState = 'betting' | 'powering' | 'shooting' | 'finished';
type ShotResult = 'goal' | 'save' | 'miss';

const goalZones = [
    { id: 1, name: 'Sup. Izq.', position: { top: '30%', left: '22%' } },
    { id: 2, name: 'Sup. Der.', position: { top: '30%', left: '78%' } },
    { id: 3, name: 'Centro', position: { top: '45%', left: '50%' } },
    { id: 4, name: 'Inf. Izq.', position: { top: '65%', left: '22%' } },
    { id: 5, name: 'Inf. Der.', position: { top: '65%', left: '78%' } },
];

const multiplierOptions = [
    { multiplier: 2, chance: 0.40, displayChance: 0.50 }, // Real: 40%, Display: 50%
    { multiplier: 3, chance: 0.35, displayChance: 0.40 }, // Real: 35%, Display: 40%
    { multiplier: 4, chance: 0.30, displayChance: 0.30 }, // 30% chance
    { multiplier: 5, chance: 0.20, displayChance: 0.20 }, // 20% chance
];


const defaultAssets: Record<string, string | number> = {
    background: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600' width='800' height='600'%3E%3Crect width='800' height='600' fill='%234CAF50'/%3E%3Crect x='100' y='100' width='600' height='400' fill='none' stroke='white' stroke-width='8'/%3E%3C/svg%3E",
    ball: 'https://i.postimg.cc/XvB9255v/soccer-ball.png',
    keeper_standing: 'https://i.postimg.cc/T1bSCYkF/goalkeeper.png',
    keeper_flying: 'https://i.postimg.cc/yNnLzWpD/goalkeeper-save.png',
    keeper_miss: 'https://i.postimg.cc/J0Bv5zB0/goalkeeper-miss.png',
    keeperTop: 30,
    keeperLeft: 50,
    keeperScale: 1.2,
    ballTop: 85,
    ballLeft: 50,
    ballScale: 1,
};

export default function PenaltyShootoutPage() {
    const [betAmount, setBetAmount] = useState('1.00');
    const [selectedZone, setSelectedZone] = useState<number | null>(null);
    const [selectedMultiplier, setSelectedMultiplier] = useState<number | null>(null);
    const [gameState, setGameState] = useState<GameState>('betting');
    const [shotResult, setShotResult] = useState<ShotResult | null>(null);
    
    const [gameAssets, setGameAssets] = useState<Record<string, string | number>>(defaultAssets);
    const [assetsLoading, setAssetsLoading] = useState(true);
    const [keeperImage, setKeeperImage] = useState(defaultAssets.keeper_standing as string);
    const [shotPower, setShotPower] = useState(0);

    const powerIntervalRef = useRef<NodeJS.Timeout | null>(null);


    // Dev Controls State
    const [keeperTop, setKeeperTop] = useState(defaultAssets.keeperTop as number);
    const [keeperLeft, setKeeperLeft] = useState(defaultAssets.keeperLeft as number);
    const [keeperScale, setKeeperScale] = useState(defaultAssets.keeperScale as number);
    const [ballTop, setBallTop] = useState(defaultAssets.ballTop as number);
    const [ballLeft, setBallLeft] = useState(defaultAssets.ballLeft as number);
    const [ballScale, setBallScale] = useState(defaultAssets.ballScale as number);

    const { user, isAdmin } = useAuth();
    const { toast } = useToast();

    const [saveState, saveAction, isSaving] = useActionState(updateGameAssetPositions, { success: false, message: '' });

    useEffect(() => {
        if (saveState.message) {
            if (saveState.success) {
                toast({ title: "Guardado", description: saveState.message });
            } else {
                // The error is now displayed in the Alert component, but a toast can still be useful.
                toast({ variant: 'destructive', title: "Error", description: saveState.message });
            }
        }
    }, [saveState, toast]);

    const initialKeeperStyle = { top: `${keeperTop}%`, left: `${keeperLeft}%`, transform: `translateX(-50%) scale(${keeperScale})` };
    const [keeperStyle, setKeeperStyle] = useState(initialKeeperStyle);

    useEffect(() => {
        if (gameState === 'betting') {
            setKeeperStyle({ top: `${keeperTop}%`, left: `${keeperLeft}%`, transform: `translateX(-50%) scale(${keeperScale})` });
            setKeeperImage(gameAssets.keeper_standing as string);
        }
    }, [keeperTop, keeperLeft, keeperScale, gameState, gameAssets.keeper_standing]);
    

     useEffect(() => {
        const fetchAssets = async () => {
            setAssetsLoading(true);
            const assets = await getPenaltyGameAssets();
            const mergedAssets = { ...defaultAssets, ...assets };
            setGameAssets(mergedAssets);
            setKeeperImage(mergedAssets.keeper_standing as string);

            // Set initial positions from fetched data
            setKeeperTop(mergedAssets.keeperTop as number);
            setKeeperLeft(mergedAssets.keeperLeft as number);
            setKeeperScale(mergedAssets.keeperScale as number);
            setBallTop(mergedAssets.ballTop as number);
            setBallLeft(mergedAssets.ballLeft as number);
            setBallScale(mergedAssets.ballScale as number);

            setAssetsLoading(false);
        };
        fetchAssets();
    }, []);

    const startPowering = () => {
        if (gameState !== 'betting') return;
        setGameState('powering');
        powerIntervalRef.current = setInterval(() => {
            setShotPower(prev => Math.min(100, prev + 1.5));
        }, 20);
    };

    const releasePower = () => {
        if (powerIntervalRef.current) clearInterval(powerIntervalRef.current);
        if (gameState !== 'powering') return;
        handleShoot();
    };

    useEffect(() => {
        if (shotPower >= 100 && gameState === 'powering') {
            if (powerIntervalRef.current) clearInterval(powerIntervalRef.current);
            handleShoot();
        }
    }, [shotPower, gameState]);


    const handleShoot = async () => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'Debes iniciar sesión para apostar.' });
            setGameState('betting');
            return;
        }
        if (!selectedZone || !selectedMultiplier) {
            toast({ variant: 'destructive', title: 'Error', description: 'Debes seleccionar riesgo y zona para disparar.' });
            setGameState('betting');
            return;
        }

        const amount = parseFloat(betAmount);
        if (isNaN(amount) || amount <= 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'Introduce un monto de apuesta válido.' });
            setGameState('betting');
            return;
        }
        
        setGameState('shooting');
        setShotResult(null);

        try {
            await placePenaltyBet(user.uid, amount);

            // Power mechanic: 20% chance to miss if power > 50
            const shotGoesWide = shotPower > 50 && Math.random() < 0.2;

            if (shotGoesWide) {
                setShotResult('miss');
                const penaltyAmount = amount * selectedMultiplier;
                await resolvePenaltyLoss(user.uid, penaltyAmount);
                toast({
                    variant: 'destructive',
                    title: '¡FUERA!',
                    description: `Demasiada potencia. Has perdido -$${penaltyAmount.toFixed(2)}.`,
                });
            } else {
                const shotConfig = multiplierOptions.find(opt => opt.multiplier === selectedMultiplier)!;
                const isGoal = Math.random() < shotConfig.chance;
                
                const keeperTargetZoneId = isGoal 
                    ? goalZones.find(z => z.id !== selectedZone)!.id 
                    : selectedZone;
                
                if (!keeperTargetZoneId) return;

                const keeperTargetPosition = goalZones.find(z => z.id === keeperTargetZoneId)!.position;
                
                let rotationAngle = 0;
                switch(keeperTargetZoneId) {
                    case 1: rotationAngle = -20; break;
                    case 2: rotationAngle = 20; break;
                    case 4: rotationAngle = -90; break;
                    case 5: rotationAngle = 90; break;
                }

                if (isGoal) {
                    setKeeperImage(gameAssets.keeper_miss as string);
                } else {
                    setKeeperImage(gameAssets.keeper_flying as string);
                }

                setKeeperStyle(prev => ({
                    ...prev,
                    top: keeperTargetPosition.top,
                    left: keeperTargetPosition.left,
                    transform: `translateX(-50%) translateY(-50%) scale(${keeperScale * 1.1}) rotate(${rotationAngle}deg)`
                }));

                // Result determination after animation
                setTimeout(async () => {
                    if (isGoal) {
                        setShotResult('goal');
                        const winnings = amount * shotConfig.multiplier;
                        await resolvePenaltyBet(user.uid, winnings);
                        toast({
                            title: '¡GOOOOL!',
                            description: `Has ganado $${winnings.toFixed(2)}.`,
                            className: 'bg-green-600 border-green-600 text-white'
                        });
                    } else {
                        setShotResult('save');
                        const penaltyAmount = amount * shotConfig.multiplier;
                        await resolvePenaltyLoss(user.uid, penaltyAmount);
                         toast({
                            variant: 'destructive',
                            title: '¡ATAJADO!',
                            description: `Perdiste tu apuesta. Penalización: -$${(penaltyAmount).toFixed(2)}`,
                        });
                    }
                }, 1000); // Wait for animation
            }

            // Finish the game round
            setTimeout(() => {
                setGameState('finished');
                setTimeout(() => {
                    setGameState('betting');
                    setSelectedZone(null);
                    setSelectedMultiplier(null);
                    setShotPower(0);
                }, 3000);
            }, 1000);

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error al apostar', description: error.message });
            setGameState('betting');
            setShotPower(0);
        }
    };


    const getBallStyle = () => {
        if (gameState === 'shooting' && selectedZone) {
            if (shotResult === 'miss') {
                 return {
                    top: '10%', // Goes over the bar
                    left: '50%',
                    transform: `translate(-50%, -50%) scale(${ballScale * 0.5})`,
                };
            }
            const targetPosition = goalZones.find(z => z.id === selectedZone)!.position;
            return {
                top: targetPosition.top,
                left: targetPosition.left,
                transform: `translate(-50%, -50%) scale(${ballScale * 0.7})`,
            };
        }
        return { top: `${ballTop}%`, left: `${ballLeft}%`, transform: `translate(-50%, -50%) scale(${ballScale})` };
    };

    const getResultText = () => {
        switch (shotResult) {
            case 'goal': return '¡GOL!';
            case 'save': return '¡ATAJADO!';
            case 'miss': return '¡FUERA!';
            default: return '';
        }
    }

    const selectedMultiplierData = selectedMultiplier ? multiplierOptions.find(m => m.multiplier === selectedMultiplier) : null;


    return (
        <Dialog>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Target className="h-8 w-8 text-primary" />
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
                                        src={gameAssets.background as string}
                                        alt="Campo de futbol"
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
                                    <div className="absolute h-8 w-8 text-white transition-all duration-300 ease-out"
                                        style={getBallStyle()} >
                                        <Image src={gameAssets.ball as string} alt="Balón de fútbol" fill sizes="32px" className="object-contain" />
                                    </div>
                                </>
                            )}
                            
                            {/* Zones */}
                            {gameState === 'betting' && selectedMultiplier && goalZones.map(zone => (
                                <div
                                    key={zone.id}
                                    id={`zone-${zone.id}`}
                                    onClick={() => gameState === 'betting' && setSelectedZone(zone.id)}
                                    className="absolute w-12 h-12 -translate-x-1/2 -translate-y-1/2 cursor-pointer flex items-center justify-center"
                                    style={zone.position}
                                >
                                    <div className={cn("w-full h-full transition-all bg-yellow-400/20 hover:bg-yellow-400/40 rounded-full",
                                        selectedZone === zone.id ? 'bg-transparent' : ''
                                    )}>
                                        {selectedZone === zone.id && (
                                            <Target className="w-12 h-12 text-primary animate-in fade-in zoom-in" />
                                        )}
                                    </div>
                                </div>
                            ))}
                            {shotResult && selectedZone && shotResult !== 'miss' && (
                                <div className={cn("absolute w-16 h-16 -translate-x-1/2 -translate-y-1/2 rounded-full", shotResult === 'goal' ? 'bg-green-500/40' : 'bg-red-500/40')} style={goalZones.find(z => z.id === selectedZone)?.position}></div>
                            )}


                            {/* Result text */}
                            {gameState === 'finished' && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                    <h2 className={cn("text-6xl font-bold font-headline animate-in zoom-in", shotResult === 'goal' ? 'text-green-400' : 'text-red-500')}>
                                        {getResultText()}
                                    </h2>
                                </div>
                            )}
                        </Card>
                        
                        {/* DEV CONTROLS */}
                        {isAdmin && (
                            <Card className='w-full max-w-2xl'>
                                <CardHeader>
                                    <CardTitle className='text-base'>Controles de Desarrollo</CardTitle>
                                    <CardDescription className='text-xs'>Ajusta la posición y escala de los elementos.</CardDescription>
                                </CardHeader>
                                <CardContent className='space-y-4'>
                                    <form action={saveAction} className='space-y-6'>
                                        <input type="hidden" name="keeperTop" value={keeperTop} />
                                        <input type="hidden" name="keeperLeft" value={keeperLeft} />
                                        <input type="hidden" name="keeperScale" value={keeperScale} />
                                        <input type="hidden" name="ballTop" value={ballTop} />
                                        <input type="hidden" name="ballLeft" value={ballLeft} />
                                        <input type="hidden" name="ballScale" value={ballScale} />
                                        <div className='grid grid-cols-2 gap-4'>
                                            <div className='space-y-3 p-3 border rounded-lg'>
                                                <Label className='font-semibold'>Portero</Label>
                                                <div className='space-y-1'>
                                                    <Label htmlFor="keeper-top" className='text-xs'>Posición Y: {keeperTop}</Label>
                                                    <Slider id="keeper-top" value={[keeperTop]} onValueChange={(v) => setKeeperTop(v[0])} max={100} step={1} />
                                                </div>
                                                <div className='space-y-1'>
                                                    <Label htmlFor="keeper-left" className='text-xs'>Posición X: {keeperLeft}</Label>
                                                    <Slider id="keeper-left" value={[keeperLeft]} onValueChange={(v) => setKeeperLeft(v[0])} max={100} step={1} />
                                                </div>
                                                <div className='space-y-1'>
                                                    <Label htmlFor="keeper-scale" className='text-xs'>Escala: {keeperScale}</Label>
                                                    <Slider id="keeper-scale" value={[keeperScale]} onValueChange={(v) => setKeeperScale(v[0])} max={3} step={0.1} />
                                                </div>
                                            </div>
                                            <div className='space-y-3 p-3 border rounded-lg'>
                                                <Label className='font-semibold'>Balón</Label>
                                                <div className='space-y-1'>
                                                    <Label htmlFor="ball-top" className='text-xs'>Posición Y: {ballTop}</Label>
                                                    <Slider id="ball-top" value={[ballTop]} onValueChange={(v) => setBallTop(v[0])} max={100} step={1} />
                                                </div>
                                                <div className='space-y-1'>
                                                    <Label htmlFor="ball-left" className='text-xs'>Posición X: {ballLeft}</Label>
                                                    <Slider id="ball-left" value={[ballLeft]} onValueChange={(v) => setBallLeft(v[0])} max={100} step={1} />
                                                </div>
                                                <div className='space-y-1'>
                                                    <Label htmlFor="ball-scale" className='text-xs'>Escala: {ballScale}</Label>
                                                    <Slider id="ball-scale" value={[ballScale]} onValueChange={(v) => setBallScale(v[0])} max={3} step={0.1} />
                                                </div>
                                            </div>
                                        </div>
                                        <Button type="submit" disabled={isSaving} className='w-full'>
                                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                            Guardar Posiciones
                                        </Button>

                                        {saveState.message && !saveState.success && (
                                            <Alert variant="destructive" className="mt-4">
                                                <AlertTitle>Error al Guardar</AlertTitle>
                                                <div className="flex items-center justify-between">
                                                <AlertDescriptionComponent>
                                                    {saveState.message}
                                                </AlertDescriptionComponent>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 flex-shrink-0"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(saveState.message);
                                                        toast({ title: "Copiado", description: "El mensaje de error ha sido copiado." });
                                                    }}
                                                >
                                                    <Copy className="h-4 w-4" />
                                                    <span className="sr-only">Copiar error</span>
                                                </Button>
                                                </div>
                                            </Alert>
                                        )}
                                    </form>
                                </CardContent>
                            </Card>
                        )}

                    </div>

                    {/* Control Panel */}
                    <Card>
                        <CardHeader className="flex-row items-center justify-between">
                            <CardTitle>Coloca tu Apuesta</CardTitle>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Info className="mr-2 h-4 w-4" />
                                    Indicaciones
                                </Button>
                            </DialogTrigger>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className='space-y-2'>
                                <Label>1. Elige un monto</Label>
                                <div className="grid grid-cols-4 gap-2">
                                    <Button size="sm" variant="outline" onClick={() => setBetAmount('1.00')} disabled={gameState !== 'betting'}>$1</Button>
                                    <Button size="sm" variant="outline" onClick={() => setBetAmount('2.00')} disabled={gameState !== 'betting'}>$2</Button>
                                    <Button size="sm" variant="outline" onClick={() => setBetAmount('5.00')} disabled={gameState !== 'betting'}>$5</Button>
                                    <Button size="sm" variant="outline" onClick={() => setBetAmount('10.00')} disabled={gameState !== 'betting'}>$10</Button>
                                </div>
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
                                <Label>2. Elige tu Riesgo/Premio</Label>
                                <div className="grid grid-cols-4 gap-2">
                                    {multiplierOptions.map(opt => (
                                        <Button
                                            key={opt.multiplier}
                                            variant={selectedMultiplier === opt.multiplier ? 'secondary' : 'outline'}
                                            onClick={() => setSelectedMultiplier(opt.multiplier)}
                                            disabled={gameState !== 'betting'}
                                            className="h-auto py-2 flex-col"
                                        >
                                            <span className="font-bold">{opt.multiplier}x</span>
                                            <span className="text-xs text-muted-foreground">{opt.displayChance * 100}%</span>
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className='space-y-2'>
                                <Label className={cn(!selectedMultiplier && 'text-muted-foreground')}>3. Elige una zona para disparar</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {goalZones.map(zone => (
                                        <Button
                                            key={zone.id}
                                            variant={selectedZone === zone.id ? 'secondary' : 'outline'}
                                            onClick={() => setSelectedZone(zone.id)}
                                            disabled={gameState !== 'betting' || !selectedMultiplier}
                                            className="h-auto py-2 flex-col"
                                        >
                                            <Target className="h-5 w-5 mb-1" />
                                            <span className="text-xs">{zone.name}</span>
                                        </Button>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="text-center bg-secondary p-3 rounded-md space-y-2">
                                <div className='grid grid-cols-2 gap-2'>
                                    <div className='text-left'>
                                        <p className="text-sm text-muted-foreground">Posible Ganancia</p>
                                        <p className="text-xl font-bold text-green-400">
                                            {selectedMultiplierData ? `+$${(parseFloat(betAmount) * selectedMultiplierData.multiplier).toFixed(2)}` : '-'}
                                        </p>
                                    </div>
                                    <div className='text-right'>
                                        <p className="text-sm text-muted-foreground">Posible Pérdida</p>
                                        <p className="text-xl font-bold text-red-500">
                                            {selectedMultiplierData ? `-$${(parseFloat(betAmount) * selectedMultiplierData.multiplier).toFixed(2)}` : '-'}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-xs text-amber-500/80 font-semibold flex items-center justify-center gap-1 border-t border-border pt-2">
                                    <AlertTriangle className='h-3 w-3' />
                                    ¡Atención! Una pérdida cuesta el PREMIO POTENCIAL.
                                </div>
                            </div>

                            <div className='space-y-2'>
                                <Label className={cn(!selectedZone && 'text-muted-foreground')}>4. Potencia tu Disparo</Label>
                                <Progress value={shotPower} className="w-full" />
                                <Button
                                    size="lg"
                                    className="w-full h-12 text-lg"
                                    onMouseDown={startPowering}
                                    onMouseUp={releasePower}
                                    onMouseLeave={releasePower}
                                    onTouchStart={(e) => { e.preventDefault(); startPowering(); }}
                                    onTouchEnd={(e) => { e.preventDefault(); releasePower(); }}
                                    disabled={gameState === 'shooting' || !selectedZone || !selectedMultiplier}
                                >
                                    {gameState === 'powering' && `Potencia: ${Math.round(shotPower)}%`}
                                    {gameState === 'betting' && 'Mantén para Patear'}
                                    {gameState === 'shooting' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {gameState === 'finished' && 'Ronda Terminada'}
                                </Button>
                                <p className='text-xs text-muted-foreground text-center'>Si la potencia supera el 50%, hay un 20% de riesgo de que el tiro se vaya fuera.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Cómo Jugar a la Tanda de Penales</DialogTitle>
                    <DialogDescription>Sigue estos pasos para probar tu suerte y habilidad.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 text-sm text-muted-foreground py-4">
                    <p>
                        <strong>Paso 1: Elige tu Apuesta</strong><br/>
                        Usa los botones rápidos o introduce un monto personalizado para definir cuánto quieres apostar en esta ronda.
                    </p>
                    <p>
                        <strong>Paso 2: Selecciona el Riesgo</strong><br/>
                        Elige un multiplicador (2x, 3x, 4x, o 5x). A mayor multiplicador, mayor será el premio si ganas, pero menor será tu probabilidad de marcar el gol. ¡La pérdida también será mayor!
                    </p>
                    <p>
                        <strong>Paso 3: Elige la Zona</strong><br/>
                        Selecciona a qué parte de la portería quieres disparar. La probabilidad de éxito no cambia según la zona, solo depende del riesgo que elegiste en el paso anterior.
                    </p>
                    <div className="p-3 bg-secondary rounded-md">
                        <h4 className="font-semibold text-foreground mb-2">Reglas Clave</h4>
                        <ul className="list-disc list-inside space-y-1">
                            <li><strong>Si marcas GOL:</strong> Ganas `Monto Apostado × Multiplicador Elegido`.</li>
                            <li><strong>Si el portero ATAJA o el tiro se va FUERA:</strong> Pierdes `Monto Apostado × Multiplicador Elegido`.</li>
                        </ul>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

    

    