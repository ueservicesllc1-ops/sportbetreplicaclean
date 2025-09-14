
'use server';

import { db } from '@/lib/firebase';
import { doc, serverTimestamp, runTransaction, increment, collection, addDoc } from 'firebase/firestore';

// Hardcoded LIVE production keys.
// This is done to ensure functionality in the prototyping environment, bypassing potential environment variable issues.
// This file is marked 'use server', so the SECRET KEY IS NOT EXPOSED to the client.
const PAYPAL_CLIENT_ID = "AfU-04zHwad560P4nU6LVMd7qnrY41c0TOdA9LUbN_6-lmztaHfxJz1p7-ByIt6-uoqSGr6OcdaO3b3m";
const PAYPAL_SECRET_KEY = "EAtL3bY-aWQRLkEhc0rQj9SDt4ZS3ZX7r9klbJfTEOIDEZvvRHQffPIxuNADHi6-CX1QUydHZ9HYRAGz";


// Using the LIVE production URL for all server-side calls.
const base = 'https://api-m.paypal.com';

async function generateAccessToken() {
  // Use the credentials from environment variables. The user must update these in Vercel.
  if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET_KEY) {
    throw new Error('Las credenciales de API de PayPal (Client ID o Secret) no están configuradas en el servidor.');
  }
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET_KEY}`).toString('base64');
  const response = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    body: 'grant_type=client_credentials',
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });
  
  if (!response.ok) {
    const errorBody = await response.json();
    console.error('PayPal Access Token Error:', errorBody);
    throw new Error('No se pudo generar el token de acceso de PayPal.');
  }

  const data = await response.json();
  return data.access_token;
}

export async function createOrder(amount: number) {
  const accessToken = await generateAccessToken();
  const url = `${base}/v2/checkout/orders`;
  const payload = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        amount: {
          currency_code: 'USD',
          value: amount.toFixed(2),
        },
      },
    ],
  };

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return response.json();
}

export async function captureOrder(orderID: string, userId: string): Promise<{ success: boolean, message?: string }> {
    const accessToken = await generateAccessToken();
    const url = `${base}/v2/checkout/orders/${orderID}/capture`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        },
    });

    const data = await response.json();

    if (data.status === 'COMPLETED') {
        const amount = parseFloat(data.purchase_units[0].payments.captures[0].amount.value);
        const userDocRef = doc(db, 'users', userId);

        try {
             await runTransaction(db, async (transaction) => {
                const userDoc = await transaction.get(userDocRef);
                if (!userDoc.exists()) {
                    throw new Error('Usuario no encontrado.');
                }

                // 1. Update user balance
                transaction.update(userDocRef, {
                    balance: increment(amount)
                });
                
                // 2. Create a new transaction log document inside the atomic transaction
                const transactionsRef = collection(db, 'wallet_transactions');
                const newTransactionRef = doc(transactionsRef);
                
                transaction.set(newTransactionRef, {
                    type: 'deposit_paypal',
                    userId,
                    userEmail: userDoc.data().email,
                    amount,
                    paypalOrderId: orderID,
                    status: 'completed',
                    createdAt: serverTimestamp()
                });
            });

            return { success: true };
        } catch (error: any) {
            console.error('Error updating user balance after PayPal capture:', error);
            // This needs manual reconciliation. Log the error.
            return { success: false, message: `Pago capturado, pero hubo un error al actualizar tu saldo. Por favor, contacta a soporte con el ID de orden: ${orderID}` };
        }
    }

    const errorMessage = data?.details?.[0]?.description || data.message || 'Error desconocido al capturar el pago.';
    return { success: false, message: errorMessage };
}
