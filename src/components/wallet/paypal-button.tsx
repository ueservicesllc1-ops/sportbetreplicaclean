
'use client';

import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { useToast } from "@/hooks/use-toast";
import { capturePayPalOrder, createPayPalOrder } from "@/lib/paypal";
import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";

export function PayPalButtonsWrapper({ amount }: { amount: string }) {
    const [{ options, isPending }, dispatch] = usePayPalScriptReducer();
    const { toast } = useToast();
    const { user } = useAuth();
    const currency = "USD";

    useEffect(() => {
        dispatch({
            type: "resetOptions",
            value: {
                ...options,
                currency: currency,
            },
        });
    }, [amount, currency]);


    const handleCreateOrder = async () => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'Debes iniciar sesión para depositar.' });
            return '';
        }
        try {
            const parsedAmount = parseFloat(amount);
            if (isNaN(parsedAmount) || parsedAmount <= 0) {
                throw new Error("Monto inválido.");
            }
            const orderId = await createPayPalOrder(parsedAmount, user.uid);
            return orderId;
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo crear la orden de PayPal.' });
            return '';
        }
    };

    const handleOnApprove = async (data: any) => {
        try {
            const result = await capturePayPalOrder(data.orderID);
            if (result.success) {
                toast({ title: 'Pago Exitoso', description: result.message });
                // Balance will update automatically via Firestore onSnapshot
            } else {
                toast({ variant: 'destructive', title: 'Error de Pago', description: result.message });
            }
        } catch(e: any) {
             toast({ variant: 'destructive', title: 'Error al capturar el pago', description: e.message });
        }
    };

    const handleError = (err: any) => {
        console.error("Error de PayPal:", err);
        toast({ variant: 'destructive', title: 'Error de PayPal', description: 'Ocurrió un error durante el proceso de pago.' });
    };

    if (isPending) {
        return <div className="h-12 w-full animate-pulse rounded-md bg-muted" />;
    }

    return (
        <PayPalButtons
            style={{ layout: "vertical", label: "pay", shape: 'rect' }}
            createOrder={handleCreateOrder}
            onApprove={handleOnApprove}
            onError={handleError}
            disabled={!amount || parseFloat(amount) <= 0 || !user}
        />
    );
}
