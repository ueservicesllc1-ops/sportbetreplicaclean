
'use client';

import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Landmark, ShieldAlert, Bitcoin, Copy, AlertTriangle, MessageSquare, ShieldCheck, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '../ui/separator';
import { Input } from '../ui/input';
import { useState, useEffect, useActionState, useRef } from 'react';
import { KycForm } from './kyc-form';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { useToast } from '@/hooks/use-toast';
import { requestWithdrawal, submitDepositNotification } from '@/app/admin/withdrawals/actions';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { PaypalButton } from './paypal-button';
import { ScrollArea } from '../ui/scroll-area';
import Image from 'next/image';
import { getBankingSettings, type BankingInfo } from '@/app/admin/banking/actions';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { useFormStatus } from 'react-dom';


const WELCOME_BONUS = 100;

const initialNotificationState = {
  success: false,
  message: '',
};

function SubmitNotificationButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
      Notificar Depósito
    </Button>
  );
}

function DepositNotificationForm({ depositType, notesPlaceholder }: { depositType: 'transferencia bancaria' | 'depósito cripto', notesPlaceholder: string }) {
    const { user } = useAuth();
    const [state, formAction] = useActionState(submitDepositNotification, initialNotificationState);
    const formRef = useRef<HTMLFormElement>(null);
    const { toast } = useToast();

    useEffect(() => {
        if(state.message){
            if(state.success){
                toast({ title: "Notificación Enviada", description: state.message });
                formRef.current?.reset();
            } else {
                toast({ variant: 'destructive', title: "Error", description: state.message });
            }
        }
    }, [state, toast]);

    return (
        <div className='mt-4 pt-4 border-t'>
            <h4 className='text-base font-semibold mb-2'>Paso 2: Notificar tu depósito</h4>
            <p className='text-xs text-muted-foreground mb-4'>
                Después de realizar la {depositType}, completa este formulario con los datos de la transacción para que podamos acreditar tu saldo.
            </p>
             <form ref={formRef} action={formAction} className="space-y-4">
                <input type="hidden" name="userId" value={user?.uid} />
                <input type="hidden" name="userEmail" value={user?.email || ''} />

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="amount">Monto Depositado</Label>
                        <Input id="amount" name="amount" type="number" step="0.01" placeholder="Ej: 50.00" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="reference">Nº de Referencia / Hash</Label>
                        <Input id="reference" name="reference" placeholder="ID de la transacción" required />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="notes">Notas (Opcional)</Label>
                    <Textarea id="notes" name="notes" placeholder={notesPlaceholder} />
                </div>

                 {!state.success && state.message && (
                    <Alert variant="destructive" className='text-xs'>
                        <AlertDescription>{state.message}</AlertDescription>
                    </Alert>
                )}

                <SubmitNotificationButton />
            </form>
        </div>
    );
}

