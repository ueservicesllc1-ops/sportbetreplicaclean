
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardTitle, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Palette, ArrowLeft } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Wheel, type WheelSegment } from '@/components/casino/wheel';
import { placeWheelBet, resolveWheelBet } from './actions';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';

const segments: WheelSegment[] = [
    { color: '#dc2626', label: '2x', value: 2 },
    { color: '#000000', label: '0x', value: 0 },
    { color: '#16a34a', label: '1.1x', value: 1.1 },
    { color: '#000000', label: '0x', value: 0 },
    { color: '#16a34a', label: '1.5x', value: 1.5 },
    { color: '#000000', label: '0x', value: 0 },
    { color: '#dc2626', label: '3x', value: 3 },
    { color: '#000000', label: '0x', value: 0 },
    { color: '#16a34a', label: '2x', value: 2 },
    { color: '#000000', label: '0x', value: 0 },
    { color: '#dc2626', label: '1.3x', value: 1.3 },
    { color: '#000000', label: '0x', value: 0 },
    { color: '#dc2626', label: '5x', value: 5 },
    { color: '#000000', label: '0x', value: 0 },
    { color: '#facc15', label: '10x', value: 10 },
    { color: '#000000', label: '0x', value: 0 },
];

const betOptions = [
    { color: '#dc2626', name: 'Rojo', multiplier: 2 },
    { color: '#16a34a', name: 'Verde', multiplier: 2 },
    { color: '#facc15', name: 'Amarillo', multiplier: 10 },
];

type GameState = 'betting' | 'charging' | 'spinning' | 'finished';

