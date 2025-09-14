
'use client';

import { PayPalButtons, PayPalScriptProvider, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { useToast } from "@/hooks/use-toast";
import { capturePayPalOrder, createPayPalOrder } from "@/lib/paypal";
import { useAuth } from "@/contexts/auth-context";
import { useEffect, useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

// Este es el Client ID de Sandbox. Reemplázalo con tu clave de producción cuando estés listo.
const PAYPAL_CLIENT_ID = "AZDxjDScFpQtjWTOUtWKbyN_bDt4OgqaF4eYXlewfBP4-8aqX3PiV8e1GWU6liB2CUXlkA59kJXE7M6R";

/**
 * Este componente contiene los botones de PayPal y la lógica de creación/captura.
 * Se separa para poder forzar su recreación con una `key` cuando el monto cambia.
 */
function PayPalButtonsComponent({ amount, onApprove, onError, createOrder }: {
    amount: string;
    onApprove: (data: any) => Promise<void>;
    onError: (err: any) => void;
    createOrder: () => Promise<string>;
}) {
    // Si el monto no es válido, no renderizar los botones.
    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return <Button disabled className="w-full">Introduce un monto válido</Button>;
    }

    return (
        <PayPalButtons
            key={amount} // ¡IMPORTANTE! Esto fuerza a React a recrear el componente cuando el monto cambia.
            style={{ layout: "vertical", label: "pay", shape: 'rect' }}
            createOrder={createOrder}
            onApprove={onApprove}
            onError={onError}
            disabled={!amount || parseFloat(amount) <= 0}
        />
    );
}

/**
 * Este es el componente principal que gestiona el estado y el proveedor del script de PayPal.
 */
export function PayPalDeposit() {
    const [amount, setAmount] = useState("10.00");
    const { toast } = useToast();
    const { user } = useAuth();

    const handleCreateOrder = async (): Promise<string> => {
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
            console.error("Error creating PayPal order:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo crear la orden de PayPal.' });
            return '';
        }
    };

    const handleOnApprove = async (data: any) => {
        try {
            const result = await capturePayPalOrder(data.orderID);
            if (result.success) {
                toast({ title: 'Pago Exitoso', description: result.message });
            } else {
                toast({ variant: 'destructive', title: 'Error de Pago', description: result.message });
            }
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error al capturar el pago', description: e.message });
        }
    };

    const handleError = (err: any) => {
        console.error("Error de PayPal:", err);
        toast({ variant: 'destructive', title: 'Error de PayPal', description: 'Ocurrió un error durante el proceso de pago.' });
    };

    return (
         <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, currency: 'USD', intent: 'capture' }}>
            <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Introduce un monto para depositar:</p>
                <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-white text-black"
                    placeholder='10.00'
                />
            </div>
            
            <PayPalButtonsComponent
                amount={amount}
                createOrder={handleCreateOrder}
                onApprove={handleOnApprove}
                onError={handleError}
            />
        </PayPalScriptProvider>
    );
}
