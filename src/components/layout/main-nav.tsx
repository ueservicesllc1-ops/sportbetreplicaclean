import Link from 'next/link';
import { mainNavSports } from '@/lib/placeholder-data';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export function MainNav() {
  return (
    <div className="border-b bg-card">
      <div className="container px-2 md:px-4">
        <ScrollArea className="whitespace-nowrap">
          <div className="flex items-center justify-center space-x-1 py-2">
            {mainNavSports.map((sport) => (
              <Link href="#" key={sport.name} passHref>
                <Button variant="ghost" className="flex h-auto flex-col items-center gap-1 p-2">
                  <sport.icon className="h-6 w-6 text-primary" />
                  <span className="text-xs font-medium">{sport.name}</span>
                </Button>
              </Link>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>
      </div>
    </div>
  );
}
