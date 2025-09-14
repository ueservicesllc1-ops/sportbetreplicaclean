
'use client';

import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Landmark, CreditCard, ShieldCheck, ShieldAlert, Bitcoin, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '../ui/separator';
import { Input } from '../ui/input';
import { useState } from 'react';
import { KycForm } from './kyc-form';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { useToast } from '@/hooks/use-toast';
import { requestWithdrawal } from '@/app/admin/withdrawals/actions';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';

const WELCOME_BONUS = 100;
const CRYPTO_WALLET_ADDRESS = '0xEc633c67bb965F7A60F572bdDB76e49b5D6Da348';

function DepositArea() {
    const [depositAmount, setDepositAmount] = useState<number | string>('');
    const { toast } = useToast();

    const handleDeposit = () => {
        // Placeholder for deposit logic
        alert(`Funcionalidad de depósito no implementada. Monto a depositar: $${depositAmount}`);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(CRYPTO_WALLET_ADDRESS);
        toast({
            title: '¡Copiado!',
            description: 'La dirección de la billetera ha sido copiada a tu portapapeles.',
        });
    }

    return (
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
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="w-full justify-start gap-2">
                            <Bitcoin /> Criptomonedas
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Bitcoin /> Depósito con Criptomonedas
                            </DialogTitle>
                            <DialogDescription>
                                Envía únicamente USDT a través de la red Ethereum (ERC20) a la siguiente dirección.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <Alert variant="destructive">
                                <AlertTitle>¡Atención!</AlertTitle>
                                <AlertDescription>
                                    Enviar cualquier otra moneda o usar una red diferente (ej. TRC20, BEP20) resultará en la pérdida permanente de tus fondos.
                                </AlertDescription>
                            </Alert>
                             <div className="p-3 rounded-lg bg-secondary space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">Tu dirección de depósito (USDT - ERC20):</p>
                                <div className="flex items-center gap-2">
                                     <p className="text-sm font-mono break-all font-semibold text-primary">{CRYPTO_WALLET_ADDRESS}</p>
                                     <Button size="icon" variant="ghost" onClick={copyToClipboard}>
                                        <Copy className="h-4 w-4" />
                                     </Button>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground text-center">Una vez realizado el depósito, por favor contacta a soporte para que sea acreditado en tu cuenta.</p>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
            <Button className="w-full" onClick={handleDeposit} disabled={!depositAmount || Number(depositAmount) <= 0}>
                Depositar ${depositAmount || '0'}
            </Button>
        </div>
    )
}

function WithdrawalArea() {
    const { userProfile } = useAuth();
    const [withdrawalAmount, setWithdrawalAmount] = useState<number | string>('');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    if (!userProfile) return null;

    const withdrawableBalance = Math.max(0, userProfile.balance - WELCOME_BONUS);

    const handleRequestWithdrawal = async () => {
        const amount = Number(withdrawalAmount);
        if (isNaN(amount) || amount <= 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'Por favor, introduce un monto válido para retirar.' });
            return;
        }
        if (amount > withdrawableBalance) {
            toast({ variant: 'destructive', title: 'Error', description: 'El monto solicitado excede tu saldo retirable.' });
            return;
        }
        setLoading(true);
        try {
            await requestWithdrawal(userProfile.uid, amount);
            toast({ title: 'Solicitud Enviada', description: 'Tu solicitud de retiro ha sido enviada para aprobación del administrador.'});
            setWithdrawalAmount('');
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setLoading(false);
        }
    }


    return (
        <div className="space-y-4">
             <h3 className="font-semibold text-lg">Retirar Fondos</h3>
              <Card className="text-center">
                <CardHeader className='p-3'>
                    <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Retirable</CardTitle>
                    <CardDescription className='text-xs'>(Saldo Total - Bono de Bienvenida)</CardDescription>
                </CardHeader>
                <CardContent className='p-3 pt-0'>
                    <p className="text-2xl font-bold tracking-tight text-primary">
                        ${withdrawableBalance.toFixed(2)}
                    </p>
                </CardContent>
            </Card>

            <div className="flex items-center gap-2">
                <span className="text-sm font-medium">$</span>
                <Input 
                    type="number" 
                    placeholder="Monto a retirar"
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    max={withdrawableBalance}
                />
            </div>
             <p className="text-xs text-muted-foreground">El retiro será procesado a la cuenta bancaria registrada. La aprobación puede tardar hasta 48 horas.</p>

            <Button className="w-full" onClick={handleRequestWithdrawal} disabled={loading || !withdrawalAmount || Number(withdrawalAmount) <= 0}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Solicitar Retiro
            </Button>
        </div>
    )
}


export function WalletSheet() {
  const { user, userProfile, loading: authLoading } = useAuth();
  
  if (authLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !userProfile) {
    return (
       <div className="py-12 text-center">
            <p className="text-muted-foreground">
            Inicia sesión para continuar.
            </p>
        </div>
    );
  }

  const { balance, verificationStatus } = userProfile;

  return (
      <div className="space-y-6">
        <Card className="text-center bg-secondary/50">
            <CardHeader className='p-2'>
                <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Total</CardTitle>
            </CardHeader>
            <CardContent className='p-2 pt-0'>
                <p className="text-3xl font-bold tracking-tight text-primary">
                    ${balance !== null ? balance.toFixed(2) : '0.00'}
                </p>
            </CardContent>
        </Card>
        
        <Separator />

        {verificationStatus === 'unverified' && <KycForm />}
        {verificationStatus === 'pending' && (
            <Alert>
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Verificación en Proceso</AlertTitle>
                <AlertDescription>
                    Tus documentos han sido enviados y están siendo revisados. Este proceso puede tardar hasta 24 horas. Te notificaremos cuando tu cuenta haya sido verificada.
                </AlertDescription>
            </Alert>
        )}
        {verificationStatus === 'verified' && (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <DepositArea />
                <WithdrawalArea />
            </div>
        )}
        {verificationStatus === 'rejected' && (
            <div className='space-y-4'>
                <Alert variant="destructive">
                    <AlertTitle>Verificación Rechazada</AlertTitle>
                    <AlertDescription>
                        Hubo un problema al verificar tus documentos. Por favor, corrige los datos y vuelve a enviarlos.
                    </AlertDescription>
                </Alert>
                <KycForm />
            </div>
        )}


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

    