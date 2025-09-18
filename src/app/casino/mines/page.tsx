
'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardTitle, CardHeader, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { placeMinesBet, cashOutMines, resolveMinesLoss } from './actions';
import { getMinesGameAssets } from '@/app/admin/game-assets/actions';
import { Loader2, ArrowLeft, Gem, Bomb, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

const GRID_SIZE = 25;
type GameState = 'betting' | 'playing' | 'busted';
type TileState = 'hidden' | 'gem' | 'mine';

const defaultAssets: Record<string, string> = {
    gem: '',
    mine: '',
};

function calculateMultiplier(gemsFound: number, mineCount: number): number {
  if (gemsFound === 0) return 1.0;
  const totalGems = GRID_SIZE - mineCount;
  if (gemsFound >= totalGems) return 10.0;
  const startingMultiplier = 1.05;
  if (gemsFound === 1) return startingMultiplier;
  const maxMultiplier = 10.0;
  const multiplierRange = maxMultiplier - startingMultiplier;
  const step = multiplierRange / (totalGems - 1);
  const multiplier = startingMultiplier + (step * (gemsFound - 1));
  return multiplier;
}

export default function MinesPage() {
    const [betAmount, setBetAmount] = useState('1.00');
    const [mineCount, setMineCount] = useState(10);
    const [gameState, setGameState] = useState<GameState>('betting');
    const [grid, setGrid] = useState<number[]>([]);
    const [revealedTiles, setRevealedTiles] = useState<boolean[]>(Array(GRID_SIZE).fill(false));
    const [gemsFound, setGemsFound] = useState(0);
    const [currentMultiplier, setCurrentMultiplier] = useState(1);
    const [nextMultiplier, setNextMultiplier] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [gameAssets, setGameAssets] = useState<Record<string, string>>(defaultAssets);
    const [assetsLoading, setAssetsLoading] = useState(true);

    const { user } = useAuth();
    const { toast } = useToast();

    const explosionSoundRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        explosionSoundRef.current = new Audio('https://cdn.pixabay.com/download/audio/2021/08/04/audio_12b0c7443c.mp3?filename=explosion-6805.mp3');
    }, []);

    useEffect(() => {
        const fetchAssets = async () => {
            setAssetsLoading(true);
            const assets = await getMinesGameAssets();
            setGameAssets({ ...defaultAssets, ...assets });
            setAssetsLoading(false);
        };
        fetchAssets();
    }, []);

    useEffect(() => {
        if (gameState === 'playing') {
            setCurrentMultiplier(calculateMultiplier(gemsFound, mineCount));
            setNextMultiplier(calculateMultiplier(gemsFound + 1, mineCount));
        }
    }, [gemsFound, mineCount, gameState]);

    const handleStartGame = async () => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'Debes iniciar sesión para apostar.' });
            return;
        }
        const amount = parseFloat(betAmount);
        if (isNaN(amount) || amount <= 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'Introduce un monto de apuesta válido.' });
            return;
        }

        setIsSubmitting(true);
        const result = await placeMinesBet(user.uid, amount, mineCount);

        if (result.success) {
            setGrid(result.grid);
            setGameState('playing');
            setRevealedTiles(Array(GRID_SIZE).fill(false));
            setGemsFound(0);
            setCurrentMultiplier(1);
            toast({ title: '¡Buena suerte!', description: `Apuesta de $${amount.toFixed(2)} iniciada. Encuentra las gemas.` });
        } else {
            toast({ variant: 'destructive', title: 'Error al apostar', description: result.error });
        }
        setIsSubmitting(false);
    };

    const handleTileClick = async (index: number) => {
        if (gameState !== 'playing' || revealedTiles[index]) return;

        const newRevealedTiles = [...revealedTiles];
        newRevealedTiles[index] = true;
        setRevealedTiles(newRevealedTiles);

        if (grid[index] === 1) { // It's a mine
            if (explosionSoundRef.current) {
                explosionSoundRef.current.play().catch(console.error);
            }
            setGameState('busted');
            const penaltyAmount = parseFloat(betAmount) * currentMultiplier;
            if (user) {
                await resolveMinesLoss(user.uid, penaltyAmount);
            }
            toast({
                variant: 'destructive',
                title: '¡BOOM!',
                description: `Encontraste una mina. Penalización: -$${penaltyAmount.toFixed(2)}.`,
            });
        } else { // It's a gem
            setGemsFound(prev => prev + 1);
        }
    };

    const handleCashOut = async () => {
        if (gameState !== 'playing' || gemsFound === 0 || !user) return;
        
        const amount = parseFloat(betAmount);
        const winnings = amount * currentMultiplier;

        if (winnings <= amount) {
            toast({ variant: "destructive", title: "No se puede retirar", description: "La ganancia debe ser mayor a la apuesta inicial." });
            return;
        }

        setIsSubmitting(true);
        const result = await cashOutMines(user.uid, amount, winnings);
        setIsSubmitting(false);

        if (result.success) {
            toast({ title: '¡Ganaste!', description: `Has retirado $${winnings.toFixed(2)}.`, className: 'bg-green-600 border-green-600 text-white' });
            setGameState('betting');
        } else {
            toast({ variant: 'destructive', title: 'Error al retirar', description: result.error });
        }
    };
    
    const handlePlayAgain = () => {
        setGameState('betting');
        setGemsFound(0);
        setCurrentMultiplier(1);
    }
    
    const getTileState = (index: number): TileState => {
        if (!revealedTiles[index]) return 'hidden';
        return grid[index] === 1 ? 'mine' : 'gem';
    }

    const renderTileContent = (index: number, tileState: TileState) => {
        if (tileState === 'gem') {
            return gameAssets.gem ? <Image src={gameAssets.gem} alt="Gem" fill sizes="48px" className="object-cover" /> : <Gem className="h-2/3 w-2/3 text-primary" />;
        }
        if (tileState === 'mine') {
            return gameAssets.mine ? <Image src={gameAssets.mine} alt="Mine" fill sizes="48px" className="object-cover" /> : <Bomb className="h-2/3 w-2/3 text-white" />;
        }
        if (gameState === 'busted' && !revealedTiles[index]) {
            const isMine = grid[index] === 1;
            const asset = isMine ? gameAssets.mine : gameAssets.gem;
            const Icon = isMine ? Bomb : Gem;
            const className = isMine ? 'text-white/50' : 'text-primary/30';
            return asset ? <Image src={asset} alt={isMine ? 'Mine' : 'Gem'} fill sizes="48px" className="object-cover opacity-30" /> : <Icon className={`h-2/3 w-2/3 ${className}`} />;
        }
        return null;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Bomb className="h-8 w-8 text-primary" />
                    <h1 className="text-3xl font-bold tracking-tight">Campo Minado</h1>
                </div>
                <Button asChild size="lg">
                    <Link href="/casino">
                        <ArrowLeft className="mr-2 h-5 w-5" />
                        Volver a Juegos
                    </Link>
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Configura tu Juego</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className='space-y-2'>
                            <Label>Monto de Apuesta</Label>
                             <div className="flex gap-2">
                                <Input type="number" value={betAmount} onChange={(e) => setBetAmount(e.target.value)} placeholder="1.00" className='text-base font-bold' disabled={gameState === 'playing'} />
                                <Button variant="outline" onClick={() => setBetAmount((p) => (parseFloat(p) / 2).toFixed(2))} disabled={gameState === 'playing'}>½</Button>
                                <Button variant="outline" onClick={() => setBetAmount((p) => (parseFloat(p) * 2).toFixed(2))} disabled={gameState === 'playing'}>2x</Button>
                            </div>
                        </div>
                        <div className='space-y-3'>
                            <Label htmlFor='mine-count'>Número de Minas: <span className='font-bold text-primary'>{mineCount}</span></Label>
                            <Slider id='mine-count' value={[mineCount]} onValueChange={(value) => setMineCount(value[0])} min={1} max={24} step={1} disabled={gameState === 'playing'} />
                        </div>
                        {gameState === 'betting' && (
                            <Button size="lg" className="w-full h-12 text-lg" onClick={handleStartGame} disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Apostar
                            </Button>
                        )}
                        {gameState === 'playing' && (
                             <Button size="lg" className="w-full h-12 text-lg bg-yellow-500 hover:bg-yellow-600 text-black" onClick={handleCashOut} disabled={isSubmitting || gemsFound === 0 || parseFloat(betAmount) * currentMultiplier <= parseFloat(betAmount) }>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Retirar ${(parseFloat(betAmount) * currentMultiplier).toFixed(2)}
                            </Button>
                        )}
                        {gameState === 'busted' && ( <Button size="lg" className="w-full h-12 text-lg" onClick={handlePlayAgain}> Jugar de Nuevo </Button> )}
                        <div className="text-center bg-secondary p-3 rounded-md space-y-2">
                            <div className='grid grid-cols-2 gap-2'>
                                <div> <p className="text-sm text-muted-foreground">Posible Ganancia</p> <p className="text-xl font-bold text-green-400"> ${(parseFloat(betAmount) * currentMultiplier).toFixed(2)} </p> </div>
                                <div> <p className="text-sm text-muted-foreground">Posible Pérdida</p> <p className="text-xl font-bold text-red-500"> -${(parseFloat(betAmount) * currentMultiplier).toFixed(2)} </p> </div>
                            </div>
                            <div className="text-xs text-amber-500/80 font-semibold flex items-center justify-center gap-1 border-t border-border pt-2">
                                <AlertTriangle className='h-3 w-3' /> ¡Atención! Una pérdida cuesta el PREMIO POTENCIAL.
                            </div>
                        </div>
                         <div className='grid grid-cols-2 gap-2 text-center'>
                            <Alert variant="default"> <AlertTitle>Multiplicador Actual</AlertTitle> <AlertDescription className="text-lg font-bold">{currentMultiplier.toFixed(2)}x</AlertDescription> </Alert>
                             <Alert variant="default"> <AlertTitle>Próxima Gema</AlertTitle> <AlertDescription className="text-lg font-bold text-green-400">{nextMultiplier.toFixed(2)}x</AlertDescription> </Alert>
                        </div>
                    </CardContent>
                </Card>
                <div className="lg:col-span-2 flex items-center justify-center p-4 bg-secondary/30 rounded-lg">
                    {assetsLoading ? (
                        <div className="grid grid-cols-5 gap-2 w-full max-w-md aspect-square">
                            {Array.from({ length: GRID_SIZE }).map((_, index) => ( <Skeleton key={index} className="aspect-square rounded-md" /> ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-5 gap-2 w-full max-w-md aspect-square">
                            {Array.from({ length: GRID_SIZE }).map((_, index) => {
                                const tileState = getTileState(index);
                                return (
                                    <button
                                        key={index}
                                        onClick={() => handleTileClick(index)}
                                        disabled={gameState !== 'playing' || revealedTiles[index]}
                                        className={cn(
                                            "aspect-square rounded-md flex items-center justify-center transition-all duration-300 relative overflow-hidden",
                                            gameState === 'playing' && !revealedTiles[index] && "bg-background hover:bg-primary/20 cursor-pointer",
                                            gameState !== 'playing' && !revealedTiles[index] && "bg-background/50",
                                            (gameState === 'busted' || revealedTiles[index]) && "bg-secondary",
                                            tileState === 'gem' && 'animate-in fade-in zoom-in',
                                            tileState === 'mine' && 'bg-red-500/30 animate-in fade-in zoom-in',
                                        )}
                                    >
                                        {renderTileContent(index, tileState)}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
