
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Wallet as WalletIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function WalletPage() {
  const { user, loading: authLoading } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        setBalance(doc.data().balance);
      } else {
        // This case might happen if the user doc creation is delayed
        setBalance(0);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  if (loading || authLoading) {
    return (
      <div className="container mx-auto max-w-2xl py-12 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-muted-foreground">Cargando tu billetera...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto max-w-2xl py-12 text-center">
        <h1 className="text-2xl font-bold">Billetera</h1>
        <p className="mt-4 text-muted-foreground">
          Debes iniciar sesión para ver tu saldo.
        </p>
        <Button asChild className="mt-4">
          <Link href="/">Volver al inicio</Link>
        </Button>
      </div>
    );
  }

  return (
    <main className="container mx-auto max-w-2xl py-12">
       <div className='flex items-center justify-between mb-8'>
         <h1 className="text-3xl font-bold tracking-tight">Mi Billetera</h1>
         <Button asChild variant="outline">
            <Link href="/">Volver al inicio</Link>
        </Button>
      </div>
      <Card className="text-center">
        <CardHeader>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <WalletIcon className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="mt-4 text-2xl">Saldo Actual</CardTitle>
          <CardDescription>Este es el dinero que tienes disponible para apostar.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-5xl font-bold tracking-tight text-primary">
            ${balance !== null ? balance.toFixed(2) : '0.00'}
          </p>
        </CardContent>
      </Card>
      
       <Card className="mt-8">
        <CardHeader>
          <CardTitle>Historial de Transacciones</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Aquí se mostrarán tus depósitos, retiros y apuestas. (Funcionalidad futura)
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

