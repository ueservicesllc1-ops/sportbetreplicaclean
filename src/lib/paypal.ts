
'use server';

import { db } from '@/lib/firebase';
import { doc, serverTimestamp, runTransaction, increment } from 'firebase/firestore';

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
const PAYPAL_SECRET_KEY = process.env.PAYPAL_SECRET_KEY;
const base = 'https://api-m.sandbox.paypal.com';

async function generateAccessToken() {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET_KEY) {
    throw new Error('MISSING_API_CREDENTIALS');
  }
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET_KEY}`).toString('base64');
  const response = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    body: 'grant_type=client_credentials',
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });
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

  const jsonResponse = await response.json();
  return jsonResponse;
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
        const transactionsRef = doc(collection(db, 'wallet_transactions'));

        try {
            await runTransaction(db, async (transaction) => {
                const userDoc = await transaction.get(userDocRef);
                if (!userDoc.exists()) {
                    throw new Error('Usuario no encontrado.');
                }
                
                transaction.update(userDocRef, {
                    balance: increment(amount)
                });
                
                transaction.set(transactionsRef, {
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
        } catch (error) {
            console.error('Error updating user balance after PayPal capture:', error);
            // Even if the DB update fails, the capture was successful with PayPal.
            // This needs manual reconciliation. Log the error.
            return { success: false, message: 'Pago capturado pero hubo un error al actualizar el saldo.' };
        }
    }

    return { success: false, message: data.message || 'Error al capturar el pago.' };
}
