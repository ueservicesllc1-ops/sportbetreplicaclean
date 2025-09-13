
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Wallet as WalletIcon, CreditCard, Landmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { SheetHeader, SheetTitle, SheetDescription } from '../ui/sheet';
import { Separator } from '../ui/separator';
import { Input } from '../ui/input';

export function WalletSheet() {
  const { user, loading: authLoading } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState<number | string>('');

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
        setBalance(0);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  const handleDeposit = () => {
    // Placeholder for deposit logic
    alert(`Funcionalidad de depósito no implementada. Monto a depositar: $${depositAmount}`);
  };


  if (loading || authLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
       <div className="py-12 text-center">
            <p className="text-muted-foreground">
            Inicia sesión para continuar.
            </p>
        </div>
    );
  }

  return (
      <div className="space-y-6">
        <Card className="text-center bg-secondary/50">
            <CardHeader>
            <CardTitle className="text-lg font-medium text-muted-foreground">Saldo Actual</CardTitle>
            </CardHeader>
            <CardContent>
            <p className="text-4xl font-bold tracking-tight text-primary">
                ${balance !== null ? balance.toFixed(2) : '0.00'}
            </p>
            </CardContent>
        </Card>
        
        <Separator />

        <div className="space-y-4">
            <h3 className="font-semibold text-lg">Depositar Fondos</h3>
            <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" onClick={() => setDepositAmount(10)}>$10</Button>
                <Button variant="outline" onClick={() => setDepositAmount(20)}>$20</Button>
                <Button variant="outline" onClick={() => setDepositAmount(50)}>$50</Button>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium">$</span>
                <Input 
                    type="number" 
                    placeholder="Monto personalizado"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                />
            </div>
             <p className="text-xs text-muted-foreground">Seleccione un método de pago:</p>
            <div className='space-y-2'>
                 <Button variant="outline" className="w-full justify-start gap-2">
                    <CreditCard /> Tarjeta de Crédito/Débito
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                    <Landmark /> Transferencia Bancaria
                </Button>
            </div>
            <Button className="w-full" onClick={handleDeposit} disabled={!depositAmount || Number(depositAmount) <= 0}>
                Depositar ${depositAmount || '0'}
            </Button>
        </div>

        <Separator />

        <Card>
            <CardHeader>
            <CardTitle className='text-base'>Historial de Transacciones</CardTitle>
            </CardHeader>
            <CardContent>
            <p className="text-muted-foreground text-center text-sm py-4">
                Aquí se mostrarán tus depósitos, retiros y apuestas. (Funcionalidad futura)
            </p>
            </CardContent>
        </Card>
      </div>

  );
}