function BankTransferArea() {
    const { toast } = useToast();
    const [settings, setSettings] = useState<BankingInfo | null>(null);
    const [loading, setLoading] = useState(true);

     useEffect(() => {
        async function fetchSettings() {
            try {
                const fetchedSettings = await getBankingSettings();
                setSettings(fetchedSettings);
            } catch (error) {
                console.error("Failed to fetch banking settings", error);
            } finally {
                setLoading(false);
            }
        }
        fetchSettings();
    }, []);

    const handleCopy = (text: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast({ title: "Copiado", description: "El dato ha sido copiado al portapapeles." });
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-4 rounded-lg border h-[120px]">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        );
    }
    
    if (!settings || !settings.bankName) {
        return (
            <div className="space-y-4 rounded-lg border p-4 text-center">
                 <h3 className="font-semibold text-lg">Depositar por Transferencia</h3>
                 <p className="text-sm text-muted-foreground">
                   La transferencia bancaria no está configurada por el administrador.
                 </p>
            </div>
        );
    }

    const cleanPhoneNumber = (phone?: string) => {
        if (!phone) return '';
        return phone.replace(/[^0-9]/g, '');
    }
    
    const destinationBankDetails = [
        { label: "Banco", value: settings.bankName },
        { label: "Titular", value: settings.accountHolder },
        { label: "RUC / C.I.", value: settings.ruc },
        { label: "Tipo de Cuenta", value: settings.accountType },
        { label: "Número de Cuenta", value: settings.accountNumber },
        { label: "Email Comprobante", value: settings.email },
        { label: "WhatsApp Comprobante", value: settings.whatsapp, isWhatsapp: true, icon: MessageSquare },
    ];

    const availableBanks = [
        { name: 'Pichincha', logo: settings.logoPichincha },
        { name: 'Guayaquil', logo: settings.logoGuayaquil },
        { name: 'Internacional', logo: settings.logoInternacional },
        { name: 'Pacífico', logo: settings.logoPacifico },
    ].filter(bank => bank.logo);


    return (
         <div className="space-y-4 rounded-lg border p-4">
            <h3 className="font-semibold text-lg">Depositar por Transferencia</h3>
             <p className="text-sm text-muted-foreground">
               Realiza una transferencia desde uno de estos bancos. Haz clic en el logo para ver los datos de la cuenta de destino.
             </p>

            <div className='grid grid-cols-4 gap-2'>
                {availableBanks.map(bank => (
                     <DialogTrigger asChild key={bank.name}>
                        <Button variant="outline" className={cn("h-16 w-full flex items-center justify-center p-1", bank.name === 'Pichincha' && 'bg-white hover:bg-white/90')}>
                            <Image src={bank.logo!} alt={`Logo ${bank.name}`} width={80} height={30} className="object-contain" />
                        </Button>
                    </DialogTrigger>
                ))}
            </div>

             <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Datos para la Transferencia Bancaria</DialogTitle>
                    <DialogDescription>
                        Usa esta información para realizar tu depósito.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-4">
                     <h4 className='text-base font-semibold'>Paso 1: Realizar transferencia</h4>
                    {destinationBankDetails.map((item) => item.value && (
                        <div key={item.label} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{item.label}:</span>
                             <div className="flex items-center gap-2">
                                {item.isWhatsapp ? (
                                    <>
                                        <MessageSquare className="h-4 w-4 text-green-500 mr-1" />
                                        <Link href={`https://wa.me/${cleanPhoneNumber(item.value)}`} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">
                                            {item.value}
                                        </Link>
                                    </>
                                ) : (
                                    <span className="font-semibold">{item.value}</span>
                                )}
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleCopy(item.value!)}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
                <DepositNotificationForm depositType="transferencia bancaria" notesPlaceholder="Ej: Depósito desde cuenta de Pichincha." />
             </DialogContent>
        </div>
    )
}

function CryptoDepositArea() {
    const { toast } = useToast();
    const walletAddress = "0xEc633c67bb965F7A60F572bdDB76e49b5D6Da348";

    const handleCopy = (text: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast({ title: "Copiado", description: "La dirección de la billetera ha sido copiada." });
    }

    return (
        <Dialog>
             <DialogTrigger asChild>
                <Button variant="outline" className="w-full h-16">
                     <div className="flex items-center gap-3">
                        <Bitcoin className="h-6 w-6 text-primary flex-shrink-0" />
                        <div>
                            <h3 className="font-semibold text-left">Depositar con Cripto</h3>
                            <p className="text-xs text-muted-foreground text-left">
                                Usando la red ERC-20.
                            </p>
                        </div>
                    </div>
                </Button>
            </DialogTrigger>
             <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Depositar con Criptomonedas</DialogTitle>
                    <DialogDescription>Transfiere fondos a la siguiente dirección de billetera.</DialogDescription>
                </DialogHeader>
                 <div className="space-y-4 py-4">
                     <h4 className='text-base font-semibold'>Paso 1: Realizar depósito</h4>
                     <div className="p-3 rounded-md bg-secondary/50 space-y-2">
                        <Label className='text-xs'>Dirección de Billetera (ERC-20)</Label>
                        <div className="flex items-center gap-2">
                            <p className="font-mono text-sm break-all flex-grow">{walletAddress}</p>
                            <Button size="icon" variant="ghost" className="h-8 w-8 flex-shrink-0" onClick={() => handleCopy(walletAddress)}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>¡Atención!</AlertTitle>
                        <AlertDescription>
                            Esta dirección solo acepta depósitos en la red Ethereum (ERC-20). Enviar tokens de otras redes resultará en la pérdida de fondos.
                        </AlertDescription>
                    </Alert>
                </div>
                 <DepositNotificationForm depositType="depósito cripto" notesPlaceholder="Ej: USDT enviados desde mi billetera de Binance."/>
            </DialogContent>
        </Dialog>
    );
}


function DepositArea() {
    const [amount, setAmount] = useState('10.00');

    const handlePaymentSuccess = () => {
        setAmount('10.00');
    }

    return (
         <div className="space-y-4 rounded-lg border p-4">
            <h3 className="font-semibold text-lg">Depositar con PayPal</h3>
             <p className="text-sm text-muted-foreground">
               Selecciona un monto o ingresa una cantidad para añadir fondos a tu billetera de forma segura.
             </p>
             <div className="grid grid-cols-4 gap-2">
                <Button size="sm" variant="outline" onClick={() => setAmount('10.00')}>$10</Button>
                <Button size="sm" variant="outline" onClick={() => setAmount('25.00')}>$25</Button>
                <Button size="sm" variant="outline" onClick={() => setAmount('50.00')}>$50</Button>
                <Button size="sm" variant="outline" onClick={() => setAmount('100.00')}>$100</Button>
            </div>
             <div className="flex items-center gap-2">
                <span className="text-sm font-medium">$</span>
                <Input 
                    type="number" 
                    placeholder="Monto a depositar"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                />
            </div>

            <PaypalButton amount={parseFloat(amount) || 0} onPaymentSuccess={handlePaymentSuccess} />
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
    <Dialog>
        <ScrollArea className="h-full pr-4">
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
                <>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div className="space-y-4">
                        <DepositArea />
                        <BankTransferArea />
                        <CryptoDepositArea />
                    </div>
                    <WithdrawalArea />
                </div>
                </>

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
        </ScrollArea>
    </Dialog>
  );
}
