
'use server';

import { db } from '@/lib/firebase';
import { addDoc, collection, doc, getDoc, increment, runTransaction, serverTimestamp, updateDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

const WELCOME_BONUS = 100;

export async function requestWithdrawal(userId: string, amount: number) {
    if (!userId || !amount || amount <= 0) {
        throw new Error('Datos de solicitud de retiro inválidos.');
    }

    const userDocRef = doc(db, 'users', userId);
    const withdrawalRef = collection(db, 'withdrawals');

    try {
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
            throw new Error('Usuario no encontrado.');
        }

        const userData = userDoc.data();
        const withdrawableBalance = Math.max(0, userData.balance - WELCOME_BONUS);

        if (amount > withdrawableBalance) {
            throw new Error('El monto solicitado excede el saldo retirable.');
        }
        
        await addDoc(withdrawalRef, {
            userId: userId,
            userEmail: userData.email,
            amount: amount,
            status: 'pending',
            requestedAt: serverTimestamp(),
        });

        revalidatePath('/admin/withdrawals');
        
        return { success: true };

    } catch(e: any) {
        console.error("Error requesting withdrawal:", e);
        throw e;
    }
}


export async function processWithdrawal(requestId: string, action: 'approve' | 'reject') {
    if (!requestId || !action) {
        throw new Error('ID de solicitud y acción son requeridos.');
    }
    
    // This should also be protected by checking the caller's role (isSuperAdmin)
    // and with Firestore security rules.
    const requestDocRef = doc(db, 'withdrawals', requestId);

    try {
        await runTransaction(db, async (transaction) => {
            const requestDoc = await transaction.get(requestDocRef);

            if (!requestDoc.exists() || requestDoc.data().status !== 'pending') {
                throw new Error('La solicitud no existe o ya ha sido procesada.');
            }

            const { userId, amount } = requestDoc.data();
            const newStatus = action === 'approve' ? 'approved' : 'rejected';

            transaction.update(requestDocRef, {
                status: newStatus,
                processedAt: serverTimestamp(),
            });

            // If approved, deduct the amount from the user's balance
            if (action === 'approve') {
                const userDocRef = doc(db, 'users', userId);
                transaction.update(userDocRef, {
                    balance: increment(-amount)
                });
            }
        });

        revalidatePath('/admin/withdrawals');
        revalidatePath('/wallet');

    } catch (error) {
        console.error("Error processing withdrawal:", error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('No se pudo procesar la solicitud de retiro.');
    }
}


export async function submitDepositNotification(prevState: any, formData: FormData): Promise<{ success: boolean; message: string; }> {
    const userId = formData.get('userId') as string;
    const userEmail = formData.get('userEmail') as string;
    const amount = parseFloat(formData.get('amount') as string);
    const reference = formData.get('reference') as string;
    const notes = formData.get('notes') as string;

    if (!userId || !userEmail || !amount || !reference) {
        return { success: false, message: 'Faltan datos. El monto y la referencia son obligatorios.' };
    }
     if (amount <= 0) {
        return { success: false, message: 'El monto debe ser un número positivo.' };
    }

    try {
        const notificationsRef = collection(db, 'deposit_notifications');
        await addDoc(notificationsRef, {
            userId,
            userEmail,
            amount,
            reference,
            notes,
            status: 'pending',
            createdAt: serverTimestamp()
        });

        revalidatePath('/admin/deposits');
        return { success: true, message: 'Tu notificación ha sido enviada. El administrador la revisará pronto.' };

    } catch (error) {
        console.error('Error submitting deposit notification:', error);
        return { success: false, message: 'Ocurrió un error al enviar la notificación.' };
    }
}
