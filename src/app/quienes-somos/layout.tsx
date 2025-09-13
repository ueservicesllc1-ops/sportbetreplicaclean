
import { Header } from '@/components/layout/header';
import { MainNav } from '@/components/layout/main-nav';
import { Footer } from '@/components/layout/footer';
import { BetSlipProvider } from '@/contexts/bet-slip-context';
import { SecondaryNav } from '@/components/layout/secondary-nav';

export default function QuienesSomosLayout({
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
        <main className="container mx-auto flex-grow px-2 py-8 md:px-4">
          {children}
        </main>
        <Footer />
      </div>
    </BetSlipProvider>
  );
}
