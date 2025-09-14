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
      <div className="flex h-screen flex-col bg-background">
        <Header />
        <MainNav />
        <SecondaryNav />
        <div className="container mx-auto flex-1 overflow-hidden px-2 md:px-4">
          <div className="grid h-full grid-cols-1 items-start gap-4 lg:grid-cols-5">
            {/* Left Sidebar */}
            <aside className="hidden lg:col-span-1 lg:block h-full overflow-y-auto">
                <SportsSidebar />
            </aside>
            
            {/* Main Content */}
            <main className="col-span-1 h-full overflow-y-auto lg:col-span-3">
              <div className='space-y-4 py-4'>
                <PromotionsCarousel />
                <Sportsbook />
              </div>
            </main>

            {/* Right Sidebar */}
            <aside className="hidden lg:col-span-1 lg:block h-full overflow-y-auto">
                <BetSlip />
            </aside>
          </div>
        </div>
        <Footer />
      </div>
    </BetSlipProvider>
  );
}