function BetPanel({ betAmount, setBetAmount, gameState, selectedColor, setSelectedColor, spinPower, startCharging, releaseCharge, getButtonText, isSubmitting }) {
    return (
        <Card>
            <CardHeader><CardTitle>Coloca tu Apuesta</CardTitle></CardHeader>
            <CardContent className="space-y-6">
                <div className='space-y-2'>
                    <Label>1. Elige un monto</Label>
                    <div className="flex gap-2">
                        <Input type="number" value={betAmount} onChange={(e) => setBetAmount(e.target.value)} placeholder="1.00" className='text-base font-bold' disabled={gameState !== 'betting'} />
                        <Button variant="outline" onClick={() => setBetAmount((p) => (parseFloat(p) / 2).toFixed(2))} disabled={gameState !== 'betting'}>½</Button>
                        <Button variant="outline" onClick={() => setBetAmount((p) => (parseFloat(p) * 2).toFixed(2))} disabled={gameState !== 'betting'}>2x</Button>
                    </div>
                </div>
                <div className='space-y-2'>
                    <Label>2. Elige un color</Label>
                    <div className="grid grid-cols-3 gap-2">
                        {betOptions.map(opt => (
                            <button key={opt.name} onClick={() => setSelectedColor(opt.color)} disabled={gameState !== 'betting'} className={cn("p-3 rounded-md border-2 transition-all text-white font-semibold flex flex-col items-center justify-center gap-1", selectedColor === opt.color ? 'border-primary scale-105' : 'border-transparent', gameState !== 'betting' ? 'opacity-50 cursor-not-allowed' : '')} style={{ backgroundColor: opt.color }}>
                                <span>{opt.name}</span>
                                <span className="text-xs opacity-80">(Paga ~{opt.multiplier}x)</span>
                            </button>
                        ))}
                    </div>
                </div>
                <div className='space-y-3'>
                    <Label>3. Potencia tu Giro</Label>
                    <Progress value={spinPower} className="w-full" />
                    <Button size="lg" className="w-full h-12 text-lg" onMouseDown={startCharging} onMouseUp={releaseCharge} onMouseLeave={releaseCharge} onTouchStart={(e) => { e.preventDefault(); startCharging(); }} onTouchEnd={(e) => { e.preventDefault(); releaseCharge(); }} disabled={isSubmitting || gameState === 'spinning' || !selectedColor}>
                        {getButtonText()}
                    </Button>
                </div>
                {gameState === 'finished' && (
                    <div className="text-center animate-in fade-in">
                        <p className="font-bold text-lg">La rueda se ha detenido.</p>
                        <p className="text-muted-foreground">Coloca una nueva apuesta para la siguiente ronda.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default function RuletaPage() {
    const [betAmount, setBetAmount] = useState('1.00');
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [rotation, setRotation] = useState(0);
    const [gameState, setGameState] = useState<GameState>('betting');
    const [winningSegment, setWinningSegment] = useState<WheelSegment | null>(null);
    const [winningIndex, setWinningIndex] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [spinPower, setSpinPower] = useState(0);
    const powerIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const { user } = useAuth();
    const { toast } = useToast();

    const handleSpin = useCallback(async () => {
        if (isSubmitting || gameState === 'spinning') return;

        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'Debes iniciar sesión para apostar.' });
            setGameState('betting');
            setSpinPower(0);
            return;
        }
        if (!selectedColor) {
            toast({ variant: 'destructive', title: 'Error', description: 'Debes seleccionar un color para apostar.' });
            setGameState('betting');
            setSpinPower(0);
            return;
        }
        const amount = parseFloat(betAmount);
        if (isNaN(amount) || amount <= 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'Introduce un monto de apuesta válido.' });
            setGameState('betting');
            setSpinPower(0);
            return;
        }

        setIsSubmitting(true);
        setGameState('spinning');
        setWinningSegment(null);

        try {
            await placeWheelBet(user.uid, amount);

            const finalWinningIndex = Math.floor(Math.random() * segments.length);
            const segment = segments[finalWinningIndex];
            setWinningIndex(finalWinningIndex);
            setWinningSegment(segment);

            setTimeout(async () => {
                const isWin = segment.color === selectedColor;
                const winnings = isWin ? amount * segment.value : 0;

                try {
                    if (isWin) {
                        await resolveWheelBet(user.uid, winnings);
                        toast({ title: '¡Ganaste!', description: `Has ganado $${winnings.toFixed(2)}.`, className: 'bg-green-600 border-green-600 text-white' });
                    } else {
                        toast({ variant: 'destructive', title: 'Perdiste', description: 'La rueda cayó en un segmento de color diferente.' });
                    }
                } catch (e) {
                    const error = e instanceof Error ? e.message : 'Ocurrió un error desconocido.';
                    toast({ variant: 'destructive', title: 'Error al acreditar', description: error });
                }

                setGameState('finished');
                setTimeout(() => {
                    setGameState('betting');
                    setIsSubmitting(false);
                    setWinningIndex(null);
                    setSpinPower(0);
                }, 3000);
            }, 4000);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
            toast({ variant: 'destructive', title: 'Error al apostar', description: message });
            setGameState('betting');
            setIsSubmitting(false);
            setWinningIndex(null);
            setSpinPower(0);
        }
    }, [betAmount, gameState, isSubmitting, selectedColor, toast, user]);

    useEffect(() => {
        if (winningIndex === null) return;
        const segmentAngle = 360 / segments.length;
        const randomOffset = (Math.random() - 0.5) * segmentAngle * 0.8;
        const baseRotations = 3 + Math.floor(spinPower / 20);
        const baseRotation = 360 * baseRotations;
        const finalRotation = baseRotation - (winningIndex * segmentAngle) - (segmentAngle / 2) + randomOffset;
        setRotation(finalRotation);
    }, [winningIndex, spinPower]);

    useEffect(() => {
        if (spinPower >= 100 && gameState === 'charging') {
            if (powerIntervalRef.current) clearInterval(powerIntervalRef.current);
            handleSpin();
        }
    }, [spinPower, gameState, handleSpin]);

    const startCharging = () => {
        if (gameState !== 'betting' || isSubmitting) return;
        setGameState('charging');
        powerIntervalRef.current = setInterval(() => {
            setSpinPower(prev => Math.min(100, prev + 1));
        }, 20);
    };

    const releaseCharge = () => {
        if (powerIntervalRef.current) clearInterval(powerIntervalRef.current);
        if (gameState !== 'charging') return;
        if (spinPower > 10) {
            handleSpin();
        } else {
            setGameState('betting');
            setSpinPower(0);
        }
    };

    const getButtonText = () => {
        switch (gameState) {
            case 'charging': return '¡Suelta para Girar!';
            case 'spinning': return <Loader2 className="mr-2 h-4 w-4 animate-spin" />;
            case 'finished': return 'Girar de Nuevo';
            default: return 'Mantén para Girar';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Palette className="h-8 w-8 text-primary" />
                    <h1 className="text-3xl font-bold tracking-tight">Ruleta de la Suerte</h1>
                </div>
                <Button asChild size="lg">
                    <Link href="/casino"><ArrowLeft className="mr-2 h-5 w-5" /> Volver a Juegos</Link>
                </Button>
            </div>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2 flex items-center justify-center">
                    <div className="relative w-full max-w-[500px] aspect-square">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[30px] border-t-primary z-10 drop-shadow-lg"></div>
                        <div style={{ transform: `rotate(${rotation}deg)`, transition: gameState === 'spinning' ? 'transform 4s cubic-bezier(0.2, 0.8, 0.7, 1)' : 'none' }} className="absolute inset-0">
                            <Wheel segments={segments} />
                        </div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-16 w-16 rounded-full bg-secondary border-4 border-primary flex items-center justify-center text-primary font-bold text-lg">
                            {gameState === 'finished' && winningSegment ? winningSegment.label : '?'}
                        </div>
                    </div>
                </div>
                <BetPanel {...{ betAmount, setBetAmount, gameState, selectedColor, setSelectedColor, spinPower, startCharging, releaseCharge, getButtonText, isSubmitting }} />
            </div>
        </div>
    );
}
