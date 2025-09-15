
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardTitle, CardHeader, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { placeMinesBet, cashOutMines } from './actions';
import { Loader2, ArrowLeft, Gem, Bomb, WandSparkles } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const GRID_SIZE = 25;
type GameState = 'betting' | 'playing' | 'busted';
type TileState = 'hidden' | 'gem' | 'mine';

// --- Helper Functions ---
function calculateMultiplier(gemsFound: number, mineCount: number): number {
  if (gemsFound === 0) return 1;
  const safeTiles = GRID_SIZE - mineCount;
  let multiplier = 1;
  for (let i = 0; i < gemsFound; i++) {
    multiplier *= (GRID_SIZE - i) / (safeTiles - i);
  }
  return Math.max(1, multiplier * 0.80); // Apply a 20% house edge
}

export default function MinesPage() {
    const [betAmount, setBetAmount] = useState('1.00');
    const [mineCount, setMineCount] = useState(5);
    const [gameState, setGameState] = useState<GameState>('betting');
    const [grid, setGrid] = useState<number[]>([]);
    const [revealedTiles, setRevealedTiles] = useState<boolean[]>(Array(GRID_SIZE).fill(false));
    const [gemsFound, setGemsFound] = useState(0);
    const [currentMultiplier, setCurrentMultiplier] = useState(1);
    const [nextMultiplier, setNextMultiplier] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { user } = useAuth();
    const { toast } = useToast();

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
        setIsSubmitting(false);

        if (result.success) {
            setGrid(result.grid);
            setGameState('playing');
            setRevealedTiles(Array(GRID_SIZE).fill(false));
            setGemsFound(0);
            setCurrentMultiplier(1);
            toast({ title: '¡Buena suerte!', description: `Apuesta de $${amount.toFixed(2)} realizada. Encuentra las gemas.` });
        } else {
            toast({ variant: 'destructive', title: 'Error al apostar', description: result.error });
        }
    };

    const handleTileClick = (index: number) => {
        if (gameState !== 'playing' || revealedTiles[index]) {
            return;
        }

        const newRevealedTiles = [...revealedTiles];
        newRevealedTiles[index] = true;
        setRevealedTiles(newRevealedTiles);

        if (grid[index] === 1) { // It's a mine
            setGameState('busted');
            toast({
                variant: 'destructive',
                title: '¡BOOM!',
                description: `Encontraste una mina. Has perdido $${betAmount}.`,
            });
        } else { // It's a gem
            setGemsFound(prev => prev + 1);
        }
    };

    const handleCashOut = async () => {
        if (gameState !== 'playing' || gemsFound === 0) return;
        
        const winnings = parseFloat(betAmount) * currentMultiplier;
        setIsSubmitting(true);
        const result = await cashOutMines(user.uid, winnings);
        setIsSubmitting(false);

        if (result.success) {
            toast({
                title: '¡Ganaste!',
                description: `Has retirado $${winnings.toFixed(2)}.`,
                className: 'bg-green-600 border-green-600 text-white'
            });
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
                {/* Control Panel */}
                <Card>
                    <CardHeader>
                        <CardTitle>Configura tu Juego</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className='space-y-2'>
                            <Label>Monto de Apuesta</Label>
                             <div className="flex gap-2">
                                <Input 
                                    type="number" 
                                    value={betAmount} 
                                    onChange={(e) => setBetAmount(e.target.value)}
                                    placeholder="1.00"
                                    className='text-base font-bold'
                                    disabled={gameState === 'playing'}
                                />
                                <Button variant="outline" onClick={() => setBetAmount((p) => (parseFloat(p) / 2).toFixed(2))} disabled={gameState === 'playing'}>½</Button>
                                <Button variant="outline" onClick={() => setBetAmount((p) => (parseFloat(p) * 2).toFixed(2))} disabled={gameState === 'playing'}>2x</Button>
                            </div>
                        </div>

                         <div className='space-y-3'>
                            <div className='flex justify-between items-center'>
                                <Label>Número de Minas</Label>
                                <span className='font-bold text-primary'>{mineCount}</span>
                            </div>
                            <Slider
                                value={[mineCount]}
                                onValueChange={(value) => setMineCount(value[0])}
                                min={1}
                                max={24}
                                step={1}
                                disabled={gameState === 'playing'}
                            />
                        </div>

                        {gameState === 'betting' && (
                            <Button size="lg" className="w-full h-12 text-lg" onClick={handleStartGame} disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Apostar
                            </Button>
                        )}

                        {gameState === 'playing' && (
                             <Button size="lg" className="w-full h-12 text-lg bg-yellow-500 hover:bg-yellow-600 text-black" onClick={handleCashOut} disabled={isSubmitting || gemsFound === 0}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Retirar ${(parseFloat(betAmount) * currentMultiplier).toFixed(2)}
                            </Button>
                        )}
                        
                        {gameState === 'busted' && (
                             <Button size="lg" className="w-full h-12 text-lg" onClick={handlePlayAgain}>
                                Jugar de Nuevo
                            </Button>
                        )}

                        <Alert variant="default" className="text-center">
                            <AlertTitle className="text-base">Gemas Encontradas</AlertTitle>
                            <AlertDescription className="text-2xl font-bold text-primary">{gemsFound}</AlertDescription>
                        </Alert>
                         <div className='grid grid-cols-2 gap-2 text-center'>
                            <Alert variant="default">
                                <AlertTitle>Multiplicador Actual</AlertTitle>
                                <AlertDescription className="text-lg font-bold">{currentMultiplier.toFixed(2)}x</AlertDescription>
                            </Alert>
                             <Alert variant="default">
                                <AlertTitle>Próxima Gema</AlertTitle>
                                <AlertDescription className="text-lg font-bold text-green-400">{nextMultiplier.toFixed(2)}x</AlertDescription>
                            </Alert>
                        </div>

                    </CardContent>
                </Card>

                {/* Game Area */}
                <div className="lg:col-span-2 flex items-center justify-center p-4 bg-secondary/30 rounded-lg">
                    <div className="grid grid-cols-5 gap-2 w-full max-w-md aspect-square">
                        {Array.from({ length: GRID_SIZE }).map((_, index) => {
                            const tileState = getTileState(index);
                            return (
                                <button
                                    key={index}
                                    onClick={() => handleTileClick(index)}
                                    disabled={gameState !== 'playing' || revealedTiles[index]}
                                    className={cn(
                                        "aspect-square rounded-md flex items-center justify-center transition-all duration-300",
                                        gameState === 'playing' && !revealedTiles[index] && "bg-background hover:bg-primary/20 cursor-pointer",
                                        gameState !== 'playing' && !revealedTiles[index] && "bg-background/50",
                                        (gameState === 'busted' || revealedTiles[index]) && "bg-secondary",
                                        tileState === 'gem' && 'animate-in fade-in zoom-in',
                                        tileState === 'mine' && 'bg-red-500/30 animate-in fade-in zoom-in',
                                    )}
                                >
                                    {tileState === 'gem' && <Gem className="h-2/3 w-2/3 text-primary" />}
                                    {tileState === 'mine' && <Bomb className="h-2/3 w-2/3 text-white" />}
                                    
                                    {/* When game is over, show unrevealed tiles */}
                                    {gameState === 'busted' && !revealedTiles[index] && (
                                        <>
                                            {grid[index] === 1 
                                                ? <Bomb className="h-2/3 w-2/3 text-white/50" />
                                                : <Gem className="h-2/3 w-2/3 text-primary/30" />
                                            }
                                        </>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
