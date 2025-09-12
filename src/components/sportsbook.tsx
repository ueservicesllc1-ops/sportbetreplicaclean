'use client';

import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from './ui/button';
import { useBetSlip } from '@/contexts/bet-slip-context';
import type { Bet } from '@/contexts/bet-slip-context';
import { useEffect, useState } from 'react';
import { getSportsOdds } from '@/lib/odds-api';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Loader2 } from 'lucide-react';
import { Badge } from './ui/badge';
import { SportSelector } from './sport-selector';

interface Bookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: {
    key: string;
    last_update: string;
    outcomes: {
      name: string;
      price: number;
    }[];
  }[];
}

interface ApiMatchEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Bookmaker[];
}

const DEFAULT_SPORT_KEY = 'soccer_spain_la_liga';

export function Sportsbook() {
  const [events, setEvents] = useState<ApiMatchEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSport, setSelectedSport] = useState(DEFAULT_SPORT_KEY);
  
  const [liveEvents, setLiveEvents] = useState<ApiMatchEvent[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<ApiMatchEvent[]>([]);

  useEffect(() => {
    async function fetchOdds() {
      try {
        setLoading(true);
        setError(null);
        setEvents([]);
        setLiveEvents([]);
        setUpcomingEvents([]);
        const odds = await getSportsOdds(selectedSport);
        setEvents(odds);
        
        const now = new Date();
        const live = odds.filter(e => new Date(e.commence_time) <= now);
        const upcoming = odds.filter(e => new Date(e.commence_time) > now);

        setLiveEvents(live);
        setUpcomingEvents(upcoming);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setLoading(false);
      }
    }
    fetchOdds();
  }, [selectedSport]);


  return (
    <Card>
      <CardContent className="p-2 md:p-4">
        <SportSelector value={selectedSport} onChange={setSelectedSport} />
        {loading && (
             <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )}
        {error && !loading && (
             <div className="p-4">
                <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        )}
        {!loading && !error && (
            <Tabs defaultValue="upcoming" className='mt-4'>
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="live">En Vivo</TabsTrigger>
                <TabsTrigger value="upcoming">Próximos</TabsTrigger>
            </TabsList>
            <TabsContent value="live" className="mt-4">
                <EventList events={liveEvents} isLive={true} />
            </TabsContent>
            <TabsContent value="upcoming" className="mt-4">
                <EventList events={upcomingEvents} isLive={false} />
            </TabsContent>
            </Tabs>
        )}
      </CardContent>
    </Card>
  );
}

function EventList({ events, isLive }: { events: ApiMatchEvent[], isLive: boolean }) {
  if (events.length === 0) {
    return <p className="text-center text-muted-foreground py-10">No hay eventos disponibles.</p>
  }
  return (
    <div className="space-y-4">
      {events.map((event) => (
        <EventCard key={event.id} event={event} isLive={isLive} />
      ))}
    </div>
  );
}

function EventCard({ event, isLive }: { event: ApiMatchEvent, isLive: boolean }) {
  const { addBet, bets } = useBetSlip();

  // Find the first bookmaker with h2h odds
  const bookmaker = event.bookmakers?.find(b => b.markets.some(m => m.key === 'h2h'));
  const h2hMarket = bookmaker?.markets.find(m => m.key === 'h2h');

  const getOdd = (teamName: string) => {
    const outcome = h2hMarket?.outcomes.find(o => o.name === teamName);
    return outcome?.price || 0;
  }

  const getDrawOdd = () => {
     const outcome = h2hMarket?.outcomes.find(o => o.name === 'Draw');
    return outcome?.price || 0;
  }

  const homeOdd = getOdd(event.home_team);
  const awayOdd = getOdd(event.away_team);
  const drawOdd = getDrawOdd();

  const handleAddBet = (market: '1' | 'X' | '2') => {
    const selection = market === '1' ? event.home_team : market === '2' ? event.away_team : 'Empate';
    const odd = market === '1' ? homeOdd : market === '2' ? awayOdd : drawOdd;
    
    if (odd === 0) return;

    const bet: Bet = {
      id: `${event.id}_${market}`,
      event: `${event.home_team} vs ${event.away_team}`,
      market: market,
      selection,
      odd,
    };
    addBet(bet);
  };

  const getButtonVariant = (market: '1' | 'X' | '2') => {
    return bets.some(b => b.id === `${event.id}_${market}`) ? 'secondary' : 'outline';
  }
  
  const hasOdds = homeOdd > 0 || awayOdd > 0 || drawOdd > 0;

  return (
    <Card className="bg-card">
       <div className="flex items-center justify-between p-3 border-b">
        <p className="font-headline text-base font-medium">
          {event.home_team} vs {event.away_team}
        </p>
        <Badge variant={isLive ? 'destructive' : 'secondary'}>
          {isLive ? 'En Vivo' : new Date(event.commence_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Badge>
      </div>
      {hasOdds ? (
        <CardContent className="grid grid-cols-3 gap-2 p-3">
            <Button variant={getButtonVariant('1')} className="flex-col h-auto" onClick={() => handleAddBet('1')} disabled={homeOdd === 0}>
            <span>{event.home_team}</span>
            <span className="font-bold text-primary">{homeOdd.toFixed(2)}</span>
            </Button>
            <Button variant={getButtonVariant('X')} className="flex-col h-auto" onClick={() => handleAddBet('X')} disabled={drawOdd === 0}>
            <span>Empate</span>
            <span className="font-bold text-primary">{drawOdd.toFixed(2)}</span>
            </Button>
            <Button variant={getButtonVariant('2')} className="flex-col h-auto" onClick={() => handleAddBet('2')} disabled={awayOdd === 0}>
            <span>{event.away_team}</span>
            <span className="font-bold text-primary">{awayOdd.toFixed(2)}</span>
            </Button>
        </CardContent>
      ) : (
        <CardContent className="p-3 text-center text-sm text-muted-foreground">
            No hay cuotas disponibles para este evento.
        </CardContent>
      )}
    </Card>
  );
}
