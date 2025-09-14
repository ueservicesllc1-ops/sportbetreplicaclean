
'use server';

import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';


export async function processDepositNotification(requestId: string, action: 'approve' | 'reject') {
    if (!requestId || !action) {
        throw new Error('ID de solicitud y acción son requeridos.');
    }
    
    const requestDocRef = doc(db, 'deposit_notifications', requestId);
    const newStatus = action === 'approve' ? 'completed' : 'rejected';

    try {
        await updateDoc(requestDocRef, {
            status: newStatus,
            processedAt: serverTimestamp(),
        });

        revalidatePath('/admin/deposits');
    } catch (error) {
        console.error("Error processing deposit notification:", error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('No se pudo procesar la notificación de depósito.');
    }
}
