import { Header } from '@/components/layout/header';
import { MainNav } from '@/components/layout/main-nav';
import { PromotionsCarousel } from '@/components/promotions-carousel';
import { SportsSidebar } from '@/components/sports-sidebar';
import { Sportsbook } from '@/components/sportsbook';
import { BetSlip } from '@/components/bet-slip';
import { BetSlipProvider } from '@/contexts/bet-slip-context';
import { Footer } from '@/components/layout/footer';
import { SecondaryNav } from '@/components/layout/secondary-nav';

export default function Home() {
  return (
    <BetSlipProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <MainNav />
        <SecondaryNav />
        <main className="container mx-auto flex-grow px-2 py-4 md:px-4">
          <PromotionsCarousel />
          <div className="mt-4 grid grid-cols-1 items-start gap-4 lg:grid-cols-5">
            <aside className="hidden lg:col-span-1 lg:block">
              <div className="sticky top-20">
                <SportsSidebar />
              </div>
            </aside>
            <div className="col-span-1 lg:col-span-3">
              <Sportsbook />
            </div>
            <aside className="hidden lg:col-span-1 lg:block">
              <div className="sticky top-20">
                <BetSlip />
              </div>
            </aside>
          </div>
        </main>
        <Footer />
      </div>
    </BetSlipProvider>
  );
}
