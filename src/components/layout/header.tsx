
'use client';

import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import Link from 'next/link';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { Menu, Ticket, User as UserIcon, Wallet } from 'lucide-react';
import { SportsSidebar } from '../sports-sidebar';
import { BetSlip } from '../bet-slip';
import { useAuth } from '@/contexts/auth-context';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { AuthForm } from '@/components/auth/auth-form';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { WalletSheet } from '../wallet/wallet-sheet';

function UserBalance() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          setBalance(doc.data().balance);
        }
      });
      return () => unsubscribe();
    }
  }, [user]);

  if (balance === null) {
    return null; // Don't render anything while loading
  }

  return (
    <span className="font-bold text-primary">
      ${balance.toFixed(2)}
    </span>
  );
}


export function Header() {
  const { user, signOut } = useAuth();
  const [isWalletOpen, setIsWalletOpen] = useState(false);


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
                <SheetHeader className="p-4">
                  <SheetTitle>Deportes</SheetTitle>
                  <SheetDescription>Navega por las categorías de deportes.</SheetDescription>
                </SheetHeader>
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
                 <SheetHeader className="p-4">
                  <SheetTitle>Boleto de Apuesta</SheetTitle>
                   <SheetDescription>Tus selecciones aparecerán aquí.</SheetDescription>
                </SheetHeader>
                <BetSlip />
              </SheetContent>
            </Sheet>
          </div>
          <div className="hidden items-center gap-2 md:flex">
             <Sheet open={isWalletOpen} onOpenChange={setIsWalletOpen}>
              {user ? (
                <>
                   <Button variant="ghost" className='flex items-center gap-2' onClick={() => setIsWalletOpen(true)}>
                        <Wallet className="h-5 w-5" />
                        <UserBalance />
                    </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center gap-2">
                        <UserIcon className="h-5 w-5" />
                        <span className='truncate max-w-28'>{user.email}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setIsWalletOpen(true)}>Billetera</DropdownMenuItem>
                      <Link href="/my-bets" passHref>
                        <DropdownMenuItem>Mis Apuestas</DropdownMenuItem>
                      </Link>
                      <DropdownMenuItem onClick={signOut}>Cerrar Sesión</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <Dialog>
                  <div className="flex items-center gap-2">
                    <DialogTrigger asChild>
                      <Button variant="ghost">ACCEDER</Button>
                    </DialogTrigger>
                    <DialogTrigger asChild>
                      <Button
                        variant="default"
                        className="bg-accent text-accent-foreground hover:bg-accent/90"
                      >
                        REGISTRARSE
                      </Button>
                    </DialogTrigger>
                  </div>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Autenticación</DialogTitle>
                      <DialogDescription>
                        Accede o crea una cuenta para empezar a apostar.
                      </DialogDescription>
                    </DialogHeader>
                    <AuthForm />
                  </DialogContent>
                </Dialog>
              )}
               <SheetContent className="w-[400px] sm:w-[540px]">
                <SheetHeader className="mb-6">
                    <SheetTitle className="flex items-center gap-2">
                        <Wallet className="h-7 w-7" />
                        <span>Mi Billetera</span>
                    </SheetTitle>
                    <SheetDescription>Consulta tu saldo y gestiona tus fondos.</SheetDescription>
                </SheetHeader>
                  <WalletSheet />
               </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
