
'use client';

import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { createOrder, captureOrder } from '@/lib/paypal';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

// This is your LIVE production key. It is safe to have this in client-side code.
const PAYPAL_CLIENT_ID = "ARtILiF9tK7Nv3aKUEM905YkROKprr9BkQSC1dkamAsqi-MwJM5XD2DLfLHFfZnXv0Fx1YYlic-H3DsX";

// Extend the Window interface to include the paypal object
declare global {
  interface Window {
    paypal?: any;
  }
}

interface PaypalButtonProps {
  amount: number;
  onPaymentSuccess: () => void;
}

export function PaypalButton({ amount, onPaymentSuccess }: PaypalButtonProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isSdkReady, setIsSdkReady] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const paypalButtonContainer = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const addPaypalScript = () => {
            if (window.paypal) {
                setIsSdkReady(true);
                return;
            }
            const script = document.createElement('script');
            script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&intent=capture`;
            script.onload = () => {
                setIsSdkReady(true);
            };
            script.onerror = () => {
                toast({
                    variant: 'destructive',
                    title: 'Error de PayPal',
                    description: 'No se pudo cargar el script de pago. Por favor, recarga la página.',
                });
            };
            document.body.appendChild(script);
        };

        addPaypalScript();
    }, [toast]);


    useEffect(() => {
        if (isSdkReady && paypalButtonContainer.current) {
            // Clear the container in case of re-renders
            paypalButtonContainer.current.innerHTML = '';

            try {
                 window.paypal.Buttons({
                    createOrder: async () => {
                        if (amount <= 0) {
                            toast({
                                variant: 'destructive',
                                title: 'Monto Inválido',
                                description: 'El monto a depositar debe ser mayor a cero.',
                            });
                            throw new Error('Invalid amount');
                        }
                        const order = await createOrder(amount);
                        if (order.id) {
                            return order.id;
                        }
                        const errorDetail = order.details?.[0] || { issue: 'UNKNOWN_ERROR', description: 'No se pudo crear la orden.' };
                        toast({ variant: 'destructive', title: `Error de PayPal: ${errorDetail.issue}`, description: errorDetail.description });
                        throw new Error(errorDetail.description);
                    },
                    onApprove: async (data: { orderID: string }) => {
                        setIsProcessing(true);
                        if (!user) {
                            toast({ variant: 'destructive', title: 'Error de Autenticación', description: 'No se encontró el usuario.' });
                            setIsProcessing(false);
                            return;
                        }

                        try {
                            const result = await captureOrder(data.orderID, user.uid);
                            if (result.success) {
                                toast({
                                    title: '¡Depósito Exitoso!',
                                    description: `Se han añadido $${amount.toFixed(2)} a tu saldo.`,
                                    className: 'bg-green-600 border-green-600 text-white'
                                });
                                onPaymentSuccess();
                            } else {
                                throw new Error(result.message);
                            }
                        } catch (error: any) {
                            toast({ variant: 'destructive', title: 'Error en la Captura', description: error.message });
                        } finally {
                            setIsProcessing(false);
                        }
                    },
                     onError: (err: any) => {
                        console.error("PayPal Buttons Error:", err);
                        toast({
                            variant: 'destructive',
                            title: 'Error en el Pago',
                            description: 'Ocurrió un error inesperado con PayPal. Por favor, intenta de nuevo.',
                        });
                    }
                }).render(paypalButtonContainer.current);

            } catch (error) {
                 console.error("Failed to render PayPal Buttons:", error);
                 toast({
                    variant: 'destructive',
                    title: 'Error de Renderizado',
                    description: 'No se pudieron mostrar los botones de PayPal.',
                });
            }
        }
    }, [isSdkReady, amount, user, onPaymentSuccess, toast]);


    if (!PAYPAL_CLIENT_ID) {
        return (
             <Alert variant="destructive">
                <AlertTitle>Error de Configuración de PayPal</AlertTitle>
                <AlertDescription>
                    La constante PAYPAL_CLIENT_ID no está definida en el componente.
                </AlertDescription>
            </Alert>
        );
    }
    
    return (
        <div className="relative min-h-[100px]">
            {!isSdkReady && !isProcessing && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm space-y-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <p className="text-sm text-muted-foreground">Cargando pago...</p>
                </div>
            )}
             {isProcessing && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm space-y-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <p className="text-sm text-muted-foreground">Procesando pago...</p>
                </div>
            )}
            <div ref={paypalButtonContainer} />
        </div>
    );
}
