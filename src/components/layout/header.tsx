import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import Link from 'next/link';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { Menu, Ticket } from 'lucide-react';
import { SportsSidebar } from '../sports-sidebar';
import { BetSlip } from '../bet-slip';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
           <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SportsSidebar />
              </SheetContent>
            </Sheet>
          </div>
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Logo className="h-auto w-32" />
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Ticket className="h-6 w-6" />
                   <span className="sr-only">Toggle Bet Slip</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0">
                <BetSlip />
              </SheetContent>
            </Sheet>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <Button variant="ghost">ACCEDER</Button>
            <Button variant="default" className="bg-accent text-accent-foreground hover:bg-accent/90">
              REGISTRARSE
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
