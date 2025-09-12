'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import { apiSports } from '@/lib/sports-data';
import Link from 'next/link';

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

interface SportData {
    key: string;
    title: string;
    events: ApiMatchEvent[];
    error: string | null;
}

export function Sportsbook() {
  const [sportsData, setSportsData] = useState<SportData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAllOdds() {
      setLoading(true);
      const allSportsPromises = apiSports.map(async (sport) => {
        try {
          const odds = await getSportsOdds(sport.key);
          return { key: sport.key, title: sport.title, events: odds, error: null };
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
          return { key: sport.key, title: sport.title, events: [], error: errorMessage };
        }
      });

      const results = await Promise.all(allSportsPromises);
      setSportsData(results);
      setLoading(false);
    }
    fetchAllOdds();
  }, []);


  if (loading) {
    return (
        <div className="flex justify-center items-center h-60">
           <Loader2 className="h-8 w-8 animate-spin text-primary" />
       </div>
   );
  }

  return (
    <div className="space-y-4">
      {sportsData.map(sport => (
        <SportSection key={sport.key} sport={sport} />
      ))}
    </div>
  );
}

function SportSection({ sport }: { sport: SportData }) {
    const [liveEvents, setLiveEvents] = useState<ApiMatchEvent[]>([]);
    const [upcomingEvents, setUpcomingEvents] = useState<ApiMatchEvent[]>([]);

    useEffect(() => {
        const now = new Date();
        const live = sport.events.filter(e => new Date(e.commence_time) <= now);
        const upcoming = sport.events.filter(e => new Date(e.commence_time) > now);
        setLiveEvents(live);
        setUpcomingEvents(upcoming);
    }, [sport.events]);

    const hasEvents = sport.events.length > 0;
    const hasLiveEvents = liveEvents.length > 0;
    const hasUpcomingEvents = upcomingEvents.length > 0;
    
    // Quick mapping for anchor IDs
    const sportAnchorId: { [key: string]: string } = {
        'Fútbol': 'futbol',
        'Tenis': 'tenis',
        'Baloncesto': 'baloncesto',
        'e-Sports': 'esports'
    };
    const titleKey = Object.keys(sportAnchorId).find(key => sport.title.includes(key));
    const anchorId = titleKey ? sportAnchorId[titleKey] : '';


    return (
        <Card id={anchorId}>
            <CardHeader>
                <CardTitle>{sport.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-2 md:p-4">
                {sport.error && (
                    <div className="p-4">
                        <Alert variant="destructive">
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{sport.error}</AlertDescription>
                        </Alert>
                    </div>
                )}

                {!sport.error && !hasEvents && (
                    <div className="py-10 text-center text-muted-foreground">
                        <p>No hay eventos o cuotas disponibles para este deporte en este momento.</p>
                        <p className="text-xs">Esto puede deberse a limitaciones del plan de la API.</p>
                    </div>
                )}
                
                {!sport.error && hasEvents && (
                     <Tabs defaultValue={hasUpcomingEvents ? "upcoming" : "live"} className='mt-4' id="en-vivo">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="live" disabled={!hasLiveEvents}>En Vivo</TabsTrigger>
                            <TabsTrigger value="upcoming" disabled={!hasUpcomingEvents}>Próximos</TabsTrigger>
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
  const [showAll, setShowAll] = useState(false);
  const initialLimit = 5;

  if (events.length === 0) {
    return <p className="text-center text-muted-foreground py-10">No hay eventos {isLive ? 'en vivo' : 'próximos'} disponibles.</p>
  }
  
  const displayedEvents = showAll ? events : events.slice(0, initialLimit);

  return (
    <div className="space-y-4">
      {displayedEvents.map((event) => (
        <EventCard key={event.id} event={event} isLive={isLive} />
      ))}
      {events.length > initialLimit && !showAll && (
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => setShowAll(true)}
        >
          Ver más ({events.length - initialLimit})
        </Button>
      )}
    </div>
  );
}

function EventCard({ event, isLive }: { event: ApiMatchEvent, isLive: boolean }) {
  const { addBet, bets } = useBetSlip();

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
  
  const eventDate = new Date(event.commence_time);
  const formattedTime = eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formattedDate = eventDate.toLocaleDateString([], { day: '2-digit', month: 'short' });
  const isToday = new Date().toDateString() === eventDate.toDateString();


  return (
    <Card className="bg-card">
       <div className="flex items-center justify-between p-3 border-b">
         <Link href={`/match/${event.id}`} className="hover:text-primary transition-colors">
            <p className="font-headline text-base font-medium">
            {event.home_team} vs {event.away_team}
            </p>
        </Link>
        <Badge variant={isLive ? 'destructive' : 'secondary'}>
            {isLive ? 'En Vivo' : `${isToday ? '' : formattedDate + ' - '}${formattedTime}`}
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
