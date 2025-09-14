
'use client';

import { useState } from 'react';
import { PayPalScriptProvider, PayPalButtons, type OnApproveData, type CreateOrderData } from '@paypal/react-paypal-js';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { createOrder, captureOrder } from '@/lib/paypal';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

// This is your LIVE production key. It is safe to have this in client-side code.
const PAYPAL_CLIENT_ID = "ARtILiF9tK7Nv3aKUEM905YkROKprr9BkQSC1dkamAsqi-MwJM5XD2DLfLHFfZnXv0Fx1YYlic-H3DsX";

interface PayPalButtonsComponentProps {
    amount: number;
    onPaymentSuccess: () => void;
}

const PayPalButtonsComponent = ({ amount, onPaymentSuccess }: PayPalButtonsComponentProps) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleCreateOrder = async (data: CreateOrderData) => {
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
            if(order.id) {
                return order.id;
            } else {
                const errorDetail = order.details?.[0] || { issue: 'UNKNOWN_ERROR', description: 'No se pudo crear la orden.' };
                console.error("PayPal create order error:", order);
                toast({
                    variant: 'destructive',
                    title: `Error de PayPal: ${errorDetail.issue}`,
                    description: errorDetail.description,
                });
                throw new Error(errorDetail.description);
            }
        } catch (error: any) {
            console.error('Frontend createOrder error:', error);
            throw error;
        }
    };

    const onApprove = async (data: OnApproveData) => {
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

    const onError = (err: any) => {
        console.error("PayPal Buttons Error:", err);
         if (err && err.message && (err.message.includes('global_session_not_found') || err.message.includes('CHECKOUT_SESSION_NOT_FOUND'))) {
             toast({
                variant: 'destructive',
                title: 'Error de Sesión de PayPal',
                description: 'Por favor, limpia las cookies de paypal.com en tu navegador e intenta de nuevo.',
            });
        } else {
            toast({
                variant: 'destructive',
                title: 'Error de PayPal',
                description: 'Ocurrió un error con los botones de pago. Por favor, intenta de nuevo.',
            });
        }
    };

    return (
        <div className="relative">
            {isProcessing && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm space-y-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <p className="text-sm text-muted-foreground">Procesando pago...</p>
                </div>
            )}
            <PayPalButtons
                style={{ layout: 'vertical', color: 'blue', shape: 'rect', label: 'pay' }}
                createOrder={handleCreateOrder}
                onApprove={onApprove}
                onError={onError}
                disabled={isProcessing}
                key={amount} // Force re-render when amount changes
            />
        </div>
    );
};


interface PaypalButtonProps {
  amount: number;
  onPaymentSuccess: () => void;
}

export function PaypalButton({ amount, onPaymentSuccess }: PaypalButtonProps) {
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
        <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, currency: 'USD', intent: 'capture' }}>
            <PayPalButtonsComponent amount={amount} onPaymentSuccess={onPaymentSuccess} />
        </PayPalScriptProvider>
    );
}
