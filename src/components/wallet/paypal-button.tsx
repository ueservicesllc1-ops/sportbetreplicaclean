
'use client';

import { useState } from 'react';
import { PayPalScriptProvider, PayPalButtons, type OnApproveData, type CreateOrderData } from '@paypal/react-paypal-js';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { createOrder, captureOrder } from '@/lib/paypal';
import { Loader2 } from 'lucide-react';

interface PayPalWrapperProps {
    amount: string;
}

// Wrapper component to isolate the PayPal script provider and buttons
// This helps to avoid re-rendering issues with the PayPal SDK
function PayPalButtonsComponent({ amount, createOrderHandler, onApproveHandler, onErrorHandler }: { 
    amount: string,
    createOrderHandler: (data: CreateOrderData) => Promise<string>,
    onApproveHandler: (data: OnApproveData) => Promise<void>,
    onErrorHandler: (err: any) => void,
}) {
    // Using a 'key' prop on PayPalButtons forces it to re-render when the amount changes,
    // which is necessary for the PayPal SDK to pick up the new value.
    return (
        <PayPalButtons
            key={amount}
            style={{ layout: "horizontal", label: "pay", tagline: false }}
            createOrder={async (data) => createOrderHandler(data)}
            onApprove={async (data) => onApproveHandler(data)}
            onError={onErrorHandler}
        />
    );
}

export function PayPalButtonsWrapper({ amount }: PayPalWrapperProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';

  if (!PAYPAL_CLIENT_ID) {
    return <p className="text-sm text-destructive">La API de PayPal no está configurada.</p>;
  }

  const createOrderHandler = async (data: CreateOrderData) => {
    if (parseFloat(amount) <= 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'El monto debe ser mayor a cero.' });
      throw new Error("Invalid amount");
    }
    setError(null);
    setIsProcessing(true);
    try {
      const order = await createOrder(amount);
      return order.id;
    } catch (err: any) {
      setError('No se pudo iniciar el pago. Intenta de nuevo.');
      console.error(err);
      setIsProcessing(false);
      throw err;
    }
  };

  const onApproveHandler = async (data: OnApproveData) => {
    if (!user) {
        setError('Debes estar autenticado para completar el pago.');
        setIsProcessing(false);
        return;
    }
    try {
      const captureData = await captureOrder(data.orderID, user.uid);
      if (captureData.status === 'COMPLETED') {
        toast({
          title: '¡Pago completado!',
          description: `Se han añadido $${amount} a tu saldo.`,
          className: 'bg-green-600 border-green-600 text-white'
        });
      } else {
        throw new Error('La transacción no pudo ser completada.');
      }
    } catch (err: any) {
      setError('Ocurrió un error al procesar tu pago.');
      console.error(err);
    } finally {
        setIsProcessing(false);
    }
  };
  
  const onErrorHandler = (err: any) => {
    setError('Ocurrió un error con PayPal. Por favor, refresca la página e intenta de nuevo.');
    console.error('PayPal Error:', err);
    setIsProcessing(false);
  }

  return (
    <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, currency: 'USD', intent: 'capture' }}>
        <div className="relative">
             {isProcessing && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </div>
            )}
             {error && <p className="text-sm text-destructive mb-2">{error}</p>}

             <PayPalButtonsComponent 
                amount={amount}
                createOrderHandler={createOrderHandler}
                onApproveHandler={onApproveHandler}
                onErrorHandler={onErrorHandler}
             />
        </div>
    </PayPalScriptProvider>
  );
}
