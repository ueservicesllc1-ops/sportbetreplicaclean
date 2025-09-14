
'use client';

import { useState } from 'react';
import { PayPalScriptProvider, PayPalButtons, type OnApproveData, type CreateOrderData } from '@paypal/react-paypal-js';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { createOrder, captureOrder } from '@/lib/paypal';
import { Loader2 } from 'lucide-react';
import { Button } from '../ui/button';

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
            // Toast is shown inside the createOrder call
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
        toast({
            variant: 'destructive',
            title: 'Error de PayPal',
            description: 'Ocurrió un error con los botones de pago. Por favor, intenta de nuevo.',
        });
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
            />
        </div>
    );
};

interface PaypalButtonProps {
  amount: number;
  onPaymentSuccess: () => void;
}

export function PaypalButton({ amount, onPaymentSuccess }: PaypalButtonProps) {
    // Client components must read NEXT_PUBLIC_ variables directly from process.env
    const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

    if (!paypalClientId) {
        return (
            <Button disabled className='w-full'>
                PayPal no está configurado
            </Button>
        );
    }
    
    return (
        <PayPalScriptProvider options={{ clientId: paypalClientId, currency: 'USD', intent: 'capture' }}>
            {/* The key prop forces the component to re-mount when the amount changes, ensuring the new amount is used */}
            <PayPalButtonsComponent key={amount} amount={amount} onPaymentSuccess={onPaymentSuccess} />
        </PayPalScriptProvider>
    );
}
