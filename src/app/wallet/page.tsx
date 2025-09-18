
'use client';

import { Button } from '@/components/ui/button';
import { WalletSheet } from '@/components/wallet/wallet-sheet';
import Link from 'next/link';


export default function WalletPage() {
  
  return (
    <div className="container mx-auto max-w-2xl py-12">
        <div className='flex items-center justify-between mb-8'>
         <h1 className="text-3xl font-bold tracking-tight">Mi Billetera</h1>
         <Button asChild variant="outline">
            <Link href="/">Volver al inicio</Link>
        </Button>
      </div>
      <WalletSheet />
    </div>
  );
}
