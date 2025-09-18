
'use client';

import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { createOrder, captureOrder } from '@/lib/paypal';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { cn } from '@/lib/utils';

interface PaypalButtonProps {
  amount: number;
  onPaymentSuccess: () => void;
}

declare global {
  interface Window {
    paypal?: any;
  }
}

export function PaypalButton({ amount, onPaymentSuccess }: PaypalButtonProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const paypalButtonsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const addPaypalScript = () => {
            if (window.paypal) {
                setScriptLoaded(true);
                return;
            }
            
            const script = document.createElement("script");
            // The Client ID is now part of the script URL as requested
            script.src = `https://www.paypal.com/sdk/js?client-id=AfU-04zHwad560P4nU6LVMd7qnrY41c0TOdA9LUbN_6-lmztaHfxJz1p7-ByIt6-uoqSGr6OcdaO3b3m&currency=USD&intent=capture`;
            script.async = true;

            script.onload = () => {
                setScriptLoaded(true);
            };

            script.onerror = () => {
                 setError("No se pudo cargar el script de PayPal. Por favor, revisa tu conexión o intenta más tarde.");
            };

            document.body.appendChild(script);
        };

        addPaypalScript();

    }, []);


    useEffect(() => {
        if (scriptLoaded && paypalButtonsRef.current && window.paypal) {
            // Clear previous buttons before rendering new ones
            paypalButtonsRef.current.innerHTML = "";

            try {
                window.paypal.Buttons({
                    createOrder: async () => {
                        setError(null);
                        if (amount <= 0) {
                            const errMessage = 'El monto a depositar debe ser mayor a cero.';
                            setError(errMessage);
                            throw new Error(errMessage);
                        }
                        try {
                            const order = await createOrder(amount);
                            if (order.id) {
                                return order.id;
                            }
                             const errorDetail = order.details?.[0] || { issue: 'UNKNOWN_ERROR', description: 'No se pudo crear la orden en el servidor.' };
                            throw new Error(errorDetail.description);
                        } catch (err: any) {
                             console.error("Create Order Error:", err);
                             setError('Hubo un problema al crear la orden de pago. Inténtalo de nuevo.');
                             throw err;
                        }
                    },
                    onApprove: async (data: { orderID: string }) => {
                        setIsProcessing(true);
                        setError(null);
                        if (!user) {
                             setError('No se encontró el usuario para acreditar el saldo.');
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
                        } catch (err: any) {
                            const errMessage = 'No se pudo completar el pago. Por favor, verifica tus fondos de PayPal o intenta más tarde.';
                            setError(errMessage);
                        } finally {
                            setIsProcessing(false);
                        }
                    },
                    onError: (err: any) => {
                        console.error("PayPal Buttons Error:", err);
                        setError('Ocurrió un error con la interfaz de PayPal. Refresca la página y vuelve a intentarlo.');
                    }
                }).render(paypalButtonsRef.current);
            } catch (err) {
                 console.error("Failed to render PayPal Buttons", err);
                 setError("Error al renderizar los botones de PayPal.");
            }
        }
    }, [scriptLoaded, amount, user, onPaymentSuccess, toast]);


    return (
        <div className="relative min-h-[120px]">
            {isProcessing && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm space-y-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <p className="text-sm text-muted-foreground">Procesando pago...</p>
                </div>
            )}
            
            {error && (
                <Alert variant="default" className="mb-4 bg-secondary">
                    <AlertTitle>Error de Pago</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {!scriptLoaded && !error && (
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </div>
            )}

            <div ref={paypalButtonsRef} className={cn(isProcessing ? "pointer-events-none opacity-50" : "")} />
        </div>
    );
}
