
'use client';

import { useEffect, useState } from 'react';
import { getSportsOdds } from '@/lib/odds-api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Loader2, Star } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from './ui/carousel';
import { Button } from './ui/button';
import { useBetSlip } from '@/contexts/bet-slip-context';
import type { Bet } from '@/contexts/bet-slip-context';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface Bookmaker {
  key: string;
  title: string;
  markets: {
    key: string;
    outcomes: {
      name: string;
      price: number;
    }[];
  }[];
}

interface ApiMatchEvent {
  id: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  bookmakers: Bookmaker[];
}

export function FeaturedMatches() {
  const [events, setEvents] = useState<ApiMatchEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFeatured() {
      try {
        // Fetch from a popular league, e.g., Copa Sudamericana
        const odds = await getSportsOdds('soccer_copa_sudamericana');
        // Get the first 5 events as featured
        setEvents(odds.slice(0, 5));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(errorMessage);
        console.error('Failed to fetch featured matches:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchFeatured();
  }, []);

  if (loading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" />
                    <span>Partidos Destacados</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex justify-center items-center h-24">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </CardContent>
        </Card>
    );
  }

  if (error) {
     return (
        <Card>
             <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" />
                    <span>Partidos Destacados</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Alert variant="destructive">
                    <AlertTitle>Error al cargar partidos</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </CardContent>
        </Card>
     )
  }

  if (events.length === 0) {
    return null; // Don't render the component if there are no events
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-primary" />
          <span>Partidos Destacados</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2">
            {events.map((event) => (
              <CarouselItem key={event.id} className="pl-2 md:basis-1/2 lg:basis-1/3">
                <div className="p-1">
                  <FeaturedMatchCard event={event} />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className='-left-4' />
          <CarouselNext className='-right-4' />
        </Carousel>
      </CardContent>
    </Card>
  );
}

function FeaturedMatchCard({ event }: { event: ApiMatchEvent }) {
    const { addBet, bets } = useBetSlip();

    const bookmaker = event.bookmakers?.find(b => b.markets.some(m => m.key === 'h2h'));
    const h2hMarket = bookmaker?.markets.find(m => m.key === 'h2h');

    const getOdd = (teamName: string) => h2hMarket?.outcomes.find(o => o.name === teamName)?.price || 0;
    const getDrawOdd = () => h2hMarket?.outcomes.find(o => o.name === 'Draw')?.price || 0;

    const homeOdd = getOdd(event.home_team);
    const awayOdd = getOdd(event.away_team);
    const drawOdd = getDrawOdd();

    const handleAddBet = (market: '1' | 'X' | '2', selection: string, odd: number) => {
        if (odd === 0) return;
        const bet: Bet = {
            id: `${event.id}_h2h`,
            event: `${event.home_team} vs ${event.away_team}`,
            market: 'h2h',
            selection: selection,
            odd,
        };
        addBet(bet);
    };

    const getButtonVariant = (selectionName: string) => {
      const betId = `${event.id}_h2h`;
      return bets.some(b => b.id === betId && b.selection === selectionName) ? 'secondary' : 'outline';
    }

    const eventDate = new Date(event.commence_time);

    return (
        <div className="rounded-lg border bg-card text-card-foreground p-3 space-y-3">
            <div className="text-center text-xs text-muted-foreground">
                {eventDate.toLocaleDateString([], { month: 'short', day: 'numeric' })} - {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className='flex flex-col items-center justify-center text-sm font-medium text-center space-y-1'>
                <span>{event.home_team}</span>
                <span className='text-xs text-muted-foreground'>vs</span>
                <span>{event.away_team}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
                <Button variant={getButtonVariant(event.home_team)} size="sm" className="flex-col h-auto py-1" onClick={() => handleAddBet('1', event.home_team, homeOdd)} disabled={homeOdd === 0}>
                    <span className='text-xs font-normal'>1</span>
                    <span className="font-bold">{homeOdd.toFixed(2)}</span>
                </Button>
                <Button variant={getButtonVariant('Empate')} size="sm" className="flex-col h-auto py-1" onClick={() => handleAddBet('X', 'Empate', drawOdd)} disabled={drawOdd === 0}>
                    <span className='text-xs font-normal'>X</span>
                    <span className="font-bold">{drawOdd.toFixed(2)}</span>
                </Button>
                <Button variant={getButtonVariant(event.away_team)} size="sm" className="flex-col h-auto py-1" onClick={() => handleAddBet('2', event.away_team, awayOdd)} disabled={awayOdd === 0}>
                    <span className='text-xs font-normal'>2</span>
                    <span className="font-bold">{awayOdd.toFixed(2)}</span>
                </Button>
            </div>
        </div>
    )
}
