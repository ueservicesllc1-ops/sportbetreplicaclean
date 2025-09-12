'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { sportsData, type MatchEvent } from '@/lib/placeholder-data';
import { Button } from './ui/button';
import { useBetSlip } from '@/contexts/bet-slip-context';
import type { Bet } from '@/contexts/bet-slip-context';

export function Sportsbook() {
  const liveEvents = sportsData
    .flatMap((s) => s.leagues)
    .flatMap((l) => l.events)
    .filter((e) => e.time === 'En Vivo');
  const upcomingEvents = sportsData
    .flatMap((s) => s.leagues)
    .flatMap((l) => l.events)
    .filter((e) => e.time !== 'En Vivo');

  return (
    <Card>
      <CardContent className="p-2 md:p-4">
        <Tabs defaultValue="live">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="live">En Vivo</TabsTrigger>
            <TabsTrigger value="upcoming">Próximos</TabsTrigger>
          </TabsList>
          <TabsContent value="live" className="mt-4">
            <EventList events={liveEvents} />
          </TabsContent>
          <TabsContent value="upcoming" className="mt-4">
            <EventList events={upcomingEvents} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function EventList({ events }: { events: MatchEvent[] }) {
  if (events.length === 0) {
    return <p className="text-center text-muted-foreground">No hay eventos disponibles.</p>
  }
  return (
    <div className="space-y-4">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}

function EventCard({ event }: { event: MatchEvent }) {
  const { addBet, bets } = useBetSlip();

  const handleAddBet = (market: '1' | 'X' | '2') => {
    const selection = market === '1' ? event.teamA : market === '2' ? event.teamB : 'Empate';
    const bet: Bet = {
      id: `${event.id}_${market}`,
      event: `${event.teamA} vs ${event.teamB}`,
      market: market,
      selection,
      odd: event.odds[market],
    };
    addBet(bet);
  };

  const getButtonVariant = (market: '1' | 'X' | '2') => {
    return bets.some(b => b.id === `${event.id}_${market}`) ? 'secondary' : 'outline';
  }

  return (
    <Card className="bg-background">
      <CardHeader className="flex-row items-center justify-between p-3">
        <CardTitle className="font-headline text-base font-medium">
          {event.teamA} vs {event.teamB}
        </CardTitle>
        <span className={`text-xs ${event.time === 'En Vivo' ? 'font-bold text-destructive' : 'text-muted-foreground'}`}>
          {event.time}
        </span>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-2 p-3 pt-0">
        <Button variant={getButtonVariant('1')} className="flex-col h-auto" onClick={() => handleAddBet('1')}>
          <span>{event.teamA}</span>
          <span className="font-bold text-primary">{event.odds['1'].toFixed(2)}</span>
        </Button>
        <Button variant={getButtonVariant('X')} className="flex-col h-auto" onClick={() => handleAddBet('X')} disabled={event.odds['X'] === 0}>
           <span>Empate</span>
           <span className="font-bold text-primary">{event.odds['X'].toFixed(2)}</span>
        </Button>
        <Button variant={getButtonVariant('2')} className="flex-col h-auto" onClick={() => handleAddBet('2')}>
           <span>{event.teamB}</span>
           <span className="font-bold text-primary">{event.odds['2'].toFixed(2)}</span>
        </Button>
      </CardContent>
    </Card>
  );
}
