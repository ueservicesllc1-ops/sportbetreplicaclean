import { Header } from '@/components/layout/header';
import { MainNav } from '@/components/layout/main-nav';
import { Footer } from '@/components/layout/footer';
import { BetSlipProvider } from '@/contexts/bet-slip-context';
import { SecondaryNav } from '@/components/layout/secondary-nav';

export default function CasinoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BetSlipProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <MainNav />
        <SecondaryNav />
        <main className="w-full flex-grow px-4 py-4 md:px-6">
          {children}
        </main>
        <Footer />
      </div>
    </BetSlipProvider>
  );
}
