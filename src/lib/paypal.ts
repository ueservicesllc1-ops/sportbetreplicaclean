
'use server';

import { db } from '@/lib/firebase';
import { doc, increment, runTransaction, serverTimestamp } from 'firebase/firestore';

const { PAYPAL_CLIENT_ID, PAYPAL_SECRET_KEY } = process.env;
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

export async function createOrder(amount: string) {
  const accessToken = await generateAccessToken();
  const url = `${base}/v2/checkout/orders`;
  
  const payload = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        amount: {
          currency_code: 'USD',
          value: amount,
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

  const data = await response.json();
  return data;
}

export async function captureOrder(orderID: string, userId: string) {
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
    
    // Update user balance in Firestore
    const userDocRef = doc(db, 'users', userId);
    const transactionsRef = doc(db, 'wallet_transactions', data.id);

    try {
        await runTransaction(db, async (transaction) => {
            transaction.update(userDocRef, { balance: increment(amount) });
            transaction.set(transactionsRef, {
                type: 'paypal_deposit',
                userId,
                amount,
                paypalOrderId: data.id,
                status: 'completed',
                createdAt: serverTimestamp()
            });
        });
    } catch (error) {
        console.error("Error updating user balance after PayPal capture:", error);
        // This case needs manual reconciliation.
        // For now, we'll just log the error. The capture was successful on PayPal's side.
    }
  }

  return data;
}
