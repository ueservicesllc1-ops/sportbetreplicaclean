
'use client';

import Link from 'next/link';
import { mainNavSports } from '@/lib/placeholder-data';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/auth-context';
import { Shield } from 'lucide-react';

export function MainNav() {
  const { isAdmin } = useAuth();
  return (
    <div className="border-b bg-card">
      <div className="w-full px-4 md:px-6">
        <ScrollArea className="whitespace-nowrap">
          <div className="flex items-center justify-center space-x-1 py-2">
            {mainNavSports.map((sport) => (
              <Link href={sport.href} key={sport.name} passHref>
                <Button variant="ghost" className="flex h-auto items-center gap-2 p-3">
                  <sport.icon className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">{sport.name}</span>
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
