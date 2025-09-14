
'use server';

import { db } from './firebase';
import { doc, runTransaction, serverTimestamp, collection } from 'firebase/firestore';

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
const PAYPAL_SECRET_KEY = process.env.PAYPAL_SECRET_KEY;
const PAYPAL_API_BASE = 'https://api-m.sandbox.paypal.com'; // Use 'https://api-m.paypal.com' for live

/**
 * Gets a PayPal API access token.
 */
async function getPayPalAccessToken(): Promise<string> {
    if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET_KEY) {
        throw new Error('PayPal client ID or secret key is not configured.');
    }

    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET_KEY}`).toString('base64');
    
    const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${auth}`,
        },
        body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to get PayPal access token: ${errorData.error_description}`);
    }

    const data = await response.json();
    return data.access_token;
}

/**
 * Creates a PayPal order on the server.
 * @param amount The amount for the order.
 * @param userId The ID of the user initiating the order.
 * @returns The order ID from PayPal.
 */
export async function createPayPalOrder(amount: number, userId: string): Promise<string> {
  const accessToken = await getPayPalAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'PayPal-Request-Id': `order-${userId}-${Date.now()}`
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: amount.toFixed(2),
        },
        custom_id: userId, // Pass userId to identify the user after payment
      }],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('PayPal Order Creation Error:', errorData);
    throw new Error('Failed to create PayPal order.');
  }

  const data = await response.json();
  return data.id;
}


/**
 * Captures a PayPal order on the server after the user approves it.
 * @param orderId The ID of the order to capture.
 * @returns The result of the capture operation.
 */
export async function capturePayPalOrder(orderId: string): Promise<{ success: boolean; message: string; }> {
    const accessToken = await getPayPalAccessToken();

    const captureResponse = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
        },
    });

    if (!captureResponse.ok) {
        const errorData = await captureResponse.json();
        console.error('PayPal Capture Error:', errorData);
        throw new Error('Failed to capture PayPal payment.');
    }

    const captureData = await captureResponse.json();

    if (captureData.status === 'COMPLETED') {
        const purchaseUnit = captureData.purchase_units[0];
        const userId = purchaseUnit.custom_id;
        const amount = parseFloat(purchaseUnit.payments.captures[0].amount.value);

        if (!userId || !amount) {
            throw new Error('Capture data is missing user ID or amount.');
        }

        // Update user balance and log transaction in Firestore
        try {
            const userDocRef = doc(db, 'users', userId);
            const transactionsRef = collection(db, 'wallet_transactions');

            await runTransaction(db, async (transaction) => {
                 const userDoc = await transaction.get(userDocRef);
                 if (!userDoc.exists()) {
                    throw new Error("User profile not found for balance update.");
                 }
                 const newBalance = (userDoc.data().balance || 0) + amount;
                 transaction.update(userDocRef, { balance: newBalance });

                 // Log the transaction
                 transaction.set(doc(transactionsRef), {
                    type: 'paypal_deposit',
                    userId: userId,
                    userEmail: userDoc.data().email || '',
                    amount: amount,
                    paypalOrderId: orderId,
                    status: 'completed',
                    createdAt: serverTimestamp()
                 });
            });
            
            return { success: true, message: "El pago se ha procesado y tu saldo ha sido actualizado." };

        } catch (dbError: any) {
            console.error("Database update error after PayPal capture:", dbError);
            // This is a critical error. The payment was captured but the balance wasn't updated.
            // Requires manual intervention.
            throw new Error(`Payment captured but failed to update balance. Please contact support. Order ID: ${orderId}`);
        }
    } else {
        return { success: false, message: `El pago no se completó. Estado: ${captureData.status}` };
    }
}
