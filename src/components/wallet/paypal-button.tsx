
'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { createOrder, captureOrder } from '@/lib/paypal';
import { Loader2 } from 'lucide-react';
import { PayPalScriptProvider, PayPalButtons, type OnApproveData, type CreateOrderData } from "@paypal/react-paypal-js";
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

interface PaypalButtonProps {
  amount: number;
  onPaymentSuccess: () => void;
}

function PayPalButtonsComponent({ amount, onPaymentSuccess }: PaypalButtonProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleCreateOrder = async (data: CreateOrderData, actions: any) => {
        if (amount <= 0) {
            toast({
                variant: 'destructive',
                title: 'Monto Inválido',
                description: 'El monto a depositar debe ser mayor a cero.',
            });
            throw new Error('Invalid amount');
        }
        try {
            const order = await createOrder(amount);
            if (order.id) {
                return order.id;
            }
            const errorDetail = order.details?.[0] || { issue: 'UNKNOWN_ERROR', description: 'No se pudo crear la orden.' };
            toast({ variant: 'destructive', title: `Error de PayPal: ${errorDetail.issue}`, description: errorDetail.description });
            throw new Error(errorDetail.description);
        } catch (error) {
            console.error("Create Order Error:", error);
            throw error;
        }
    };
    
    const handleOnApprove = async (data: OnApproveData, actions: any) => {
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
    };

    const handleOnError = (err: any) => {
        console.error("PayPal Buttons Error:", err);
        toast({
            variant: 'destructive',
            title: 'Error en el Pago',
            description: 'Ocurrió un error inesperado con PayPal. Por favor, intenta de nuevo.',
        });
    };

    return (
        <div className="relative min-h-[100px]">
            {isProcessing && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm space-y-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <p className="text-sm text-muted-foreground">Procesando pago...</p>
                </div>
            )}
            <PayPalButtons
                style={{ layout: "vertical", color: 'black' }}
                createOrder={handleCreateOrder}
                onApprove={handleOnApprove}
                onError={handleOnError}
                disabled={isProcessing || amount <= 0}
                forceReRender={[amount]} // Force re-render when amount changes
            />
        </div>
    );
}


export function PaypalButton(props: PaypalButtonProps) {
     if (!PAYPAL_CLIENT_ID) {
        return (
             <Alert variant="destructive">
                <AlertTitle>Error de Configuración de PayPal</AlertTitle>
                <AlertDescription>
                    La variable de entorno NEXT_PUBLIC_PAYPAL_CLIENT_ID no está configurada.
                </AlertDescription>
            </Alert>
        );
    }
    
    return (
        <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, currency: "USD", intent: "capture" }}>
            <PayPalButtonsComponent {...props} />
        </PayPalScriptProvider>
    );
}
