
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { sportsData } from '@/lib/placeholder-data';
import { Button } from './ui/button';
import { SoccerBallIcon } from '@/components/icons/soccer-ball-icon';

export function SportsSidebar() {
  return (
    <div className="flex h-full flex-col">
      <div className="p-2">
        <h2 className="p-2 font-headline text-lg font-semibold tracking-tight">Deportes</h2>
      </div>
      <div className="flex-grow overflow-y-auto">
        <Accordion type="single" collapsible defaultValue='Fútbol' className="w-full">
          {sportsData.map((sport) => (
            <AccordionItem value={sport.name} key={sport.name}>
              <AccordionTrigger className="px-4 py-2 text-sm font-medium hover:no-underline">
                <div className="flex items-center gap-3">
                  <sport.icon className="h-5 w-5 text-primary" />
                  <span>{sport.name}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="pl-6">
                  {sport.leagues.map((league) => (
                    <li key={league.name}>
                      <Button variant="link" className="h-auto p-1.5 text-muted-foreground hover:text-primary">
                        {league.name}
                      </Button>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
