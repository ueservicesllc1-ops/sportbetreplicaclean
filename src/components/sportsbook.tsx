

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
import { BarChartHorizontal, Loader2 } from 'lucide-react';
import { Badge } from './ui/badge';
import { apiSports } from '@/lib/sports-data';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

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
            <CardContent className="p-0 md:p-0">
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
                     <Tabs defaultValue={hasUpcomingEvents ? "upcoming" : "live"} className='mt-0' id="en-vivo">
                        <TabsList className="grid w-full grid-cols-2 rounded-none">
                            <TabsTrigger value="live" disabled={!hasLiveEvents} className="rounded-none">En Vivo</TabsTrigger>
                            <TabsTrigger value="upcoming" disabled={!hasUpcomingEvents} className="rounded-none">Próximos</TabsTrigger>
                        </TabsList>
                        <TabsContent value="live" className="mt-0">
                            <EventTable events={liveEvents} isLive={true} sportTitle={sport.title} />
                        </TabsContent>
                        <TabsContent value="upcoming" className="mt-0">
                            <EventTable events={upcomingEvents} isLive={false} sportTitle={sport.title} />
                        </TabsContent>
                    </Tabs>
                )}
            </CardContent>
        </Card>
    );
}

function EventTable({ events, isLive, sportTitle }: { events: ApiMatchEvent[], isLive: boolean, sportTitle: string }) {
  if (events.length === 0) {
    return <p className="text-center text-muted-foreground py-10">No hay eventos {isLive ? 'en vivo' : 'próximos'} disponibles.</p>
  }
  
  return (
    <div className='overflow-x-auto'>
        <Table className='min-w-[600px]'>
            <TableHeader>
                <TableRow className='hover:bg-transparent'>
                    <TableHead className='w-[80px] text-center'>Hora</TableHead>
                    <TableHead className='w-2/5'>Evento</TableHead>
                    <TableHead className='text-center'>1</TableHead>
                    <TableHead className='text-center'>X</TableHead>
                    <TableHead className='text-center'>2</TableHead>
                    <TableHead className='w-[60px] text-center'>Más</TableHead>
                </TableRow>
            </TableHeader>
             <TableBody>
                <TooltipProvider>
                    {events.map((event) => (
                        <EventRow key={event.id} event={event} isLive={isLive} sportTitle={sportTitle}/>
                    ))}
                </TooltipProvider>
            </TableBody>
        </Table>
    </div>
  );
}

function EventRow({ event, isLive, sportTitle }: { event: ApiMatchEvent, isLive: boolean, sportTitle: string }) {
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
    let selection: string;
    let odd: number;
    
    switch (market) {
        case '1':
            selection = event.home_team;
            odd = homeOdd;
            break;
        case '2':
            selection = event.away_team;
            odd = awayOdd;
            break;
        case 'X':
            selection = 'Empate';
            odd = drawOdd;
            break;
    }
    
    if (odd === 0) return;

    const bet: Bet = {
      id: `${event.id}_h2h`, // Use a consistent market key for replacement
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
  
  const hasOdds = homeOdd > 0 || awayOdd > 0 || drawOdd > 0;
  
  const eventDate = new Date(event.commence_time);
  const formattedTime = eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const isToday = new Date().toDateString() === eventDate.toDateString();

  // --- START: Simulated live data ---
  const [liveData, setLiveData] = useState<{ minute: number; score: [number, number]; half: string } | null>(null);

  useEffect(() => {
    if (isLive) {
      // Simulate initial data
      const startMinute = Math.floor(Math.random() * 80) + 1;
      const startScore: [number, number] = [Math.floor(Math.random() * 3), Math.floor(Math.random() * 3)];
      
      setLiveData({
        minute: startMinute,
        score: startScore,
        half: startMinute > 45 ? '2da Mitad' : '1ra Mitad',
      });

      // Optional: simulate updates
      const interval = setInterval(() => {
        setLiveData(prev => {
          if (!prev || prev.minute >= 90) {
            clearInterval(interval);
            return prev;
          }
          return { ...prev, minute: prev.minute + 1 };
        });
      }, 60 * 1000); // Update minute every minute

      return () => clearInterval(interval);
    }
  }, [isLive, event.id]);
  // --- END: Simulated live data ---

  return (
    <TableRow className='text-sm'>
        <TableCell className="text-center font-medium">
            {isLive && liveData ? (
                 <div className='flex flex-col items-center'>
                    <div className='flex items-center gap-1.5'>
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                        <span>{liveData.minute}'</span>
                    </div>
                    <span className='text-xs text-muted-foreground'>{liveData.half}</span>
                </div>
            ) : (
                <div className='flex flex-col items-center'>
                    <span>{isToday ? 'Hoy' : eventDate.toLocaleDateString([], { day: '2-digit', month: '2-digit' })}</span>
                    <span className='text-xs text-muted-foreground'>{formattedTime}</span>
                </div>
            )}
        </TableCell>
        <TableCell>
            <div className='flex flex-col'>
                <span className='text-xs text-muted-foreground'>{sportTitle.split(' - ')[1]}</span>
                {isLive && liveData ? (
                    <div className='flex items-center gap-2 font-bold'>
                        <span>{event.home_team}</span>
                        <span className='text-primary'>{liveData.score[0]}</span>
                        <span>-</span>
                        <span className='text-primary'>{liveData.score[1]}</span>
                        <span>{event.away_team}</span>
                    </div>
                ) : (
                    <p className='font-medium'>{event.home_team} vs {event.away_team}</p>
                )}
            </div>
        </TableCell>
        
        {hasOdds ? (
            <>
                <TableCell className='p-1 text-center'>
                    <Button variant={getButtonVariant(event.home_team)} size="sm" className="w-full max-w-[80px] justify-center px-2" onClick={() => handleAddBet('1')} disabled={homeOdd === 0}>
                        <span className="font-bold">{homeOdd.toFixed(2)}</span>
                    </Button>
                </TableCell>
                <TableCell className='p-1 text-center'>
                    <Button variant={getButtonVariant('Empate')} size="sm" className="w-full max-w-[80px] justify-center px-2" onClick={() => handleAddBet('X')} disabled={drawOdd === 0}>
                        <span className="font-bold">{drawOdd.toFixed(2)}</span>
                    </Button>
                </TableCell>
                <TableCell className='p-1 text-center'>
                    <Button variant={getButtonVariant(event.away_team)} size="sm" className="w-full max-w-[80px] justify-center px-2" onClick={() => handleAddBet('2')} disabled={awayOdd === 0}>
                        <span className="font-bold">{awayOdd.toFixed(2)}</span>
                    </Button>
                </TableCell>
            </>
        ) : (
            <TableCell colSpan={3} className='text-center text-muted-foreground text-xs'>
                Cuotas no disponibles
            </TableCell>
        )}
        <TableCell className='text-center'>
             <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={`/match/${event.id}`}>
                            <BarChartHorizontal className="h-5 w-5" />
                        </Link>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Ver más mercados</p>
                </TooltipContent>
            </Tooltip>
        </TableCell>
    </TableRow>
  );
}

