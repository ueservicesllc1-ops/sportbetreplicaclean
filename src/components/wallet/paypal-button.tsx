
'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { createOrder, captureOrder } from '@/lib/paypal';
import { Loader2 } from 'lucide-react';
import { PayPalScriptProvider, PayPalButtons, type OnApproveData, type CreateOrderData } from "@paypal/react-paypal-js";
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

// Using the LIVE Client ID directly in the component for reliability.
// This is a public key and is safe to be exposed in client-side code.
const PAYPAL_CLIENT_ID = "AfU-04zHwad560P4nU6LVMd7qnrY41c0TOdA9LUbN_6-lmztaHfxJz1p7-ByIt6-uoqSGr6OcdaO3b3m";

interface PaypalButtonProps {
  amount: number;
  onPaymentSuccess: () => void;
}

function PayPalButtonsComponent({ amount, onPaymentSuccess }: PaypalButtonProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCreateOrder = async (data: CreateOrderData, actions: any) => {
        setError(null);
        if (amount <= 0) {
            const errMessage = 'El monto a depositar debe ser mayor a cero.';
            toast({ variant: 'destructive', title: 'Monto Inválido', description: errMessage });
            setError(errMessage);
            throw new Error(errMessage);
        }
        try {
            const order = await createOrder(amount);
            if (order.id) {
                return order.id;
            }
            const errorDetail = order.details?.[0] || { issue: 'UNKNOWN_ERROR', description: 'No se pudo crear la orden en el servidor.' };
            toast({ variant: 'destructive', title: `Error de PayPal: ${errorDetail.issue}`, description: errorDetail.description });
            setError(errorDetail.description);
            throw new Error(errorDetail.description);
        } catch (err: any) {
            console.error("Create Order Error:", err);
            setError(err.message || 'Error desconocido al crear la orden.');
            throw err;
        }
    };
    
    const handleOnApprove = async (data: OnApproveData, actions: any) => {
        setIsProcessing(true);
        setError(null);
        if (!user) {
            const errMessage = 'No se encontró el usuario para acreditar el saldo.';
            toast({ variant: 'destructive', title: 'Error de Autenticación', description: errMessage });
            setError(errMessage);
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
            const errMessage = err.message || 'Ocurrió un error inesperado al procesar el pago.';
            toast({ variant: 'destructive', title: 'Error en la Captura del Pago', description: errMessage });
            setError(errMessage);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleOnError = (err: any) => {
        console.error("PayPal Buttons Error:", err);
        const errMessage = 'Ocurrió un error con la interfaz de PayPal. Por favor, revisa la consola para más detalles o intenta de nuevo.';
        toast({ variant: 'destructive', title: 'Error en el Pago', description: errMessage });
        setError(errMessage);
    };

    return (
        <div className="relative min-h-[120px]">
            {isProcessing && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm space-y-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <p className="text-sm text-muted-foreground">Procesando pago...</p>
                </div>
            )}
             {error && (
                <Alert variant="destructive" className="mb-4">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            <PayPalButtons
                style={{ layout: "vertical", color: 'black', shape: 'rect', label: 'pay' }}
                createOrder={handleCreateOrder}
                onApprove={handleOnApprove}
                onError={handleOnError}
                disabled={isProcessing || amount <= 0}
                forceReRender={[amount]} 
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
                    El Client ID de PayPal no está configurado en el componente.
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
